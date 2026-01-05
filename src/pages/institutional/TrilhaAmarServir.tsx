import { useState } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Sparkles,
  TrendingUp,
  Coffee,
  BookOpen,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const blocos = [
  {
    number: "01",
    icon: Coffee,
    title: "Conhecer",
    subtitle: "Café de Boas-vindas",
    description: "Primeiro contato com a fé e com a igreja, apresentando Jesus e a cultura da igreja de forma acolhedora. Um momento especial para você conhecer quem somos e o que cremos."
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Crescer",
    subtitle: "Curso Primeiros Passos + Base",
    description: "Curso \"Primeiros Passos\" com 4 módulos que ensinam os fundamentos da fé cristã e ajudam a desenvolver hábitos espirituais em comunidade. Ao final, você é encaminhado para uma Base."
  }
];

const modulos = [
  { numero: 1, titulo: "Quem somos", descricao: "Apresentação da identidade, missão, visão e cultura da igreja." },
  { numero: 2, titulo: "Quem é Jesus", descricao: "Apresentação da pessoa de Jesus e sua centralidade na fé cristã e na igreja." },
  { numero: 3, titulo: "No que cremos", descricao: "Apresentação das principais doutrinas e fundamentos bíblicos da nossa fé." },
  { numero: 4, titulo: "Amar e Servir", descricao: "Apresentação da cultura de serviço, voluntariado e engajamento na igreja." }
];

export default function TrilhaAmarServir() {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    melhorHorario: "",
    observacao: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          email: formData.email.trim() || null,
          melhor_horario: formData.melhorHorario || null,
          observacoes: `[TRILHA AMAR E SERVIR] ${formData.observacao.trim() || 'Inscrição no curso Primeiros Passos'}`,
          status: 'novo'
        });

      if (error) throw error;
      
      toast.success("Inscrição realizada com sucesso!");
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      toast.error('Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setLoading(false);
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
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Trilha Amar e Servir
            </h1>
            <p className="text-xl text-white/90 font-medium mb-2">
              O caminho para caminhar com Jesus e com a igreja
            </p>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              A Trilha Amar e Servir é o caminho de discipulado da igreja, criada para ajudar pessoas a conhecerem Jesus, a igreja e viverem a fé de forma prática e relacional.
            </p>
          </div>
        </div>
      </section>

      {/* Blocos da Trilha */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Os Passos da Trilha
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Um caminho pensado para você conhecer Jesus e crescer na fé de forma prática e relacional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {blocos.map((bloco, index) => (
                <Card 
                  key={index}
                  className="border-2 border-promessa-100 hover:border-promessa-300 transition-all duration-300"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-promessa-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <bloco.icon className="w-8 h-8 text-promessa-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-promessa-600 bg-promessa-50 px-2 py-1 rounded">
                            {bloco.number}
                          </span>
                          <h3 className="text-2xl font-bold text-foreground">{bloco.title}</h3>
                        </div>
                        <p className="text-promessa-600 font-medium mb-3">{bloco.subtitle}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {bloco.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Módulos do Curso Primeiros Passos */}
            <div className="bg-muted/30 rounded-2xl p-8 lg:p-10 border border-border/50 mb-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Curso Primeiros Passos
                </h3>
                <p className="text-muted-foreground">
                  4 encontros que vão transformar sua caminhada de fé
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modulos.map((modulo) => (
                  <div 
                    key={modulo.numero}
                    className="bg-white rounded-xl p-5 border border-border/50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-promessa-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {modulo.numero}
                      </span>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">{modulo.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulário de Inscrição */}
            <div id="inscricao" className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden max-w-lg mx-auto">
              <div className="h-2 bg-gradient-to-r from-promessa-500 to-promessa-700" />
              <div className="p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-promessa-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Inscrição realizada!</h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Ficamos muito felizes com seu interesse. Em breve entraremos em contato para confirmar sua participação no próximo curso.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Inscrever outra pessoa
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        Quero dar meus primeiros passos
                      </h2>
                      <p className="text-muted-foreground">
                        Preencha o formulário para se inscrever no próximo curso
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                          onChange={handlePhoneChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail (opcional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="melhorHorario">Melhor horário para contato</Label>
                        <Select
                          value={formData.melhorHorario}
                          onValueChange={(value) => setFormData({ ...formData, melhorHorario: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                            <SelectItem value="Qualquer horário">Qualquer horário</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Button type="submit" className="w-full h-12 text-base bg-promessa-600 hover:bg-promessa-700" disabled={loading}>
                        {loading ? 'Enviando...' : 'Quero me inscrever'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>

            <p className="text-center text-muted-foreground mt-6 text-sm">
              Sem pressão. No seu ritmo. Com propósito.
            </p>
          </div>
        </div>
      </section>

      {/* Por que participar */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
              Por que Participar?
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-border/50 text-left">
              <p className="text-muted-foreground mb-6">Na Trilha Amar e Servir você vai:</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Conhecer Jesus de forma pessoal e transformadora</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Aprender os fundamentos da fé cristã</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Desenvolver hábitos espirituais saudáveis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Fazer parte de uma comunidade de fé</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Descobrir seus dons e como servir a Deus</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <a href="#inscricao">Quero me inscrever</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/contato">Tenho dúvidas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}