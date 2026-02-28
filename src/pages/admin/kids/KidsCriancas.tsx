import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Baby, Edit, Trash2, Search } from "lucide-react";
import { differenceInYears } from "date-fns";

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  alergias: string | null;
  observacoes: string | null;
  sala_id: string | null;
  foto_url?: string | null;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string | null;
}

interface Sala {
  id: string;
  nome: string;
}

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return "–";
  return `${differenceInYears(new Date(), new Date(birthDate))} anos`;
};

export default function KidsCriancas() {
  const [igrejaId, setIgrejaId] = useState<string | null>(null);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Crianca | null>(null);

  const [form, setForm] = useState({
    nome: "",
    data_nascimento: "",
    alergias: "",
    observacoes: "",
    sala_id: "",
  });

  const [buscaResponsavel, setBuscaResponsavel] = useState("");
  const [responsaveisFiltrados, setResponsaveisFiltrados] = useState<Responsavel[]>([]);
  const [responsaveisSelecionados, setResponsaveisSelecionados] = useState<Responsavel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    buscarResponsaveis();
  }, [buscaResponsavel]);

  const fetchData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("igreja_id").eq("user_id", user.id).single();

    if (!profile?.igreja_id) return;

    setIgrejaId(profile.igreja_id);

    const { data: criancasData } = await supabase
      .from("criancas")
      .select("*")
      .eq("igreja_id", profile.igreja_id)
      .order("nome");

    const { data: salasData } = await supabase.from("salas").select("id, nome").eq("igreja_id", profile.igreja_id);

    setCriancas(criancasData || []);
    setSalas(salasData || []);
    setLoading(false);
  };

  const buscarResponsaveis = async () => {
    if (!buscaResponsavel || !igrejaId) {
      setResponsaveisFiltrados([]);
      return;
    }

    const { data } = await supabase
      .from("responsaveis")
      .select("id, nome, telefone")
      .eq("igreja_id", igrejaId)
      .ilike("nome", `%${buscaResponsavel}%`)
      .limit(5);

    setResponsaveisFiltrados(data || []);
  };

  const openModal = (crianca?: Crianca) => {
    if (crianca) {
      setEditing(crianca);
      setForm({
        nome: crianca.nome,
        data_nascimento: crianca.data_nascimento || "",
        alergias: crianca.alergias || "",
        observacoes: crianca.observacoes || "",
        sala_id: crianca.sala_id || "",
      });
    } else {
      setEditing(null);
      setForm({
        nome: "",
        data_nascimento: "",
        alergias: "",
        observacoes: "",
        sala_id: "",
      });
    }

    setResponsaveisSelecionados([]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !igrejaId) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      let criancaId = editing?.id;

      if (editing) {
        await supabase
          .from("criancas")
          .update({
            nome: form.nome,
            data_nascimento: form.data_nascimento || null,
            alergias: form.alergias || null,
            observacoes: form.observacoes || null,
            sala_id: form.sala_id || null,
          })
          .eq("id", editing.id);
      } else {
        const { data } = await supabase
          .from("criancas")
          .insert({
            igreja_id: igrejaId,
            nome: form.nome,
            data_nascimento: form.data_nascimento || null,
            alergias: form.alergias || null,
            observacoes: form.observacoes || null,
            sala_id: form.sala_id || null,
          })
          .select()
          .single();

        criancaId = data?.id;
      }

      if (criancaId) {
        await supabase.from("criancas_responsaveis").delete().eq("crianca_id", criancaId);

        for (const r of responsaveisSelecionados) {
          await supabase.from("criancas_responsaveis").insert({
            crianca_id: criancaId,
            responsavel_id: r.id,
            tipo_relacao: "responsável",
          });
        }
      }

      toast({ title: "Salvo com sucesso!" });
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (crianca: Crianca) => {
    if (!confirm(`Excluir ${crianca.nome}?`)) return;

    await supabase.from("criancas").delete().eq("id", crianca.id);
    fetchData();
  };

  const filtered = criancas.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Crianças</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Criança
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar criança..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((crianca) => (
          <Card key={crianca.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{crianca.nome}</p>
                  <p className="text-sm text-muted-foreground">{calculateAge(crianca.data_nascimento)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openModal(crianca)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(crianca)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Criança" : "Nova Criança"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

            <Input
              type="date"
              value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
            />

            <Input
              placeholder="Alergias"
              value={form.alergias}
              onChange={(e) => setForm({ ...form, alergias: e.target.value })}
            />

            <Textarea
              placeholder="Observações"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />

            <Select value={form.sala_id} onValueChange={(v) => setForm({ ...form, sala_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Sala principal" />
              </SelectTrigger>
              <SelectContent>
                {salas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* AUTOCOMPLETE RESPONSÁVEL */}
            <div className="space-y-2">
              <Label>Responsáveis</Label>

              <Input
                placeholder="Digite o nome..."
                value={buscaResponsavel}
                onChange={(e) => setBuscaResponsavel(e.target.value)}
              />

              {responsaveisFiltrados.map((r) => (
                <div
                  key={r.id}
                  className="p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setResponsaveisSelecionados((prev) => [...prev, r]);
                    setBuscaResponsavel("");
                  }}
                >
                  {r.nome}
                </div>
              ))}

              {responsaveisSelecionados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {responsaveisSelecionados.map((r) => (
                    <span key={r.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {r.nome}
                    </span>
                  ))}
                </div>
              )}
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
    </div>
  );
}
