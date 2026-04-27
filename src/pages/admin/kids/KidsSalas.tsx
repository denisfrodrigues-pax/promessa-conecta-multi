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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Search, Plus, MapPin, Edit, Trash2, Baby, Clock, UserMinus, UserPlus } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  observacao: string | null;
  status: string;
}

interface CriancaVinculada {
  id: string;
  nome: string;
  data_nascimento: string | null;
}

interface CheckinHoje {
  id: string;
  crianca_nome: string;
  checkin_at: string;
  status: string;
}

interface CriancaDisponivel {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sala_id: string | null;
}

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
};

const statusColors: Record<string, string> = {
  ativa: "bg-green-100 text-green-800 border-green-200",
  inativa: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function KidsSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    capacidade: "20",
    observacao: "",
    status: "ativa",
  });
  const [saving, setSaving] = useState(false);

  // Detail view state
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [criancasVinculadas, setCriancasVinculadas] = useState<CriancaVinculada[]>([]);
  const [checkinsHoje, setCheckinsHoje] = useState<CheckinHoje[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add child to room
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [criancasDisponiveis, setCriancasDisponiveis] = useState<CriancaDisponivel[]>([]);
  const [childSearch, setChildSearch] = useState("");
  const [todayCheckinCounts, setTodayCheckinCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("salas").select("*").order("nome");

      if (error) throw error;
      setSalas(data || []);

      // Get today's checkin counts per sala
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: checkins } = await supabase
        .from("checkins_kids")
        .select("sala_id")
        .gte("checkin_at", todayStart.toISOString())
        .eq("status", "presente");

      const counts: Record<string, number> = {};
      (checkins || []).forEach((c) => {
        counts[c.sala_id] = (counts[c.sala_id] || 0) + 1;
      });
      setTodayCheckinCounts(counts);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error('Erro ao carregar dados', { description: error?.message || String(error) });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaDetail = async (sala: Sala) => {
    setSelectedSala(sala);
    setLoadingDetail(true);
    try {
      // Fetch fixed children (sala_id on criancas)
      const { data: criancas, error: criancasError } = await supabase
        .from("criancas")
        .select("id, nome, data_nascimento")
        .eq("sala_id", sala.id)
        .order("nome");

      if (criancasError) throw criancasError;
      setCriancasVinculadas(criancas || []);

      // Fetch today's checkins for this room
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: checkins, error: checkinsError } = await supabase
        .from("checkins_kids")
        .select("id, checkin_at, status, crianca:criancas(nome)")
        .eq("sala_id", sala.id)
        .gte("checkin_at", todayStart.toISOString())
        .order("checkin_at", { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckinsHoje(
        (checkins || []).map((c: any) => ({
          id: c.id,
          crianca_nome: c.crianca?.nome || "Desconhecida",
          checkin_at: c.checkin_at,
          status: c.status,
        })),
      );
    } catch (error) {
      console.error("Error fetching sala detail:", error);
      toast.error('Erro ao carregar detalhes', { description: (error as Error)?.message || String(error) });
    } finally {
      setLoadingDetail(false);
    }
  };

  const openNewModal = () => {
    setEditingSala(null);
    setFormData({ nome: "", capacidade: "20", observacao: "", status: "ativa" });
    setShowModal(true);
  };

  const openEditModal = (sala: Sala) => {
    setEditingSala(sala);
    setFormData({
      nome: sala.nome,
      capacidade: sala.capacidade.toString(),
      observacao: sala.observacao || "",
      status: sala.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        capacidade: parseInt(formData.capacidade) || 20,
        observacao: formData.observacao || null,
        status: formData.status,
      };

      if (editingSala) {
        const { error } = await supabase.from("salas").update(payload).eq("id", editingSala.id);
        if (error) throw error;
      } else {
        // Buscar usuário logado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Usuário não autenticado");

        // Buscar igreja do usuário
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("igreja_id")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile?.igreja_id) {
          throw new Error("Igreja não encontrada para o usuário");
        }

        // Buscar ministério Kids
        const { data: ministerioKids, error: ministerioError } = await supabase
          .from("ministerios")
          .select("id")
          .ilike("nome", "%kids%")
          .eq("igreja_id", profile.igreja_id)
          .maybeSingle();

        if (ministerioError || !ministerioKids?.id) {
          throw new Error("Ministério Kids não encontrado");
        }

        // Inserir sala corretamente
        const { error } = await supabase.from("salas").insert({
          ...payload,
          igreja_id: profile.igreja_id,
          ministerio_id: ministerioKids.id,
        });

        if (error) throw error;
      }

      toast.success(editingSala ? 'Sala atualizada!' : 'Sala cadastrada!');
      setShowModal(false);
      fetchData();
      if (selectedSala && editingSala?.id === selectedSala.id) {
        fetchSalaDetail({ ...selectedSala, ...payload });
      }
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error('Erro ao salvar', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sala: Sala) => {
    if (!confirm(`Tem certeza que deseja excluir a sala ${sala.nome}?`)) return;

    try {
      const { error } = await supabase.from("salas").delete().eq("id", sala.id);

      if (error) throw error;

      toast.success('Sala excluída!');
      if (selectedSala?.id === sala.id) setSelectedSala(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error('Erro ao excluir. A sala pode estar vinculada a check-ins.', { description: error?.message });
    }
  };

  const openAddChildModal = async () => {
    if (!selectedSala) return;
    setChildSearch("");
    setShowAddChildModal(true);

    // Fetch children not assigned to this room
    const { data, error } = await supabase
      .from("criancas")
      .select("id, nome, data_nascimento, sala_id")
      .or(`sala_id.is.null,sala_id.neq.${selectedSala.id}`)
      .order("nome");

    if (!error) {
      setCriancasDisponiveis(data || []);
    }
  };

  const assignChildToRoom = async (criancaId: string) => {
    if (!selectedSala) return;
    try {
      const { error } = await supabase.from("criancas").update({ sala_id: selectedSala.id }).eq("id", criancaId);

      if (error) throw error;
      toast.success('Criança vinculada à sala!');
      fetchSalaDetail(selectedSala);
      setCriancasDisponiveis((prev) => prev.filter((c) => c.id !== criancaId));
    } catch (error: any) {
      console.error("Error assigning child:", error);
      toast.error('Erro ao vincular criança', { description: error?.message || String(error) });
    }
  };

  const removeChildFromRoom = async (criancaId: string) => {
    if (!selectedSala) return;
    try {
      const { error } = await supabase.from("criancas").update({ sala_id: null }).eq("id", criancaId);

      if (error) throw error;
      toast.success('Criança removida da sala!');
      fetchSalaDetail(selectedSala);
    } catch (error: any) {
      console.error("Error removing child:", error);
      toast.error('Erro ao remover criança', { description: error?.message || String(error) });
    }
  };

  const getOcupacaoHoje = (salaId: string): number => {
    return todayCheckinCounts[salaId] || 0;
  };

  const getOcupacaoPercent = (sala: Sala): number => {
    if (!sala.capacidade) return 0;
    return Math.min(100, (getOcupacaoHoje(sala.id) / sala.capacidade) * 100);
  };

  const filtered = salas.filter((s) => search === "" || s.nome.toLowerCase().includes(search.toLowerCase()));

  const filteredDisponiveis = criancasDisponiveis.filter(
    (c) => childSearch === "" || c.nome.toLowerCase().includes(childSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
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
          <h1 className="text-2xl font-bold text-foreground">Salas</h1>
          <p className="text-muted-foreground">Gerencie as salas do ministério Kids</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Sala
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cards Grid */}
        <div className={selectedSala ? "lg:col-span-1" : "lg:col-span-3"}>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma sala encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${selectedSala ? "" : "md:grid-cols-2 lg:grid-cols-3"}`}>
              {filtered.map((sala) => (
                <Card
                  key={sala.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${selectedSala?.id === sala.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => fetchSalaDetail(sala)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{sala.nome}</p>
                        </div>
                      </div>
                      <Badge className={statusColors[sala.status]}>{statusLabels[sala.status]}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Baby className="w-4 h-4" />
                          Ocupação hoje
                        </span>
                        <span className="font-medium">
                          {getOcupacaoHoje(sala.id)} / {sala.capacidade}
                        </span>
                      </div>
                      <Progress value={getOcupacaoPercent(sala)} className="h-2" />
                    </div>

                    <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(sala)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sala)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedSala && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedSala.nome}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSala(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {loadingDetail ? (
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : (
              <>
                {/* Fixed children */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Baby className="w-4 h-4" />
                        Crianças desta sala ({criancasVinculadas.length})
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={openAddChildModal}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {criancasVinculadas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma criança vinculada a esta sala
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {criancasVinculadas.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Baby className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{c.nome}</span>
                              {c.data_nascimento && (
                                <span className="text-xs text-muted-foreground">
                                  ({format(new Date(c.data_nascimento), "dd/MM/yyyy")})
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 px-2"
                              onClick={() => removeChildFromRoom(c.id)}
                            >
                              <UserMinus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Today's checkins */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Check-ins de hoje ({checkinsHoje.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checkinsHoje.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum check-in hoje nesta sala</p>
                    ) : (
                      <div className="space-y-2">
                        {checkinsHoje.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Baby className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{c.crianca_nome}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(c.checkin_at), "HH:mm")}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {c.status === "presente" ? "Presente" : c.status === "checkout" ? "Checkout" : c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sala Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSala ? "Editar Sala" : "Nova Sala"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Berçário, 3-5 anos"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                type="number"
                value={formData.capacidade}
                onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Observações sobre a sala"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Child to Room Modal */}
      <Dialog open={showAddChildModal} onOpenChange={setShowAddChildModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar criança à sala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Buscar criança..."
              value={childSearch}
              onChange={(e) => setChildSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredDisponiveis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma criança disponível</p>
              ) : (
                filteredDisponiveis.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left p-2 rounded-md hover:bg-muted flex items-center justify-between"
                    onClick={() => assignChildToRoom(c.id)}
                  >
                    <div>
                      <span className="font-medium text-sm">{c.nome}</span>
                      {c.sala_id && <span className="text-xs text-muted-foreground ml-2">(já em outra sala)</span>}
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
