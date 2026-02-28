import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sala_id: string | null;
}

interface Presente {
  id: string;
  checkin_at: string;
  crianca: { nome: string };
  sala: { nome: string };
  responsavel: { nome: string };
}

export default function KidsCheckinPanel() {
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Crianca | null>(null);
  const [showVisitante, setShowVisitante] = useState(false);
  const [igrejaId, setIgrejaId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("igreja_id").eq("user_id", user.id).single();

    if (!profile?.igreja_id) return;

    setIgrejaId(profile.igreja_id);

    // Crianças
    const { data: criancasData } = await supabase
      .from("criancas")
      .select("id, nome, data_nascimento, sala_id")
      .eq("igreja_id", profile.igreja_id)
      .order("nome");

    setCriancas(criancasData || []);

    // Presentes hoje
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const { data: presentesData } = await supabase
      .from("checkins_kids")
      .select(
        `
        id,
        checkin_at,
        crianca:criancas(nome),
        sala:salas(nome),
        responsavel:responsaveis(nome)
      `,
      )
      .eq("igreja_id", profile.igreja_id)
      .eq("status", "presente")
      .gte("checkin_at", inicioDia.toISOString())
      .order("checkin_at", { ascending: false });

    setPresentes(presentesData || []);
  };

  const registrarPresenca = async () => {
    if (!selected || !igrejaId) return;

    const { error } = await supabase.from("checkins_kids").insert({
      crianca_id: selected.id,
      sala_id: selected.sala_id,
      status: "presente",
      igreja_id: igrejaId,
      checkin_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "Erro ao registrar presença", variant: "destructive" });
      return;
    }

    toast({ title: "Presença registrada com sucesso!" });
    setSelected(null);
    fetchData();
  };

  const filtered = criancas.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* BUSCA PRINCIPAL */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Digite o nome da criança..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {search && filtered.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left p-2 rounded hover:bg-muted"
                  onClick={() => {
                    setSelected(c);
                    setSearch("");
                  }}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="border rounded p-4 space-y-2">
              <p className="font-semibold">{selected.nome}</p>
              <Button onClick={registrarPresenca}>Registrar Presença</Button>
            </div>
          )}

          <Button variant="outline" onClick={() => setShowVisitante(true)}>
            Primeira vez? Cadastrar visitante
          </Button>
        </CardContent>
      </Card>

      {/* PRESENTES HOJE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Crianças presentes hoje ({presentes.length})</h2>

          {presentes.length === 0 && <p className="text-muted-foreground">Nenhuma criança registrada hoje.</p>}

          {presentes.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <p className="font-medium">{p.crianca?.nome}</p>
              <p className="text-sm text-muted-foreground">
                {p.sala?.nome} • {format(new Date(p.checkin_at), "HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">Responsável: {p.responsavel?.nome}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MODAL VISITANTE */}
      <Dialog open={showVisitante} onOpenChange={setShowVisitante}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro de Visitante</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">(Implementaremos na próxima etapa)</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
