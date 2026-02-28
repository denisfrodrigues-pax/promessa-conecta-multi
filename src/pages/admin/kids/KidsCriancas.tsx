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
  const [showFicha, setShowFicha] = useState(false);
  const [editing, setEditing] = useState<Crianca | null>(null);
  const [criancaSelecionada, setCriancaSelecionada] = useState<Crianca | null>(null);

  const [historico, setHistorico] = useState<any[]>([]);
  const [responsaveisFicha, setResponsaveisFicha] = useState<any[]>([]);

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

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("igreja_id")
      .eq("user_id", userData.user.id)
      .single();

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

  const openFicha = async (crianca: Crianca) => {
    setCriancaSelecionada(crianca);

    const { data: links } = await supabase
      .from("criancas_responsaveis")
      .select("responsavel:responsaveis(nome, telefone)")
      .eq("crianca_id", crianca.id);

    const { data: historicoData } = await supabase
      .from("checkins_kids")
      .select("checkin_at, status")
      .eq("crianca_id", crianca.id)
      .order("checkin_at", { ascending: false })
      .limit(20);

    setResponsaveisFicha(links || []);
    setHistorico(historicoData || []);
    setShowFicha(true);
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

  const handleUpload = async (event: any) => {
    if (!criancaSelecionada) return;

    const file = event.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    await supabase.storage.from("criancas").upload(fileName, file);

    const { data } = supabase.storage.from("criancas").getPublicUrl(fileName);

    await supabase.from("criancas").update({ foto_url: data.publicUrl }).eq("id", criancaSelecionada.id);

    fetchData();
    toast({ title: "Foto atualizada!" });
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
        await supabase.from("criancas").update(form).eq("id", editing.id);
      } else {
        const { data } = await supabase
          .from("criancas")
          .insert({ ...form, igreja_id: igrejaId })
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
          <Card
            key={crianca.id}
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => openFicha(crianca)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                {crianca.foto_url ? (
                  <img src={crianca.foto_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Baby className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{crianca.nome}</p>
                  <p className="text-sm text-muted-foreground">{calculateAge(crianca.data_nascimento)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Ficha */}
      <Dialog open={showFicha} onOpenChange={setShowFicha}>
        <DialogContent className="sm:max-w-xl">
          {criancaSelecionada && (
            <>
              <DialogHeader>
                <DialogTitle>Ficha da Criança</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <input type="file" accept="image/*" onChange={handleUpload} />

                <p>
                  <strong>Nome:</strong> {criancaSelecionada.nome}
                </p>
                <p>
                  <strong>Idade:</strong> {calculateAge(criancaSelecionada.data_nascimento)}
                </p>
                <p>
                  <strong>Alergias:</strong> {criancaSelecionada.alergias || "Nenhuma"}
                </p>
                <p>
                  <strong>Observações:</strong> {criancaSelecionada.observacoes || "—"}
                </p>

                <div>
                  <strong>Responsáveis:</strong>
                  {responsaveisFicha.map((r: any, i: number) => (
                    <p key={i}>• {r.responsavel?.nome}</p>
                  ))}
                </div>

                <div>
                  <strong>Histórico:</strong>
                  {historico.map((h, i) => (
                    <p key={i}>• {new Date(h.checkin_at).toLocaleString()}</p>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => openModal(criancaSelecionada)}>
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(criancaSelecionada)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
