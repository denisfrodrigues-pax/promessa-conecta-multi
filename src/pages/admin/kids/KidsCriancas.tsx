import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Baby, Eye, Calendar, Edit, Trash2 } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  observacoes: string | null;
  sala_id: string | null;
  responsaveis_count?: number;
  sala_nome?: string;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string | null;
}

interface SalaOption {
  id: string;
  nome: string;
}

const calculateAge = (birthDate: string | null): string => {
  if (!birthDate) return "–";
  const age = differenceInYears(new Date(), new Date(birthDate));
  return `${age} anos`;
};

export default function KidsCriancas() {
  const navigate = useNavigate();
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [salas, setSalas] = useState<SalaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showResponsavelModal, setShowResponsavelModal] = useState(false);
  const [editingCrianca, setEditingCrianca] = useState<Crianca | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    observacoes: "",
    sala_id: "",
    responsaveis_ids: [] as string[],
  });
  const [newResponsavel, setNewResponsavel] = useState({
    nome: "",
    telefone: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const IGREJA_ID = "6326bd8b-ee1c-4b42-acb8-9cb597a8e61c";
  const MINISTERIO_ID = "41ee4d7b-9eae-46b7-95c7-33831ccce854";

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Buscar crianças da igreja
      const { data: criancasData, error } = await supabase
        .from("criancas")
        .select("*")
        .eq("igreja_id", IGREJA_ID)
        .order("nome");

      if (error) throw error;

      // 2️⃣ Buscar vínculos criança ↔ responsável
      const { data: vinculos } = await supabase.from("crianca_responsavel").select("crianca_id, profile_id");

      // 3️⃣ Buscar salas do ministério
      const { data: salasData } = await supabase.from("salas").select("id, nome").eq("ministerio_id", MINISTERIO_ID);

      // Mapear sala por id
      const salasMap = new Map((salasData || []).map((s) => [s.id, s.nome]));

      // 4️⃣ Contar responsáveis por criança
      const criancasComExtras = (criancasData || []).map((crianca: any) => {
        const responsaveisCount = (vinculos || []).filter((v) => v.crianca_id === crianca.id).length;

        return {
          ...crianca,
          responsaveis_count: responsaveisCount,
          sala_nome: crianca.sala_id ? salasMap.get(crianca.sala_id) : null,
        };
      });

      setCriancas(criancasComExtras);

      // 5️⃣ Buscar profiles (responsáveis)
      const { data: responsaveisData } = await supabase
        .from("profiles")
        .select("id, nome, telefone")
        .eq("igreja_id", IGREJA_ID)
        .order("nome");

      setResponsaveis(responsaveisData || []);

      // 6️⃣ Setar salas
      setSalas(salasData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingCrianca(null);
    setFormData({
      nome: "",
      data_nascimento: "",
      observacoes: "",
      alergias: "",
      sala_id: "",
      responsaveis_ids: [],
    });
    setShowModal(true);
  };

  const openEditModal = async (crianca: Crianca) => {
    setEditingCrianca(crianca);

    // Fetch linked responsaveis
    const { data: links } = await supabase
      .from("criancas_responsaveis")
      .select("responsavel_id")
      .eq("crianca_id", crianca.id);

    setFormData({
      nome: crianca.nome,
      data_nascimento: crianca.data_nascimento || "",
      observacoes: crianca.observacoes || "",
      sala_id: crianca.sala_id || "",
      responsaveis_ids: links?.map((l) => l.responsavel_id) || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      let criancaId = editingCrianca?.id;

      if (editingCrianca) {
        const { error } = await supabase
          .from("criancas")
          .update({
            nome: formData.nome,
            data_nascimento: formData.data_nascimento || null,
            observacoes: formData.observacoes || null,
            sala_id: formData.sala_id || null,
          })
          .eq("id", editingCrianca.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("criancas")
          .insert({
            igreja_id: IGREJA_ID,
            nome: formData.nome,
            data_nascimento: formData.data_nascimento || null,
            observacoes: formData.observacoes || null,
            sala_id: formData.sala_id || null,
          })
          .select()
          .single();

        if (error) throw error;
        criancaId = data.id;
      }

      if (criancaId) {
        await supabase.from("crianca_responsavel").delete().eq("crianca_id", criancaId);

        if (formData.responsaveis_ids.length > 0) {
          const links = formData.responsaveis_ids.map((profileId) => ({
            crianca_id: criancaId,
            profile_id: profileId,
            parentesco: "responsável",
          }));

          const { error: linkError } = await supabase.from("crianca_responsavel").insert(links);

          if (linkError) throw linkError;
        }
      }

      toast({
        title: editingCrianca ? "Criança atualizada!" : "Criança cadastrada!",
      });

      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar criança:", error);

      toast({
        title: "Erro ao salvar criança",
        description: error?.message || JSON.stringify(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (crianca: Crianca) => {
    if (!confirm(`Tem certeza que deseja excluir ${crianca.nome}?`)) return;

    try {
      const { error } = await supabase.from("criancas").delete().eq("id", crianca.id);

      if (error) throw error;

      toast({ title: "Criança excluída!" });
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleSaveResponsavel = async () => {
    if (!newResponsavel.nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("responsaveis")
        .insert({
          nome: newResponsavel.nome,
          telefone: newResponsavel.telefone || null,
          observacoes: newResponsavel.observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Responsável cadastrado!" });
      setResponsaveis([...responsaveis, data]);
      setFormData({
        ...formData,
        responsaveis_ids: [...formData.responsaveis_ids, data.id],
      });
      setShowResponsavelModal(false);
      setNewResponsavel({ nome: "", telefone: "", observacoes: "" });
    } catch (error: any) {
      console.error("Erro ao salvar responsável:", error);
      const msg = error?.message || "Erro desconhecido";
      toast({ title: "Erro ao salvar responsável", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleResponsavel = (respId: string) => {
    if (formData.responsaveis_ids.includes(respId)) {
      setFormData({
        ...formData,
        responsaveis_ids: formData.responsaveis_ids.filter((id) => id !== respId),
      });
    } else {
      setFormData({
        ...formData,
        responsaveis_ids: [...formData.responsaveis_ids, respId],
      });
    }
  };

  const filtered = criancas.filter((c) => search === "" || c.nome.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-2xl font-bold text-foreground">Crianças</h1>
          <p className="text-muted-foreground">Gerencie o cadastro das crianças</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Criança
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

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Baby className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma criança encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((crianca) => (
            <Card key={crianca.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{crianca.nome}</p>
                      <p className="text-sm text-muted-foreground">{calculateAge(crianca.data_nascimento)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {crianca.data_nascimento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(crianca.data_nascimento), "dd/MM/yyyy")}</span>
                    </div>
                  )}
                  <p>{crianca.responsaveis_count} responsável(is)</p>
                  {crianca.sala_nome && <p className="text-xs">🏠 Sala: {crianca.sala_nome}</p>}
                </div>

                {crianca.alergias && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ {crianca.alergias}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(crianca)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(crianca)}
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

      {/* Criança Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCrianca ? "Editar Criança" : "Nova Criança"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da criança"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Alergias</Label>
              <Input
                value={formData.alergias}
                onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                placeholder="Alergias conhecidas"
              />
            </div>
            <div className="space-y-2">
              <Label>Sala principal</Label>
              <Select
                value={formData.sala_id}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    sala_id: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {salas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações importantes"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Responsáveis</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowResponsavelModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Novo
                </Button>
              </div>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {responsaveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado</p>
                ) : (
                  responsaveis.map((resp) => (
                    <div key={resp.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.responsaveis_ids.includes(resp.id)}
                        onCheckedChange={() => toggleResponsavel(resp.id)}
                      />
                      <span className="text-sm">{resp.nome}</span>
                    </div>
                  ))
                )}
              </div>
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

      {/* Novo Responsável Modal */}
      <Dialog open={showResponsavelModal} onOpenChange={setShowResponsavelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Responsável</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newResponsavel.nome}
                onChange={(e) => setNewResponsavel({ ...newResponsavel, nome: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={newResponsavel.telefone}
                onChange={(e) => setNewResponsavel({ ...newResponsavel, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newResponsavel.observacoes}
                onChange={(e) => setNewResponsavel({ ...newResponsavel, observacoes: e.target.value })}
                placeholder="Observações"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponsavelModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveResponsavel} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
