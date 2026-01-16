import { useState, useEffect } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Users, 
  MapPin, 
  Clock, 
  Phone,
  CheckCircle,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Base {
  id: string;
  nome: string;
  local: string | null;
  dia_semana: string | null;
  horario: string | null;
  descricao: string | null;
  lider_id: string | null;
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
    observacao: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const { data, error } = await supabase
        .from('bases')
        .select(`
          id,
          nome,
          local,
          dia_semana,
          horario,
          descricao,
          lider_id,
          profiles:lider_id (
            nome,
            telefone
          )
        `)
        .eq('status', 'ativa')
        .eq('visibilidade', 'publica')
        .order('nome');

      if (error) throw error;

      const formattedBases = data?.map(base => ({
        ...base,
        lider: base.profiles ? {
          nome: (base.profiles as any).nome,
          telefone: (base.profiles as any).telefone
        } : undefined
      })) || [];

      setBases(formattedBases);
    } catch (error) {
      console.error('Erro ao carregar bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
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

    const baseSelecionada = bases.find(b => b.id === selectedBase);

    setFormLoading(true);
    try {
      // Criar visitante
      const { data: visitante, error: visitanteError } = await supabase
        .from('visitantes')
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          observacoes: `[INSCRIÇÃO EM BASE] Base: ${baseSelecionada?.nome || 'Não especificada'}. ${formData.observacao.trim()}`,
          status: 'novo'
        })
        .select()
        .single();

      if (visitanteError) throw visitanteError;

      // Vincular visitante à base
      if (visitante) {
        await supabase
          .from('bases_membros')
          .insert({
            base_id: selectedBase,
            visitante_id: visitante.id,
            status: 'pendente',
            observacao: 'Inscrição via site institucional'
          });
      }
      
      toast.success("Inscrição realizada com sucesso!");
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      toast.error('Erro ao realizar inscrição. Tente novamente.');
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
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Bases
            </h1>
            <p className="text-xl text-white/90 font-medium mb-2">
              Grupos de comunhão que se reúnem durante a semana
            </p>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              As Bases são pequenos grupos onde vivemos a fé de forma prática, estudamos a Bíblia, oramos uns pelos outros e construímos relacionamentos significativos.
            </p>
          </div>
        </div>
      </section>

      {/* O que são Bases */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                O que são as Bases?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                As Bases são grupos de comunhão que se reúnem semanalmente em casas ou espaços da cidade. É onde a igreja acontece de forma íntima, relacional e prática.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-muted/30 rounded-2xl p-6 text-center border border-border/50">
                <div className="w-14 h-14 bg-promessa-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Comunhão</h3>
                <p className="text-sm text-muted-foreground">
                  Relacionamentos profundos com pessoas que caminham junto
                </p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 text-center border border-border/50">
                <div className="w-14 h-14 bg-promessa-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Cuidado</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento pastoral e oração pelas necessidades
                </p>
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 text-center border border-border/50">
                <div className="w-14 h-14 bg-promessa-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Acolhimento</h3>
                <p className="text-sm text-muted-foreground">
                  Ambiente acolhedor onde você é recebido como família
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Bases */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Nossas Bases
              </h2>
              <p className="text-lg text-muted-foreground">
                Encontre uma Base perto de você
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando bases...</p>
              </div>
            ) : bases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma base disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {bases.map((base) => (
                  <Card key={base.id} className="border border-border/50 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-3">{base.nome}</h3>
                      
                      {base.local && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-promessa-600" />
                          <span>{base.local}</span>
                        </div>
                      )}
                      
                      {(base.dia_semana || base.horario) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="w-4 h-4 flex-shrink-0 text-promessa-600" />
                          <span>
                            {base.dia_semana}{base.horario && ` às ${base.horario}`}
                          </span>
                        </div>
                      )}
                      
                      {base.lider && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Users className="w-4 h-4 flex-shrink-0 text-promessa-600" />
                          <span>Líder: {base.lider.nome}</span>
                        </div>
                      )}
                      
                      {base.descricao && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {base.descricao}
                        </p>
                      )}

                      {base.lider?.telefone && (
                        <a 
                          href={`https://wa.me/55${base.lider.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-promessa-600 hover:text-promessa-700 font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          Entrar em contato
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Formulário de Inscrição */}
      <section id="inscricao" className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-promessa-500 to-promessa-700" />
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-promessa-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Inscrição realizada!</h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      O líder da Base entrará em contato com você em breve para confirmar sua participação.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Inscrever outra pessoa
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        Quero participar de uma Base
                      </h2>
                      <p className="text-muted-foreground">
                        Preencha o formulário e entraremos em contato
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="base">Escolha uma Base *</Label>
                        <Select
                          value={selectedBase}
                          onValueChange={setSelectedBase}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma Base" />
                          </SelectTrigger>
                          <SelectContent>
                            {bases.map((base) => (
                              <SelectItem key={base.id} value={base.id}>
                                {base.nome} {base.local && `- ${base.local}`}
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
                          onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="observacao">Observação (opcional)</Label>
                        <Textarea
                          id="observacao"
                          placeholder="Alguma dúvida ou informação adicional?"
                          maxLength={300}
                          value={formData.observacao}
                          onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base bg-promessa-600 hover:bg-promessa-700" disabled={formLoading}>
                        {formLoading ? 'Enviando...' : 'Quero participar'}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}