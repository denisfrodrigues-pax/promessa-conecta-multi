import { useState, useEffect } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { Users, MapPin, Clock, Phone, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FotoCapa } from "@/components/ui/foto-capa";
import { Link } from "react-router-dom";

interface Base {
  id: string;
  nome: string;
  local: string | null;
  dia_semana: string | null;
  horario: string | null;
  descricao: string | null;
  lider_id: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  foto_url: string | null;
  whatsapp_lider: string | null;
  lider?: {
    nome: string;
    telefone: string | null;
  };
}

export default function BasesPublicas() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBase, setSelectedBase] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    observacao: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const { data, error } = await supabase
        .from("bases")
        .select(
          `
          id,
          nome,
          local,
          dia_semana,
          horario,
          descricao,
          lider_id,
          bairro,
          cidade,
          uf,
          foto_url,
          whatsapp_lider,
          profiles:lider_id (
            nome,
            telefone
          )
        `,
        )
        .eq("status", "ativo")
        .eq("visibilidade", "publico")
        .order("nome");

      if (error) throw error;

      const formattedBases =
        data?.map((base) => ({
          ...base,
          lider: base.profiles
            ? {
                nome: (base.profiles as { nome: string; telefone: string | null }).nome,
                telefone: (base.profiles as { nome: string; telefone: string | null }).telefone,
              }
            : undefined,
        })) || [];

      setBases(formattedBases as Base[]);
    } catch (error) {
      console.error("Erro ao carregar bases:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }

    if (!selectedBase) {
      toast.error("Por favor, selecione uma Base");
      return;
    }

    const baseSelecionada = bases.find((b) => b.id === selectedBase);

    setFormLoading(true);

    try {
      const { data: visitante, error: visitanteError } = await supabase
        .from("visitantes")
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          observacoes: `[INSCRIÇÃO EM BASE] Base: ${baseSelecionada?.nome || "Não especificada"}. ${formData.observacao.trim()}`,
          status: "novo",
        })
        .select()
        .single();

      if (visitanteError) throw visitanteError;

      const { error: vinculoError } = await supabase.from("bases_membros").insert({
        base_id: selectedBase,
        visitante_id: visitante.id,
        status: "ativo",
        observacao: "Inscrição via site institucional",
      });

      if (vinculoError) throw vinculoError;

      toast.success("Inscrição realizada com sucesso!");
      setSubmitted(true);
      setFormData({ nome: "", telefone: "", observacao: "" });
      setSelectedBase("");
    } catch (error) {
      console.error("Erro ao inscrever:", error);
      toast.error("Erro ao realizar inscrição. Tente novamente.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Voltar para Home
            </Link>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Nossas Bases</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Bases são pequenos grupos onde você cresce na fé, constrói amizades e é acompanhado de perto.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de Bases */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Encontre sua Base</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-40 rounded-t-lg" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bases.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">Nenhuma base pública disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bases.map((base) => (
                <Card
                  key={base.id}
                  className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <FotoCapa
                    src={base.foto_url}
                    alt={base.nome}
                    aspectRatio="16/9"
                    className="rounded-none"
                    fallbackIcon={<Users className="w-10 h-10 text-muted-foreground/40" />}
                  />
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-3">{base.nome}</h3>

                    {base.descricao && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{base.descricao}</p>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {(base.dia_semana || base.horario) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {[base.dia_semana, base.horario].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      )}
                      {base.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{base.local}</span>
                        </div>
                      )}
                      {(base.bairro || base.cidade) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 opacity-0" />
                          <span className="text-xs">
                            {[base.bairro, base.cidade, base.uf].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {base.lider?.nome && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>Líder: {base.lider.nome}</span>
                        </div>
                      )}
                    </div>

                    {(base.whatsapp_lider || base.lider?.telefone) && (
                      <a
                        href={`https://wa.me/55${(base.whatsapp_lider || base.lider?.telefone || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        Falar com o líder
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Formulário de Inscrição */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-3">Participar</Badge>
              <h2 className="text-3xl font-bold mb-3">Quero entrar em uma Base</h2>
              <p className="text-muted-foreground">
                Selecione a Base desejada e deixe seus dados. O líder entrará em contato.
              </p>
            </div>

            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-promessa-500 to-promessa-700" />
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-promessa-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Inscrição realizada!</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Sua inscrição foi registrada com sucesso. O líder da Base entrará em contato em breve.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Inscrever outra pessoa
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="base">Base de interesse *</Label>
                      <Select value={selectedBase} onValueChange={setSelectedBase}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma Base" />
                        </SelectTrigger>
                        <SelectContent>
                          {bases.map((base) => (
                            <SelectItem key={base.id} value={base.id}>
                              {base.nome}
                              {base.dia_semana ? ` — ${base.dia_semana}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                      <Input
                        id="telefone"
                        placeholder="(99) 99999-9999"
                        value={formData.telefone}
                        onChange={(e) =>
                          setFormData({ ...formData, telefone: formatPhone(e.target.value) })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacao">Mensagem (opcional)</Label>
                      <Textarea
                        id="observacao"
                        placeholder="Alguma informação adicional..."
                        maxLength={300}
                        value={formData.observacao}
                        onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base bg-promessa-600 hover:bg-promessa-700"
                      disabled={formLoading}
                    >
                      {formLoading ? "Enviando..." : "Quero participar"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
