import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Baby, Clock, LogOut as LogOutIcon, CheckCircle2, UserPlus, Phone } from "lucide-react";
import { format, differenceInYears, isToday, parseISO } from "date-fns";
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
  sala_id: string | null;
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

const formatTime = (date: string) => {
  return format(new Date(date), "HH:mm", { locale: ptBR });
};

const calculateAge = (birthDate: string | null): string => {
  if (!birthDate) return "–";
  const age = differenceInYears(new Date(), new Date(birthDate));
  return `${age} anos`;
};

export default function KidsCheckinPanel() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCadastroRapidoModal, setShowCadastroRapidoModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [newCheckin, setNewCheckin] = useState({
    crianca_id: "",
    responsavel_id: "",
    sala_id: "",
    observacao: "",
    updateFixedRoom: false,
  });
  const [checkoutResponsavelId, setCheckoutResponsavelId] = useState("");
  const [saving, setSaving] = useState(false);

  // Cadastro rápido state
  const [cadastroRapido, setCadastroRapido] = useState({
    // Responsável
    responsavel_nome: "",
    responsavel_telefone: "",
    // Criança
    crianca_nome: "",
    crianca_data_nascimento: "",
    crianca_alergias: "",
    crianca_observacoes: "",
    autoriza_foto: false,
    // Check-in
    sala_id: "",
    checkin_observacao: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch today's checkins with related data
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins_kids")
        .select(
          `
  *,
  crianca:criancas(id, nome, data_nascimento),
  responsavel:responsaveis!checkins_kids_responsavel_id_fkey(id, nome, telefone),
  sala:salas_kids!checkins_kids_sala_id_fkey(id, nome)
`,
        )
        .gte("checkin_at", todayStart.toISOString())
        .order("checkin_at", { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckins(checkinsData || []);

      // Fetch criancas
      const { data: criancasData } = await supabase
        .from("criancas")
        .select("id, nome, data_nascimento, sala_id")
        .order("nome");
      setCriancas(criancasData || []);

      // Fetch responsaveis
      const { data: responsaveisData } = await supabase.from("responsaveis").select("id, nome, telefone").order("nome");
      setResponsaveis(responsaveisData || []);

      // Fetch salas
      const { data: salasData } = await supabase.from("salas_kids").select("*").eq("status", "ativa").order("nome");
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

      // Optionally update fixed room
      if (newCheckin.updateFixedRoom && newCheckin.sala_id) {
        await supabase.from("criancas").update({ sala_id: newCheckin.sala_id }).eq("id", newCheckin.crianca_id);
      }

      toast({ title: "Check-in realizado com sucesso!" });
      setShowCheckinModal(false);
      setNewCheckin({ crianca_id: "", responsavel_id: "", sala_id: "", observacao: "", updateFixedRoom: false });
      fetchData();
    } catch (error: any) {
      console.error("Erro ao realizar check-in:", error);
      const msg = error?.message || "Erro desconhecido";
      toast({
        title: "Erro ao realizar check-in",
        description: msg,
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

  const handleCadastroRapido = async () => {
    // Validações
    if (!cadastroRapido.responsavel_nome.trim()) {
      toast({ title: "Informe o nome do responsável", variant: "destructive" });
      return;
    }
    if (!cadastroRapido.crianca_nome.trim()) {
      toast({ title: "Informe o nome da criança", variant: "destructive" });
      return;
    }
    if (!cadastroRapido.sala_id) {
      toast({ title: "Selecione uma sala", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Buscar o profile_id do usuário logado (necessário para criancas.responsavel_id)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profileData) throw new Error("Profile não encontrado");

      // 1. Criar responsável na tabela responsaveis (para o check-in)
      const { data: responsavelData, error: responsavelError } = await supabase
        .from("responsaveis")
        .insert({
          nome: cadastroRapido.responsavel_nome.trim(),
          telefone: cadastroRapido.responsavel_telefone.trim() || null,
        })
        .select()
        .single();

      if (responsavelError) throw responsavelError;

      // 2. Criar criança (responsavel_id refere-se ao profile do usuário logado)
      const { data: criancaData, error: criancaError } = await supabase
        .from("criancas")
        .insert({
          nome: cadastroRapido.crianca_nome.trim(),
          data_nascimento: cadastroRapido.crianca_data_nascimento || null,
          alergias: cadastroRapido.crianca_alergias.trim() || null,
          observacoes: cadastroRapido.crianca_observacoes.trim() || null,
          autoriza_foto: cadastroRapido.autoriza_foto,
          sala_id: cadastroRapido.sala_id || null,
          responsavel_id: profileData.id, // Referência ao profile do usuário logado
        })
        .select()
        .single();

      if (criancaError) throw criancaError;

      // 3. Criar relacionamento na tabela criancas_responsaveis
      const { error: relError } = await supabase.from("criancas_responsaveis").insert({
        crianca_id: criancaData.id,
        responsavel_id: responsavelData.id,
        tipo_relacao: "responsável",
      });

      if (relError) {
        console.warn("Erro ao criar relacionamento:", relError);
      }

      // 4. Fazer check-in
      const { error: checkinError } = await supabase.from("checkins_kids").insert({
        crianca_id: criancaData.id,
        responsavel_id: responsavelData.id,
        sala_id: cadastroRapido.sala_id,
        observacao: cadastroRapido.checkin_observacao.trim() || null,
        status: "presente",
      });

      if (checkinError) throw checkinError;

      toast({
        title: "Cadastro e check-in realizados!",
        description: `${criancaData.nome} foi cadastrado(a) e está presente.`,
      });

      // Reset e atualizar
      setShowCadastroRapidoModal(false);
      setCadastroRapido({
        responsavel_nome: "",
        responsavel_telefone: "",
        crianca_nome: "",
        crianca_data_nascimento: "",
        crianca_alergias: "",
        crianca_observacoes: "",
        autoriza_foto: false,
        sala_id: "",
        checkin_observacao: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Erro no cadastro rápido:", error);
      const msg = error?.message || "Erro desconhecido";
      toast({
        title: "Erro ao cadastrar",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter criancas by search
  const filteredCriancas = criancas.filter((c) => search === "" || c.nome.toLowerCase().includes(search.toLowerCase()));

  // Today's checkins
  const todayCheckins = checkins.filter((c) => isToday(parseISO(c.checkin_at)));
  const presentCount = todayCheckins.filter((c) => c.status === "presente").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Status do dia */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Baby className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crianças presentes</p>
                <p className="text-2xl font-bold text-primary">{presentCount}</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca rápida e ações */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Buscar criança */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar criança cadastrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Digite o nome da criança..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && filteredCriancas.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredCriancas.slice(0, 5).map((crianca) => (
                  <button
                    key={crianca.id}
                    className="w-full text-left p-2 rounded-md hover:bg-muted flex items-center justify-between"
                    onClick={() => {
                      const preselectedSala = crianca.sala_id || "";
                      setNewCheckin({
                        ...newCheckin,
                        crianca_id: crianca.id,
                        sala_id: preselectedSala,
                        updateFixedRoom: false,
                      });
                      setSearch("");
                      setShowCheckinModal(true);
                    }}
                  >
                    <span className="font-medium">{crianca.nome}</span>
                    <span className="text-xs text-muted-foreground">{calculateAge(crianca.data_nascimento)}</span>
                  </button>
                ))}
              </div>
            )}
            {search && filteredCriancas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhuma criança encontrada</p>
            )}
          </CardContent>
        </Card>

        {/* Novo cadastro + check-in */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Nova criança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Primeira vez? Cadastre a criança e faça o check-in ao mesmo tempo.
            </p>
            <Button className="w-full" onClick={() => setShowCadastroRapidoModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo cadastro + Check-in
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Check-ins do dia */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Check-ins de hoje
            </CardTitle>
            <Badge variant="secondary">{todayCheckins.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {todayCheckins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Baby className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum check-in realizado hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Baby className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{checkin.crianca?.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{checkin.sala?.nome}</span>
                        <span>•</span>
                        <span>{formatTime(checkin.checkin_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[checkin.status] || "bg-gray-100"}>
                      {statusLabels[checkin.status] || checkin.status}
                    </Badge>
                    {checkin.status === "presente" && (
                      <Button size="sm" variant="outline" onClick={() => openCheckoutModal(checkin)}>
                        <LogOutIcon className="w-3 h-3 mr-1" />
                        Checkout
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                onValueChange={(v) => {
                  const selected = criancas.find((c) => c.id === v);
                  setNewCheckin({
                    ...newCheckin,
                    crianca_id: v,
                    sala_id: selected?.sala_id || newCheckin.sala_id,
                    updateFixedRoom: false,
                  });
                }}
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
                placeholder="Alguma informação importante?"
                value={newCheckin.observacao}
                onChange={(e) => setNewCheckin({ ...newCheckin, observacao: e.target.value })}
              />
            </div>
            {newCheckin.crianca_id &&
              (() => {
                const selected = criancas.find((c) => c.id === newCheckin.crianca_id);
                return selected && newCheckin.sala_id && selected.sala_id !== newCheckin.sala_id;
              })() && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="updateFixedRoom"
                    checked={newCheckin.updateFixedRoom}
                    onCheckedChange={(checked) => setNewCheckin({ ...newCheckin, updateFixedRoom: !!checked })}
                  />
                  <Label htmlFor="updateFixedRoom" className="text-sm font-normal cursor-pointer">
                    Atualizar sala principal desta criança
                  </Label>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckinModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckin} disabled={saving}>
              {saving ? "Salvando..." : "Fazer Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCheckin && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedCheckin.crianca?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Check-in às {formatTime(selectedCheckin.checkin_at)} • {selectedCheckin.sala?.nome}
                </p>
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

      {/* Cadastro Rápido Modal */}
      <Dialog open={showCadastroRapidoModal} onOpenChange={setShowCadastroRapidoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Cadastro Rápido + Check-in
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Dados do Responsável */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Dados do Responsável
              </h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Nome do responsável *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={cadastroRapido.responsavel_nome}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, responsavel_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={cadastroRapido.responsavel_telefone}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, responsavel_telefone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Dados da Criança */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Baby className="w-4 h-4" />
                Dados da Criança
              </h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Nome da criança *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={cadastroRapido.crianca_nome}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, crianca_nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de nascimento</Label>
                  <Input
                    type="date"
                    value={cadastroRapido.crianca_data_nascimento}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, crianca_data_nascimento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alergias</Label>
                  <Input
                    placeholder="Ex: amendoim, lactose..."
                    value={cadastroRapido.crianca_alergias}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, crianca_alergias: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações sobre a criança</Label>
                  <Textarea
                    placeholder="Informações relevantes..."
                    value={cadastroRapido.crianca_observacoes}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, crianca_observacoes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoriza_foto"
                    checked={cadastroRapido.autoriza_foto}
                    onCheckedChange={(checked) => setCadastroRapido({ ...cadastroRapido, autoriza_foto: !!checked })}
                  />
                  <Label htmlFor="autoriza_foto" className="text-sm font-normal cursor-pointer">
                    Autorizo uso de fotos para divulgação
                  </Label>
                </div>
              </div>
            </div>

            {/* Dados do Check-in */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Check-in
              </h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Sala *</Label>
                  <Select
                    value={cadastroRapido.sala_id}
                    onValueChange={(v) => setCadastroRapido({ ...cadastroRapido, sala_id: v })}
                  >
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
                  <Label>Observação do check-in</Label>
                  <Textarea
                    placeholder="Alguma informação para hoje?"
                    value={cadastroRapido.checkin_observacao}
                    onChange={(e) => setCadastroRapido({ ...cadastroRapido, checkin_observacao: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCadastroRapidoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCadastroRapido} disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar e Fazer Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
