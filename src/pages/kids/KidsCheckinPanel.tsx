import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

interface Checkin {
  id: string;
  crianca_id: string;
  responsavel_id: string;
  sala_id: string;
  checkin_at: string;
  status: string;
}

export default function KidsCheckinPanel() {
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cadastro, setCadastro] = useState({
    responsavel_nome: "",
    responsavel_telefone: "",
    crianca_nome: "",
    crianca_data_nascimento: "",
    crianca_alergias: "",
    crianca_observacoes: "",
    autoriza_foto: false,
    sala_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: checkinsData } = await supabase
        .from("checkins_kids")
        .select("*")
        .gte("checkin_at", todayStart.toISOString());

      const { data: criancasData } = await supabase.from("criancas").select("id, nome, data_nascimento, sala_id");

      const { data: responsaveisData } = await supabase.from("responsaveis").select("id, nome, telefone");

      const { data: salasData } = await supabase.from("salas").select("id, nome");

      setCheckins(checkinsData || []);
      setCriancas(criancasData || []);
      setResponsaveis(responsaveisData || []);
      setSalas(salasData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!cadastro.responsavel_nome || !cadastro.crianca_nome || !cadastro.sala_id) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profile } = await supabase.from("profiles").select("igreja_id").eq("user_id", user?.id).single();

      const { data: responsavel } = await supabase
        .from("responsaveis")
        .insert({
          nome: cadastro.responsavel_nome,
          telefone: cadastro.responsavel_telefone || null,
        })
        .select()
        .single();

      const { data: crianca } = await supabase
        .from("criancas")
        .insert({
          nome: cadastro.crianca_nome,
          data_nascimento: cadastro.crianca_data_nascimento || null,
          alergias: cadastro.crianca_alergias || null,
          observacoes: cadastro.crianca_observacoes || null,
          autoriza_foto: cadastro.autoriza_foto,
          sala_id: cadastro.sala_id,
          igreja_id: profile?.igreja_id,
        })
        .select()
        .single();

      await supabase.from("criancas_responsaveis").insert({
        crianca_id: crianca.id,
        responsavel_id: responsavel.id,
        tipo_relacao: "responsável",
      });

      await supabase.from("checkins_kids").insert({
        crianca_id: crianca.id,
        responsavel_id: responsavel.id,
        sala_id: cadastro.sala_id,
        status: "presente",
      });

      toast({ title: "Cadastro e check-in realizados!" });

      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Crianças presentes hoje</CardTitle>
        </CardHeader>
        <CardContent>{checkins.length}</CardContent>
      </Card>

      <Button onClick={() => setShowModal(true)}>Novo cadastro + Check-in</Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Label>Nome do responsável *</Label>
            <Input
              value={cadastro.responsavel_nome}
              onChange={(e) => setCadastro({ ...cadastro, responsavel_nome: e.target.value })}
            />

            <Label>Telefone</Label>
            <Input
              value={cadastro.responsavel_telefone}
              onChange={(e) => setCadastro({ ...cadastro, responsavel_telefone: e.target.value })}
            />

            <Label>Nome da criança *</Label>
            <Input
              value={cadastro.crianca_nome}
              onChange={(e) => setCadastro({ ...cadastro, crianca_nome: e.target.value })}
            />

            <Label>Data de nascimento</Label>
            <Input
              type="date"
              value={cadastro.crianca_data_nascimento}
              onChange={(e) =>
                setCadastro({
                  ...cadastro,
                  crianca_data_nascimento: e.target.value,
                })
              }
            />

            <Label>Sala *</Label>
            <Select value={cadastro.sala_id} onValueChange={(v) => setCadastro({ ...cadastro, sala_id: v })}>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCadastro} disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
