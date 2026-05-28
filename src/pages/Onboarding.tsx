import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, Church, MapPin, Clock, ChevronRight, ChevronLeft,
  CheckCircle, Copy, ExternalLink,
} from 'lucide-react';

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

type Step = 'igreja' | 'localizacao' | 'culto' | 'sucesso';

export default function Onboarding() {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>('igreja');
  const [subdominioGerado, setSubdominioGerado] = useState('');

  // Passo 1 — Igreja
  const [formIgreja, setFormIgreja] = useState({
    nome_igreja: '',
    responsavel_nome: profile?.nome ?? '',
    responsavel_email: profile?.email ?? '',
  });

  // Passo 2 — Localização
  const [formLocal, setFormLocal] = useState({
    cidade: '',
    estado: '',
    versiculo: '',
  });

  // Passo 3 — Culto principal
  const [formCulto, setFormCulto] = useState({
    nome: 'Culto de Celebração',
    dia_semana: 6,
    horario_inicio: '19:00',
    horario_fim: '',
    local: '',
  });

  const handleIgrejaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormIgreja(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormLocal(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleCultoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormCulto(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canAdvanceStep1 = formIgreja.nome_igreja.trim() && formIgreja.responsavel_nome.trim();

  const doInsert = async (slug: string) =>
    supabase
      .from('igrejas')
      .insert({
        nome: formIgreja.nome_igreja.trim(),
        slug,
        responsavel_nome: formIgreja.responsavel_nome.trim(),
        responsavel_email: formIgreja.responsavel_email.trim() || null,
        cidade: formLocal.cidade.trim() || null,
        estado: formLocal.estado.trim() || null,
        versiculo: formLocal.versiculo.trim() || null,
        plano: 'teste',
        ativo: true,
      })
      .select('id')
      .single();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCulto.nome.trim()) { toast.error('Nome do culto principal é obrigatório.'); return; }
    if (!formCulto.horario_inicio) { toast.error('Horário de início é obrigatório.'); return; }
    if (!user) return;

    setSaving(true);
    try {
      // 1. Criar a igreja
      const baseSlug = slugify(formIgreja.nome_igreja);
      let { data: igrejaCriada, error: igrejaError } = await doInsert(baseSlug);

      if (igrejaError?.code === '23505') {
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
        const retry = await doInsert(uniqueSlug);
        if (retry.error) throw retry.error;
        igrejaCriada = retry.data;
      } else if (igrejaError) {
        throw igrejaError;
      }

      const churchId = igrejaCriada!.id;

      // 2. Gerar e salvar subdomínio
      const subBase = slugify(formIgreja.nome_igreja);
      const subdominio = `${subBase}-${Date.now().toString(36).slice(-4)}`;
      await supabase
        .from('igrejas')
        .update({ subdominio })
        .eq('id', churchId);
      setSubdominioGerado(subdominio);

      // 3. Vincular perfil à nova igreja
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ church_id: churchId })
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      // 4. Tornar o criador admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'admin', church_id: churchId },
          { onConflict: 'user_id,role' }
        );
      if (roleError) console.warn('[onboarding] role admin não atribuído:', roleError.message);

      // 5. Criar o primeiro evento semanal
      const { error: eventoError } = await supabase
        .from('igreja_eventos_semanais')
        .insert({
          church_id: churchId,
          nome: formCulto.nome.trim(),
          dia_semana: formCulto.dia_semana,
          horario_inicio: formCulto.horario_inicio,
          horario_fim: formCulto.horario_fim || null,
          local: formCulto.local.trim() || null,
          ativo: true,
        });
      if (eventoError) console.warn('[onboarding] evento semanal não criado:', eventoError.message);

      // Avançar para tela de sucesso (não redireciona ainda)
      setStep('sucesso');
    } catch (error: any) {
      console.error('Erro ao criar igreja:', error);
      toast.error(error.message ?? 'Erro ao configurar a igreja. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const copySubdomain = () => {
    const url = `https://${subdominioGerado}.vercel.app`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'));
  };

  const goToDashboard = () => {
    window.location.href = '/admin/dashboard';
  };

  const STEPS: Step[] = ['igreja', 'localizacao', 'culto', 'sucesso'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-promessa-100 rounded-full">
              <Church className="w-8 h-8 text-promessa-700" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold">Configure sua Igreja</h1>
          <p className="text-muted-foreground text-sm">
            Bem-vindo ao Promessa Conecta! Preencha os dados abaixo para começar.
          </p>
        </div>

        {/* Stepper */}
        {step !== 'sucesso' && (
          <>
            <div className="flex items-center justify-center gap-2">
              {(['igreja', 'localizacao', 'culto'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${step === s
                      ? 'bg-promessa-700 text-white'
                      : stepIdx > i
                        ? 'bg-promessa-200 text-promessa-700'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                    {stepIdx > i ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className="w-8 h-0.5 bg-muted" />}
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {step === 'igreja' && 'Dados da Igreja'}
              {step === 'localizacao' && 'Localização e Identidade'}
              {step === 'culto' && 'Culto Principal'}
            </div>
          </>
        )}

        {/* ── Passo 1: Igreja ──────────────────────────────────────────────── */}
        {step === 'igreja' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_igreja">Nome da Igreja *</Label>
                  <Input id="nome_igreja" name="nome_igreja" placeholder="Ex: Igreja da Promessa – Centro" value={formIgreja.nome_igreja} onChange={handleIgrejaChange} required autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do Responsável *</Label>
                  <Input id="responsavel_nome" name="responsavel_nome" placeholder="Seu nome completo" value={formIgreja.responsavel_nome} onChange={handleIgrejaChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_email">E-mail do Responsável</Label>
                  <Input id="responsavel_email" name="responsavel_email" type="email" placeholder="email@exemplo.com" value={formIgreja.responsavel_email} onChange={handleIgrejaChange} />
                </div>
                <Button className="w-full" onClick={() => setStep('localizacao')} disabled={!canAdvanceStep1}>
                  Próximo <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Passo 2: Localização ─────────────────────────────────────────── */}
        {step === 'localizacao' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>Onde sua igreja está localizada? <span className="text-xs">(opcional)</span></span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" placeholder="São Paulo" value={formLocal.cidade} onChange={handleLocalChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado (UF)</Label>
                    <Input id="estado" name="estado" placeholder="SP" maxLength={2} value={formLocal.estado} onChange={handleLocalChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versiculo">Versículo de Identidade <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <Input id="versiculo" name="versiculo" placeholder="Ex: João 3:16 — Porque Deus amou o mundo..." value={formLocal.versiculo} onChange={handleLocalChange} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('igreja')}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                  <Button className="flex-1" onClick={() => setStep('culto')}>
                    Próximo <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Passo 3: Culto ───────────────────────────────────────────────── */}
        {step === 'culto' && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Quando é o culto principal da sua igreja?</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="culto_nome">Nome do Culto *</Label>
                  <Input id="culto_nome" name="nome" placeholder="Ex: Culto de Celebração" value={formCulto.nome} onChange={handleCultoChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Dia da Semana *</Label>
                  <Select value={String(formCulto.dia_semana)} onValueChange={v => setFormCulto(p => ({ ...p, dia_semana: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario_inicio">Horário Início *</Label>
                    <Input id="horario_inicio" name="horario_inicio" type="time" value={formCulto.horario_inicio} onChange={handleCultoChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_fim">Horário Fim</Label>
                    <Input id="horario_fim" name="horario_fim" type="time" value={formCulto.horario_fim} onChange={handleCultoChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local_culto">Local</Label>
                  <Input id="local_culto" name="local" placeholder="Ex: Templo Principal" value={formCulto.local} onChange={handleCultoChange} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('localizacao')} disabled={saving}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Configurando...</>
                      : 'Finalizar Configuração'
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Passo 4: Sucesso ─────────────────────────────────────────────── */}
        {step === 'sucesso' && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6 text-center space-y-5">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Igreja configurada! 🎉</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  <strong>{formIgreja.nome_igreja}</strong> está pronta para usar o Promessa Conecta.
                </p>
              </div>

              {subdominioGerado && (
                <div className="bg-white border border-green-200 rounded-lg p-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seu sistema está disponível em:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-promessa-700 bg-promessa-50 px-3 py-2 rounded font-mono break-all">
                      https://{subdominioGerado}.vercel.app
                    </code>
                    <Button variant="outline" size="icon" onClick={copySubdomain} title="Copiar link">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Em breve você poderá configurar um domínio personalizado em{' '}
                    <strong>Admin → Configurações → Dados da Igreja</strong>.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button className="w-full" onClick={goToDashboard}>
                  Ir para o Painel <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Você pode editar tudo em <strong>Admin → Configurações → Dados da Igreja</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
