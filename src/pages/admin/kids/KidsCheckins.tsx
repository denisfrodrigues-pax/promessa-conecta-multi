import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Baby,
  Clock,
  LogOut as LogOutIcon,
  Eye,
  MessageCircle,
  User,
  MapPin,
  Download,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Checkin {
  id: string;
  crianca_id: string;
  responsavel_id: string;
  sala_id: string;
  checkin_at: string;
  checkout_at: string | null;
  status: string;
  observacao: string | null;
  crianca: {
    id: string;
    nome: string;
    data_nascimento: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
    telefone: string | null;
  };
  sala: {
    id: string;
    nome: string;
  };
}

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string | null;
}

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  status: string;
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

const exportToCSV = (checkins: Checkin[]) => {
  const headers = ["Criança", "Idade", "Sala", "Responsável", "Telefone", "Check-in", "Check-out", "Status"];
  const rows = checkins.map((c) => [
    c.crianca?.nome || "",
    c.crianca?.data_nascimento ? calculateAge(c.crianca.data_nascimento) : "",
    c.sala?.nome || "",
    c.responsavel?.nome || "",
    c.responsavel?.telefone || "",
    c.checkin_at ? formatDateTime(c.checkin_at) : "",
    c.checkout_at ? formatDateTime(c.checkout_at) : "",
    statusLabels[c.status] || c.status,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `checkins_kids_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
};

export default function KidsCheckins() {
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSala, setFilterSala] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [newCheckin, setNewCheckin] = useState({
    crianca_id: "",
    responsavel_id: "",
    sala_id: "",
    observacao: "",
  });
  const [checkoutResponsavelId, setCheckoutResponsavelId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch checkins with related data
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins_kids")
        .select(
          `
          *,
          crianca:criancas(id, nome, data_nascimento),
          responsavel:responsaveis!checkins_kids_responsavel_id_fkey(id, nome, telefone),
          sala:salas(id, nome)
        `,
        )
        .order("checkin_at", { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckins(checkinsData || []);

      // Fetch criancas
      // Fetch criancas
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("igreja_id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.igreja_id) {
        throw new Error("Igreja não encontrada");
      }

      const { data: criancasData, error: criancasError } = await supabase
        .from("criancas")
        .select("id, nome, data_nascimento, sala_id")
        .eq("igreja_id", profile.igreja_id)
        .order("nome");

      if (criancasError) throw criancasError;

      setCriancas(criancasData || []);

      // Fetch responsaveis
      const { data: responsaveisData } = await supabase.from("responsaveis").select("id, nome, telefone").order("nome");
      setResponsaveis(responsaveisData || []);

      // Fetch salas
      const { data: salasData } = await supabase.from("salas").select("*").eq("status", "ativa").order("nome");
      setSalas(salasData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!newCheckin.crianca_id || !newCheckin.responsavel_id || !newCheckin.sala_id) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("checkins_kids").insert({
        crianca_id: newCheckin.crianca_id,
        responsavel_id: newCheckin.responsavel_id,
        sala_id: newCheckin.sala_id,
        observacao: newCheckin.observacao || null,
        status: "presente",
      });

      if (error) throw error;

      toast({ title: "Check-in realizado com sucesso!" });
      setShowCheckinModal(false);
      setNewCheckin({ crianca_id: "", responsavel_id: "", sala_id: "", observacao: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating checkin:", error);
      toast({
        title: "Erro ao realizar check-in",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCheckin || !checkoutResponsavelId) {
      toast({
        title: "Selecione o responsável que está retirando",
        variant: "destructive",
      });
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
        .eq("id", selectedCheckin.id);

      if (error) throw error;

      toast({ title: "Checkout realizado com sucesso!" });
      setShowCheckoutModal(false);
      setSelectedCheckin(null);
      setCheckoutResponsavelId("");
      fetchData();
    } catch (error) {
      console.error("Error doing checkout:", error);
      toast({
        title: "Erro ao realizar checkout",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openCheckoutModal = (checkin: Checkin) => {
    setSelectedCheckin(checkin);
    setShowCheckoutModal(true);
  };

  const filtered = checkins.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.crianca?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.responsavel?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchesSala = filterSala === "all" || c.sala_id === filterSala;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesSala && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Check-ins Kids</h1>
          <p className="text-muted-foreground">Gerencie a entrada e saída das crianças</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(filtered)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowCheckinModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Check-in
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por criança ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSala} onValueChange={setFilterSala}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as salas</SelectItem>
            {salas.map((sala) => (
              <SelectItem key={sala.id} value={sala.id}>
                {sala.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="presente">Presente</SelectItem>
            <SelectItem value="checkout">Checkout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Baby className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum check-in encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((checkin) => (
            <Card key={checkin.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{checkin.crianca?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {calculateAge(checkin.crianca?.data_nascimento || null)}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[checkin.status] || "bg-gray-100"}>
                    {statusLabels[checkin.status] || checkin.status}
                  </Badge>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{checkin.sala?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{checkin.responsavel?.nome}</span>
                    {hasValidPhone(checkin.responsavel?.telefone) && (
                      <a
                        href={getWhatsAppUrl(checkin.responsavel?.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(checkin.checkin_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/kids/checkin/${checkin.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detalhes
                  </Button>
                  {checkin.status === "presente" && (
                    <Button size="sm" className="flex-1" onClick={() => openCheckoutModal(checkin)}>
                      <LogOutIcon className="w-4 h-4 mr-1" />
                      Checkout
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Checkin Modal */}
      <Dialog open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Criança *</Label>
              <Select
                value={newCheckin.crianca_id}
                onValueChange={(v) => setNewCheckin({ ...newCheckin, crianca_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a criança" />
                </SelectTrigger>
                <SelectContent>
                  {criancas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.data_nascimento && `(${calculateAge(c.data_nascimento)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Select
                value={newCheckin.responsavel_id}
                onValueChange={(v) => setNewCheckin({ ...newCheckin, responsavel_id: v })}
              >
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
            <div className="space-y-2">
              <Label>Sala *</Label>
              <Select value={newCheckin.sala_id} onValueChange={(v) => setNewCheckin({ ...newCheckin, sala_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  {salas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={newCheckin.observacao}
                onChange={(e) => setNewCheckin({ ...newCheckin, observacao: e.target.value })}
                placeholder="Alguma observação importante?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckinModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckin} disabled={saving}>
              {saving ? "Salvando..." : "Confirmar Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Realizar Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckin && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedCheckin.crianca?.nome}</p>
                <p className="text-sm text-muted-foreground">Sala: {selectedCheckin.sala?.nome}</p>
              </div>
            )}
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
