import { useState, useRef } from 'react';
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

const RATE_LIMIT_KEY = 'visitor_form_submissions';
const MAX_SUBMISSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const checkRateLimit = (): boolean => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: number[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    const recentSubmissions = submissions.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    return recentSubmissions.length < MAX_SUBMISSIONS_PER_HOUR;
  } catch {
    return true;
  }
};

const recordSubmission = (): void => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const submissions: number[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    const recentSubmissions = submissions.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    recentSubmissions.push(now);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentSubmissions));
  } catch {
    // Silently fail if localStorage is not available
  }
};

export default function SouNovo() {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    melhorHorario: '',
    observacao: '',
  });
  const [honeypot, setHoneypot] = useState(''); // Bot trap
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formLoadTime = useRef(Date.now());

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

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection: honeypot field should be empty
    if (honeypot) {
      toast.success('Cadastro realizado com sucesso!');
      setSubmitted(true);
      return;
    }

    // Bot detection: form filled too quickly (less than 3 seconds)
    const timeSinceLoad = Date.now() - formLoadTime.current;
    if (timeSinceLoad < 3000) {
      toast.error('Por favor, preencha o formulário com calma.');
      return;
    }

    // Rate limiting check
    if (!checkRateLimit()) {
      toast.error('Você já realizou muitos cadastros recentemente. Tente novamente mais tarde.');
      return;
    }

    const trimmedName = formData.nome.trim();
    const trimmedPhone = formData.telefone.trim();
    const trimmedObs = formData.observacao.trim();

    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Por favor, informe seu nome completo');
      return;
    }

    if (trimmedName.length > 100) {
      toast.error('O nome deve ter no máximo 100 caracteres');
      return;
    }

    if (!trimmedPhone) {
      toast.error('Por favor, informe seu telefone');
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }

    if (trimmedObs.length > 300) {
      toast.error('A observação pode ter no máximo 300 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .insert({
          nome: trimmedName,
          telefone: trimmedPhone,
          melhor_horario: formData.melhorHorario || null,
          observacoes: trimmedObs || null,
        });

      if (error) throw error;
      
      recordSubmission();
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
      title: 'Encontre sua Base',
      description: 'Participe de uma base e desenvolva amizades significativas.',
      color: 'bg-primary/10 text-primary',
      action: { label: 'Ver Bases', path: '/bases' },
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
      {/* Hero Section - Premium */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner_sou_novo_placeholder.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-promessa-900/90 via-promessa-800/70 to-promessa-700/50" />
        <div className="container mx-auto px-4 py-20 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white tracking-tight">
            Sou Novo Aqui
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Seja muito bem-vindo à Igreja da Promessa! Estamos muito felizes em tê-lo conosco.
            Aqui você vai encontrar uma família que se importa com você.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Registration Form - Premium */}
        <section>
          <Card className="shadow-xl border-0 max-w-lg mx-auto overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-promessa to-promessa-dark" />
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-promessa/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-promessa" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-3">Obrigado pelo cadastro!</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Ficamos muito felizes com sua visita. Em breve entraremos em contato!
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)} className="shadow-sm">
                    Cadastrar outra pessoa
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold mb-2">
                      Quero me conectar!
                    </h2>
                    <p className="text-muted-foreground">
                      Preencha o formulário abaixo para que possamos entrar em contato com você.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot field - hidden from users, visible to bots */}
                    <div className="absolute -left-[9999px]" aria-hidden="true">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        maxLength={100}
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
                    <Button type="submit" className="w-full h-12 text-base shadow-lg" disabled={loading}>
                      {loading ? 'Enviando...' : 'Quero me conectar!'}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Steps - Premium */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-center">
            Seus Próximos Passos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="shadow-card border-0 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{step.description}</p>
                      {step.action && (
                        <Button asChild variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
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

        {/* Info Section - Premium */}
        <section>
          <Card className="shadow-card border-0 bg-gradient-to-br from-promessa/5 to-promessa/10 overflow-hidden">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold mb-8 text-center">Nossos Encontros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="p-6 rounded-2xl bg-white/80 dark:bg-background/80 shadow-sm backdrop-blur-sm text-center">
                  <div className="inline-flex items-center gap-2 mb-3 text-promessa">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Sábado</span>
                  </div>
                  <p className="text-4xl font-display font-bold text-promessa-dark mb-1">18:00</p>
                  <p className="text-muted-foreground">Escola Bíblica</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/80 dark:bg-background/80 shadow-sm backdrop-blur-sm text-center">
                  <div className="inline-flex items-center gap-2 mb-3 text-promessa">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Sábado</span>
                  </div>
                  <p className="text-4xl font-display font-bold text-promessa-dark mb-1">19:07</p>
                  <p className="text-muted-foreground">Culto de Celebração</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA - Premium */}
        <section className="text-center py-12">
          <h2 className="text-2xl font-display font-bold mb-4">Pronto para dar o próximo passo?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Complete seu cadastro e faça parte da nossa comunidade
          </p>
          <Button asChild size="lg" className="h-12 px-8 shadow-lg">
            <Link to="/perfil">Completar Meu Cadastro</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
