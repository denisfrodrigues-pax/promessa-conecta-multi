import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Baby,
  Clock,
  LogOut as LogOutIcon,
  MessageCircle,
  User,
  MapPin,
  Calendar,
  FileText,
  Save,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Responsavel {
  id: string;
  nome: string;
  telefone: string | null;
  tipo_relacao?: string;
}

interface Checkin {
  id: string;
  crianca_id: string;
  responsavel_id: string;
  sala_id: string;
  checkin_at: string;
  checkout_at: string | null;
  checkout_responsavel_id: string | null;
  status: string;
  observacao: string | null;
  crianca: {
    id: string;
    nome: string;
    data_nascimento: string | null;
    observacoes: string | null;
    alergias: string | null;
  };
  responsavel: Responsavel;
  sala: {
    id: string;
    nome: string;
  };
  checkout_responsavel?: Responsavel;
}

const statusLabels: Record<string, string> = {
  presente: "Presente",
  checkout: "Checkout",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  presente: "bg-green-100 text-green-800 border-green-200",
  checkout: "bg-blue-100 text-blue-800 border-blue-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const cleanPhone = (phone: string | null): string => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  return `https://wa.me/55${cleaned}`;
};

const formatDateTime = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const calculateAge = (birthDate: string | null): string => {
  if (!birthDate) return "–";
  const age = differenceInYears(new Date(), new Date(birthDate));
  return `${age} anos`;
};

export default function KidsCheckinDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [criancaResponsaveis, setCriancaResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutResponsavelId, setCheckoutResponsavelId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch checkin with related data
      const { data: checkinData, error: checkinError } = await supabase
        .from("checkins_kids")
        .select(
          `
          *,
          crianca:criancas(id, nome, data_nascimento, observacoes, alergias),
          responsavel:responsaveis!checkins_kids_responsavel_id_fkey(id, nome, telefone),
          sala:salas!checkins_kids_sala_id_fkey(id, nome),
          checkout_responsavel:responsaveis!checkins_kids_checkout_responsavel_id_fkey(id, nome, telefone)
        `,
        )
        .eq("id", id)
        .maybeSingle();

      if (checkinError) throw checkinError;
      if (!checkinData) {
        toast.error('Check-in não encontrado');
        navigate("/admin/kids");
        return;
      }

      setCheckin(checkinData);
      setObservacao(checkinData.observacao || "");

      // Fetch all responsaveis
      const { data: responsaveisData } = await supabase.from("responsaveis").select("id, nome, telefone").order("nome");
      setResponsaveis(responsaveisData || []);

      // Fetch crianca's linked responsaveis
      const { data: criancaResp } = await supabase
        .from("criancas_responsaveis")
        .select(
          `
          tipo_relacao,
          responsavel:responsaveis(id, nome, telefone)
        `,
        )
        .eq("crianca_id", checkinData.crianca_id);

      if (criancaResp) {
        setCriancaResponsaveis(
          criancaResp.map((cr: any) => ({
            ...cr.responsavel,
            tipo_relacao: cr.tipo_relacao,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObservacao = async () => {
    if (!checkin) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("checkins_kids").update({ observacao }).eq("id", checkin.id);

      if (error) throw error;

      toast.success('Observação salva!');
      fetchData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkin || !checkoutResponsavelId) {
      toast.error('Selecione o responsável que está retirando');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkins_kids")
        .update({
          checkout_at: new Date().toISOString(),
          checkout_responsavel_id: checkoutResponsavelId,
          status: "checkout",
        })
        .eq("id", checkin.id);

      if (error) throw error;

      toast.success('Checkout realizado com sucesso!');
      setShowCheckoutModal(false);
      fetchData();
    } catch (error) {
      console.error("Error doing checkout:", error);
      toast.error('Erro ao realizar checkout');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!checkin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/kids")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{checkin.crianca?.nome}</h1>
            <Badge className={statusColors[checkin.status]}>{statusLabels[checkin.status]}</Badge>
          </div>
          <p className="text-muted-foreground">Detalhes do check-in</p>
        </div>
        {checkin.status === "presente" && (
          <Button onClick={() => setShowCheckoutModal(true)}>
            <LogOutIcon className="w-4 h-4 mr-2" />
            Realizar Checkout
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Criança Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5" />
              Dados da Criança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{checkin.crianca?.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Idade</p>
                <p className="font-medium">{calculateAge(checkin.crianca?.data_nascimento || null)}</p>
              </div>
              {checkin.crianca?.data_nascimento && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{format(new Date(checkin.crianca.data_nascimento), "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>

            {checkin.crianca?.alergias && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">⚠️ Alergias</p>
                <p className="text-sm text-red-700">{checkin.crianca.alergias}</p>
              </div>
            )}

            {checkin.crianca?.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm">{checkin.crianca.observacoes}</p>
              </div>
            )}

            {/* Responsáveis vinculados */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Responsáveis Vinculados</p>
              <div className="space-y-2">
                {criancaResponsaveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum responsável vinculado</p>
                ) : (
                  criancaResponsaveis.map((resp) => (
                    <div key={resp.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium text-sm">{resp.nome}</p>
                        <p className="text-xs text-muted-foreground">{resp.tipo_relacao}</p>
                      </div>
                      {hasValidPhone(resp.telefone) && (
                        <a
                          href={getWhatsAppUrl(resp.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 p-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dados do Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sala</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{checkin.sala?.nome}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={statusColors[checkin.status]}>{statusLabels[checkin.status]}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{formatDateTime(checkin.checkin_at)}</p>
                </div>
              </div>
              {checkin.checkout_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{formatDateTime(checkin.checkout_at)}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Responsável do Check-in</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{checkin.responsavel?.nome}</span>
                {hasValidPhone(checkin.responsavel?.telefone) && (
                  <a
                    href={getWhatsAppUrl(checkin.responsavel?.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 ml-auto"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {checkin.checkout_responsavel && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Responsável do Check-out</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{checkin.checkout_responsavel?.nome}</span>
                  {hasValidPhone(checkin.checkout_responsavel?.telefone) && (
                    <a
                      href={getWhatsAppUrl(checkin.checkout_responsavel?.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 ml-auto"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observação
              </Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Adicione uma observação..."
                rows={3}
              />
              <Button size="sm" onClick={handleSaveObservacao} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Observação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{checkin.crianca?.nome}</p>
              <p className="text-sm text-muted-foreground">Sala: {checkin.sala?.nome}</p>
            </div>
            <div className="space-y-2">
              <Label>Quem está retirando? *</Label>
              <Select value={checkoutResponsavelId} onValueChange={setCheckoutResponsavelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
