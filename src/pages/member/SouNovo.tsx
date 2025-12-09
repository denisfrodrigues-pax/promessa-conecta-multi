import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Heart, Users, Calendar, MessageCircle, ChevronRight, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SouNovo() {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    melhorHorario: '',
    observacao: '',
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
    
    if (!formData.nome.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    if (!formData.telefone.trim()) {
      toast.error('Por favor, informe seu telefone');
      return;
    }

    if (formData.observacao.length > 300) {
      toast.error('A observação pode ter no máximo 300 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          melhor_horario: formData.melhorHorario || null,
          observacoes: formData.observacao.trim() || null,
        });

      if (error) throw error;
      
      toast.success('Cadastro realizado com sucesso!');
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: Heart,
      title: 'Seja Bem-vindo!',
      description: 'Estamos felizes em recebê-lo. Aqui você encontrará uma comunidade acolhedora.',
      color: 'bg-rose-100 text-rose-500',
    },
    {
      icon: Users,
      title: 'Encontre seu Grupo',
      description: 'Participe de um pequeno grupo e desenvolva amizades significativas.',
      color: 'bg-primary/10 text-primary',
      action: { label: 'Ver Grupos', path: '/grupos' },
    },
    {
      icon: Calendar,
      title: 'Participe dos Eventos',
      description: 'Venha nos conhecer melhor participando de nossos eventos e programações.',
      color: 'bg-church-gold/10 text-church-gold',
      action: { label: 'Ver Eventos', path: '/eventos' },
    },
    {
      icon: MessageCircle,
      title: 'Fale Conosco',
      description: 'Tire suas dúvidas e saiba mais sobre nossa igreja.',
      color: 'bg-violet-100 text-violet-500',
    },
  ];

  return (
    <div className="pb-24 md:pb-6">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner_sou_novo_placeholder.png')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 py-16 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-church-gold shadow-gold mb-6">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Sou Novo Aqui
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Seja muito bem-vindo à Igreja da Promessa! Estamos muito felizes em tê-lo conosco.
            Aqui você vai encontrar uma família que se importa com você.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Registration Form */}
        <section>
          <Card className="shadow-card max-w-lg mx-auto">
            <CardContent className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-2">Obrigado pelo cadastro!</h2>
                  <p className="text-muted-foreground mb-4">
                    Ficamos muito felizes com sua visita. Em breve entraremos em contato!
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Cadastrar outra pessoa
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-display font-bold mb-4 text-center">
                    Quero me conectar!
                  </h2>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Preencha o formulário abaixo para que possamos entrar em contato com você.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        placeholder="(99) 99999-9999"
                        value={formData.telefone}
                        onChange={handlePhoneChange}
                        required
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
                        placeholder="Alguma mensagem ou pedido especial?"
                        maxLength={300}
                        value={formData.observacao}
                        onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                      />
                      <p className="text-right text-sm text-muted-foreground">
                        {formData.observacao.length}/300
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Enviando...' : 'Quero me conectar!'}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Steps */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-center mb-6">
            Seus Próximos Passos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <Card key={index} className="shadow-card hover:shadow-elevated transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{step.description}</p>
                      {step.action && (
                        <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                          <Link to={step.action.path}>
                            {step.action.label} <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section>
          <Card className="shadow-card bg-gradient-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-display font-bold mb-6">Nossos Cultos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Domingo</span>
                  </div>
                  <p className="text-2xl font-display font-bold">10:00</p>
                  <p className="text-sm text-muted-foreground">Culto da Família</p>
                </div>
                <div className="p-4 rounded-lg bg-background shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Domingo</span>
                  </div>
                  <p className="text-2xl font-display font-bold">19:00</p>
                  <p className="text-sm text-muted-foreground">Culto de Celebração</p>
                </div>
                <div className="p-4 rounded-lg bg-background shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Quarta</span>
                  </div>
                  <p className="text-2xl font-display font-bold">19:30</p>
                  <p className="text-sm text-muted-foreground">Culto de Ensino</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-xl font-display font-bold mb-4">Pronto para dar o próximo passo?</h2>
          <p className="text-muted-foreground mb-6">
            Complete seu cadastro e faça parte da nossa comunidade
          </p>
          <Button asChild variant="gold" size="lg">
            <Link to="/perfil">Completar Meu Cadastro</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
