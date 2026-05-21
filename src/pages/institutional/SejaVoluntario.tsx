import { useState, useEffect } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import {
  HandHeart,
  CheckCircle,
  Home
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

export default function SejaVoluntario() {
  const [ministerios, setMinisterios] = useState<{ id: string; nome: string }[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    ministerio: "",
    observacao: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from('ministerios')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        setMinisterios(data || []);
      });
  }, []);

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

    setLoading(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          email: formData.email.trim() || null,
          observacoes: `[VOLUNTÁRIO] Interesse em: ${formData.ministerio || 'Não especificado'}. ${formData.observacao.trim()}`,
          status: 'novo'
        });

      if (error) throw error;
      
      toast.success("Cadastro realizado com sucesso!");
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
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
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Voltar para Home
            </Link>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HandHeart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Seja um Voluntário
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Use seus dons e talentos para servir a Deus e às pessoas na nossa comunidade.
            </p>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section className="py-16 lg:py-24 bg-white">
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
                    <h2 className="text-2xl font-bold mb-3">Obrigado pelo seu interesse!</h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Entraremos em contato em breve para conversar sobre as oportunidades de servir.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Cadastrar outra pessoa
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        Quero servir
                      </h2>
                      <p className="text-muted-foreground">
                        Preencha o formulário para manifestar seu interesse
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
                          onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
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
                        <Label htmlFor="ministerio">Área de interesse</Label>
                        <Select
                          value={formData.ministerio}
                          onValueChange={(value) => setFormData({ ...formData, ministerio: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Em qual área você gostaria de servir?" />
                          </SelectTrigger>
                          <SelectContent>
                            {ministerios.length > 0
                            ? ministerios.map((m) => (
                                <SelectItem key={m.id} value={m.nome}>
                                  {m.nome}
                                </SelectItem>
                              ))
                            : ["Música", "Recepção", "Kids", "Áudio, Vídeo e Iluminação", "Mídia", "Bases", "Outro"].map((nome) => (
                                <SelectItem key={nome} value={nome}>
                                  {nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="observacao">Conte um pouco sobre você</Label>
                        <Textarea
                          id="observacao"
                          placeholder="Experiências anteriores, dons, talentos..."
                          maxLength={500}
                          value={formData.observacao}
                          onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base bg-promessa-600 hover:bg-promessa-700" disabled={loading}>
                        {loading ? 'Enviando...' : 'Quero servir'}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-muted-foreground mt-6 text-sm">
              Recomendamos que você participe da <Link to="/trilha-amar-servir" className="text-promessa-600 hover:underline">Trilha Amar e Servir</Link> para conhecer melhor a igreja antes de começar a servir.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}