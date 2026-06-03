import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Check, Building2, Palette, MapPin,
  User, Eye, Upload, X, Loader2, Globe, Phone, Instagram,
  Youtube, Facebook, BookOpen, Image as ImageIcon, Share2, Camera,
  Sparkles, Search,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const DIAS_SEMANA = [
  { value: 'domingo',       label: 'Domingo' },
  { value: 'segunda',       label: 'Segunda-feira' },
  { value: 'terca',         label: 'Terça-feira' },
  { value: 'quarta',        label: 'Quarta-feira' },
  { value: 'quinta',        label: 'Quinta-feira' },
  { value: 'sexta',         label: 'Sexta-feira' },
  { value: 'sabado',        label: 'Sábado' },
];

const STEPS = [
  { label: 'Identidade',  icon: Building2 },
  { label: 'Visual',      icon: Palette },
  { label: 'Fotos Hero',  icon: Camera },
  { label: 'Sobre',       icon: BookOpen },
  { label: 'Localização', icon: MapPin },
  { label: 'Redes',       icon: Share2 },
  { label: 'Responsável', icon: User },
];

function generateSlug(nome: string): string {
  return nome.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeroItem { file: File; preview: string; }

interface CultoBlock {
  ativo: boolean;
  nome: string;
  dia: string;
  horario: string;
}

interface PequenosGruposBlock {
  ativo: boolean;
  nome: string;
  descricao: string;
}

interface CultosConfig {
  culto_principal: CultoBlock;
  escola_biblica:  CultoBlock;
  pequenos_grupos: PequenosGruposBlock;
}

interface FormData {
  nome: string; slug: string; slogan: string; versiculo: string; versiculo_referencia: string;
  logoFile: File | null; logoPreview: string;
  cor_primaria: string; cor_secundaria: string;
  loginFile: File | null; loginPreview: string;
  heroItems: HeroItem[];
  missao: string; visao: string; historia: string;
  cep: string;
  cidade: string; estado: string; endereco: string;
  telefone: string; email: string; google_maps_url: string;
  cultos_config: CultosConfig;
  whatsapp: string; instagram_url: string; youtube_url: string;
  facebook_url: string; site_url: string;
  responsavel_nome: string; responsavel_email: string; responsavel_telefone: string;
}

const INIT: FormData = {
  nome: '', slug: '', slogan: '', versiculo: '', versiculo_referencia: '',
  logoFile: null, logoPreview: '', cor_primaria: '#2D6A4F', cor_secundaria: '#1B4332',
  loginFile: null, loginPreview: '',
  heroItems: [],
  missao: '', visao: '', historia: '',
  cep: '',
  cidade: '', estado: '', endereco: '', telefone: '', email: '', google_maps_url: '',
  cultos_config: {
    culto_principal: { ativo: true,  nome: 'Culto de Celebração', dia: 'sabado', horario: '19:00' },
    escola_biblica:  { ativo: true,  nome: 'Escola Bíblica',      dia: 'sabado', horario: '18:00' },
    pequenos_grupos: { ativo: true,  nome: 'Pequenos Grupos',     descricao: 'Durante a semana' },
  },
  whatsapp: '', instagram_url: '', youtube_url: '', facebook_url: '', site_url: '',
  responsavel_nome: '', responsavel_email: '', responsavel_telefone: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function NovaIgreja() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [form, setForm] = useState<FormData>(INIT);

  const logoRef  = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const heroRef  = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const setCulto = (key: keyof CultosConfig, field: string, value: unknown) =>
    setForm(p => ({
      ...p,
      cultos_config: {
        ...p.cultos_config,
        [key]: { ...p.cultos_config[key], [field]: value },
      },
    }));

  // ── Slug ────────────────────────────────────────────────────────────────────
  const handleNomeChange = (v: string) => {
    set('nome', v);
    if (!slugManual) set('slug', generateSlug(v));
  };
  const handleSlugChange = (v: string) => {
    set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setSlugManual(true);
    setSlugStatus('idle');
  };
  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setSlugStatus('checking');
    const { data } = await supabase.from('igrejas').select('id').eq('slug', slug).maybeSingle();
    setSlugStatus(data ? 'taken' : 'ok');
  };

  // ── CEP lookup ──────────────────────────────────────────────────────────────
  const handleCepChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits;
    set('cep', formatted);
    if (digits.length === 8) lookupCep(digits);
  };

  const lookupCep = async (digits: string) => {
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error('CEP não encontrado'); return; }
      setForm(p => ({
        ...p,
        endereco: [data.logradouro, data.bairro].filter(Boolean).join(', '),
        cidade:   data.localidade ?? p.cidade,
        estado:   data.uf         ?? p.estado,
      }));
      toast.success('Endereço preenchido automaticamente');
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  // ── Images ──────────────────────────────────────────────────────────────────
  const handleSingleImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileKey: 'logoFile' | 'loginFile',
    previewKey: 'logoPreview' | 'loginPreview',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }
    setForm(p => ({ ...p, [fileKey]: file, [previewKey]: URL.createObjectURL(file) }));
  };
  const clearSingle = (fileKey: 'logoFile' | 'loginFile', previewKey: 'logoPreview' | 'loginPreview') => {
    if (form[previewKey]) URL.revokeObjectURL(form[previewKey] as string);
    setForm(p => ({ ...p, [fileKey]: null, [previewKey]: '' }));
  };
  const handleHeroAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - form.heroItems.length);
    if (files.some(f => f.size > 2 * 1024 * 1024)) { toast.error('Cada foto deve ter no máximo 2MB'); return; }
    setForm(p => ({ ...p, heroItems: [...p.heroItems, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))] }));
    if (heroRef.current) heroRef.current.value = '';
  };
  const removeHero = (i: number) => {
    URL.revokeObjectURL(form.heroItems[i].preview);
    setForm(p => ({ ...p, heroItems: p.heroItems.filter((_, idx) => idx !== i) }));
  };

  // ── AI helper ────────────────────────────────────────────────────────────────
  const handleMelhorarHistoria = async () => {
    if (!form.historia.trim()) { toast.error('Escreva algo primeiro para melhorar com IA'); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('melhorar-mensagem', {
        body: {
          mensagem: form.historia,
          contexto: 'História de uma igreja evangélica para o site público. Reescreva de forma clara, inspiradora e acolhedora, mantendo as informações originais. Máximo 3 parágrafos.',
        },
      });
      if (error) throw error;
      if (data?.mensagem_melhorada) {
        set('historia', data.mensagem_melhorada);
        toast.success('Texto melhorado com IA!');
      }
    } catch {
      toast.error('Erro ao melhorar com IA');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.nome.trim()) return 'Nome da igreja é obrigatório';
      if (!form.slug.trim()) return 'Slug é obrigatório';
      if (!/^[a-z0-9-]+$/.test(form.slug)) return 'Slug: apenas letras minúsculas, números e hífens';
      if (slugStatus === 'taken') return 'Este slug já está em uso';
    }
    if (step === 3 && form.heroItems.length === 0) return 'Adicione pelo menos 1 foto para o slideshow';
    if (step === 5) {
      if (!form.cidade.trim()) return 'Cidade é obrigatória';
      if (!form.estado) return 'Estado é obrigatório';
    }
    if (step === 7) {
      if (!form.responsavel_nome.trim()) return 'Nome do responsável é obrigatório';
      if (!form.responsavel_email.trim()) return 'E-mail do responsável é obrigatório';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.responsavel_email)) return 'E-mail inválido';
    }
    return null;
  };

  const nextStep = async () => {
    if (step === 1) await checkSlug(form.slug);
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  // ── Upload ───────────────────────────────────────────────────────────────────
  const upload = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const { data, error } = await supabase.storage
      .from('church-assets')
      .upload(`${path}.${ext}`, file, { upsert: true });
    if (error) { console.error('upload error:', error); return null; }
    return supabase.storage.from('church-assets').getPublicUrl(data.path).data.publicUrl;
  };

  // ── Create ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const ts = Date.now();
      const s = form.slug;

      const [logoUrl, loginUrl, ...heroUrls] = await Promise.all([
        form.logoFile  ? upload(form.logoFile,  `${s}/logo-${ts}`)  : Promise.resolve(null),
        form.loginFile ? upload(form.loginFile, `${s}/login-${ts}`) : Promise.resolve(null),
        ...form.heroItems.map((h, i) => upload(h.file, `${s}/hero-${ts}-${i}`)),
      ]);

      const cc = form.cultos_config;
      const { data: igreja, error: iErr } = await supabase
        .from('igrejas')
        .insert({
          nome: form.nome.trim(), slug: form.slug.trim(),
          slogan: form.slogan.trim() || null,
          versiculo: form.versiculo.trim() || null,
          versiculo_referencia: form.versiculo_referencia.trim() || null,
          logo_url: logoUrl,
          cor_primaria: form.cor_primaria, cor_secundaria: form.cor_secundaria,
          foto_hero_urls: heroUrls.filter(Boolean),
          foto_login_url: loginUrl,
          missao: form.missao.trim() || null,
          visao: form.visao.trim() || null,
          historia: form.historia.trim() || null,
          cidade: form.cidade.trim(), estado: form.estado,
          endereco: form.endereco.trim() || null,
          telefone: form.telefone.trim() || null,
          email: form.email.trim() || null,
          google_maps_url: form.google_maps_url.trim() || null,
          cultos_config: cc,
          // Manter colunas legadas para compatibilidade
          horario_ebd:   cc.escola_biblica.ativo   ? `${cc.escola_biblica.nome} — ${labelDia(cc.escola_biblica.dia)} às ${cc.escola_biblica.horario}`     : null,
          horario_culto: cc.culto_principal.ativo  ? `${cc.culto_principal.nome} — ${labelDia(cc.culto_principal.dia)} às ${cc.culto_principal.horario}`   : null,
          horario_bases: cc.pequenos_grupos.ativo  ? `${cc.pequenos_grupos.nome} — ${cc.pequenos_grupos.descricao}` : null,
          whatsapp: form.whatsapp.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          youtube_url:   form.youtube_url.trim() || null,
          facebook_url:  form.facebook_url.trim() || null,
          site_url:      form.site_url.trim() || null,
          responsavel_nome:      form.responsavel_nome.trim(),
          responsavel_email:     form.responsavel_email.trim(),
          responsavel_telefone:  form.responsavel_telefone.trim() || null,
          plano: 'teste', ativo: true,
        })
        .select('id').single();

      if (iErr || !igreja) throw iErr ?? new Error('Falha ao criar a igreja');
      const id = igreja.id;

      // Seed ministérios — com check de erro
      const { error: mErr } = await supabase.from('ministerios').insert([
        { nome: 'Ministério de Música',     tipo: 'musica',     church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Recepção',   tipo: 'recepcao',   church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério Infantil',      tipo: 'mca',        church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Celebração', tipo: 'celebracao', church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Ensino',     tipo: 'ensino',     church_id: id, ativo: true, is_core: true },
      ]);
      if (mErr) console.error('Seed ministérios falhou:', mErr);

      // Seed categorias — com check de erro
      const { error: cErr } = await supabase.from('categorias_financeiras').insert([
        { nome: 'Dízimos',        natureza: 'receita', church_id: id },
        { nome: 'Ofertas',        natureza: 'receita', church_id: id },
        { nome: 'Missões',        natureza: 'receita', church_id: id },
        { nome: 'Aluguel/Espaço', natureza: 'despesa', church_id: id },
        { nome: 'Materiais',      natureza: 'despesa', church_id: id },
        { nome: 'Eventos',        natureza: 'despesa', church_id: id },
        { nome: 'Salários',       natureza: 'despesa', church_id: id },
      ]);
      if (cErr) console.error('Seed categorias falhou:', cErr);

      toast.success(`Igreja "${form.nome}" criada com sucesso!`);
      navigate('/admin');
    } catch (e) {
      console.error('handleCreate error:', e);
      toast.error('Erro ao criar igreja. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────
  const labelDia = (dia: string) => DIAS_SEMANA.find(d => d.value === dia)?.label ?? dia;

  const UploadBox = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick}
      className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 py-4 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
      {children}
    </button>
  );

  const CultoToggleBlock = ({
    title, configKey, children,
  }: {
    title: string;
    configKey: 'culto_principal' | 'escola_biblica' | 'pequenos_grupos';
    children: React.ReactNode;
  }) => {
    const block = form.cultos_config[configKey];
    return (
      <div className={`border rounded-xl p-4 transition-all ${block.ativo ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm text-gray-700">{title}</span>
          <Switch checked={block.ativo} onCheckedChange={v => setCulto(configKey, 'ativo', v)} />
        </div>
        {block.ativo && <div className="space-y-3">{children}</div>}
      </div>
    );
  };

  // ── Steps render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Igreja</h1>
            <p className="text-sm text-gray-500">Preencha todas as informações antes de criar</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon; const n = i + 1;
              const done = step > n; const cur = step === n;
              return (
                <div key={s.label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                    ${done ? 'bg-green-600 text-white' : cur ? 'bg-emerald-700 text-white ring-4 ring-emerald-200' : 'bg-gray-200 text-gray-500'}`}>
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block leading-tight text-center ${cur ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Etapa {step} de {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        {/* ══════════════ ETAPA 1 — IDENTIDADE ══════════════ */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><Building2 className="h-5 w-5" />Identidade Básica</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nome da Igreja <span className="text-red-500">*</span></Label>
                <Input value={form.nome} onChange={e => handleNomeChange(e.target.value)} placeholder="Ex: Igreja da Promessa Sumaré" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  Slug (URL) <span className="text-red-500">*</span>
                  {slugStatus === 'checking' && <span className="text-gray-400 text-xs">Verificando…</span>}
                  {slugStatus === 'ok'       && <span className="text-green-600 text-xs">✓ Disponível</span>}
                  {slugStatus === 'taken'    && <span className="text-red-500 text-xs">✗ Já em uso</span>}
                </Label>
                <Input value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  onBlur={() => form.slug && checkSlug(form.slug)}
                  placeholder="promessa-sumare" />
                <p className="text-xs text-gray-400">Apenas letras minúsculas, números e hífens</p>
              </div>
              <div className="space-y-1">
                <Label>Slogan / Tagline</Label>
                <Input value={form.slogan} onChange={e => set('slogan', e.target.value)} placeholder="Ex: Uma igreja para toda família" />
              </div>
              <div className="space-y-1">
                <Label>Versículo bíblico</Label>
                <Textarea value={form.versiculo} onChange={e => set('versiculo', e.target.value)} placeholder="Ex: Porque Deus amou o mundo de tal maneira…" rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Referência do versículo</Label>
                <Input value={form.versiculo_referencia} onChange={e => set('versiculo_referencia', e.target.value)} placeholder="Ex: João 3.16" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 2 — VISUAL ══════════════ */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><Palette className="h-5 w-5" />Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Igreja <span className="text-gray-400 text-xs">(PNG, JPEG, SVG, máx 2MB)</span></Label>
                {form.logoPreview ? (
                  <div className="relative w-28 h-28 border rounded-xl bg-gray-50 overflow-hidden">
                    <img src={form.logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    <button onClick={() => clearSingle('logoFile', 'logoPreview')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <UploadBox onClick={() => logoRef.current?.click()}>
                    <Upload className="h-6 w-6 mb-1" /><span className="text-xs">Clique para enviar logo</span>
                  </UploadBox>
                )}
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                  onChange={e => handleSingleImage(e, 'logoFile', 'logoPreview')} />
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-4">
                {(['cor_primaria', 'cor_secundaria'] as const).map(key => (
                  <div key={key} className="space-y-2">
                    <Label>{key === 'cor_primaria' ? 'Cor Primária *' : 'Cor Secundária'}</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form[key] || '#000000'} onChange={e => set(key, e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <Input value={form[key]} onChange={e => set(key, e.target.value)} className="font-mono text-sm" />
                    </div>
                    <div className="h-5 rounded-md" style={{ backgroundColor: form[key] || '#ccc' }} />
                  </div>
                ))}
              </div>

              {/* Foto de login — 1.1 */}
              <div className="space-y-2">
                <Label>Foto da Tela de Login <span className="text-gray-400 text-xs">(opcional)</span></Label>
                {form.loginPreview ? (
                  <div className="relative w-full h-28 border rounded-xl overflow-hidden">
                    <img src={form.loginPreview} alt="Login" className="w-full h-full object-cover" />
                    <button onClick={() => clearSingle('loginFile', 'loginPreview')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <UploadBox onClick={() => loginRef.current?.click()}>
                    <ImageIcon className="h-5 w-5 mb-1" /><span className="text-sm">Adicionar foto de login</span>
                  </UploadBox>
                )}
                <input ref={loginRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => handleSingleImage(e, 'loginFile', 'loginPreview')} />
                {/* 1.1 — Orientação */}
                <p className="text-xs text-gray-400">
                  Recomendado: 1920×1080px (proporção 16:9), mínimo 1280×720px. Formatos: JPG, PNG, WebP.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 3 — FOTOS HERO ══════════════ */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800"><Camera className="h-5 w-5" />Fotos do Site Público (Hero)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Até 4 fotos para o slideshow da página inicial. Mínimo 1 obrigatória.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {form.heroItems.map((item, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100">
                    <img src={item.preview} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeHero(i)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow"><X className="h-3 w-3" /></button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{i + 1}</span>
                  </div>
                ))}
                {form.heroItems.length < 4 && (
                  <button onClick={() => heroRef.current?.click()}
                    className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs text-center px-2">{form.heroItems.length === 0 ? 'Adicionar fotos' : `+ foto (${form.heroItems.length}/4)`}</span>
                  </button>
                )}
              </div>
              <input ref={heroRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleHeroAdd} />
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Dicas:</strong> Use fotos em modo paisagem (16:9), alta resolução (min 1280×720px), máx 2MB cada.
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 4 — SOBRE ══════════════ */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><BookOpen className="h-5 w-5" />Sobre a Igreja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Missão</Label>
                <Textarea value={form.missao} onChange={e => set('missao', e.target.value)} placeholder="Ex: Existimos para Amar e Servir a Deus e as pessoas…" rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Visão</Label>
                <Textarea value={form.visao} onChange={e => set('visao', e.target.value)} placeholder="Ex: Ser uma igreja consolidada, saudável e relevante…" rows={3} />
              </div>
              {/* 1.2 — Botão IA na História */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>História Resumida</Label>
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={handleMelhorarHistoria}
                    disabled={aiLoading}
                    className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-7 px-2 gap-1"
                  >
                    {aiLoading
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Melhorando…</>
                      : <><Sparkles className="h-3 w-3" />✨ Melhore com IA</>
                    }
                  </Button>
                </div>
                <Textarea
                  value={form.historia} onChange={e => set('historia', e.target.value)}
                  placeholder="Conte brevemente a história da igreja…" rows={5} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 5 — LOCALIZAÇÃO ══════════════ */}
        {step === 5 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><MapPin className="h-5 w-5" />Localização e Contato</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* 1.3 — CEP */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  <Search className="h-3.5 w-3.5" /> CEP
                  {cepLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-1" />}
                </Label>
                <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} />
                <p className="text-xs text-gray-400">Preencha o CEP para buscar o endereço automaticamente</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Cidade <span className="text-red-500">*</span></Label>
                  <Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: Sumaré" />
                </div>
                <div className="space-y-1">
                  <Label>Estado <span className="text-red-500">*</span></Label>
                  <Select value={form.estado} onValueChange={v => set('estado', v)}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Endereço Completo</Label>
                <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Telefone</Label>
                  <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(19) 99999-9999" />
                </div>
                <div className="space-y-1">
                  <Label>E-mail da Igreja</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contato@igreja.com.br" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Google Maps URL</Label>
                <Input value={form.google_maps_url} onChange={e => set('google_maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
              </div>

              {/* 1.4 — Cultos configuráveis */}
              <Separator />
              <p className="text-sm font-semibold text-gray-700">Cultos e Encontros</p>

              <CultoToggleBlock title="Culto Principal" configKey="culto_principal">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={form.cultos_config.culto_principal.nome}
                    onChange={e => setCulto('culto_principal', 'nome', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Dia da semana</Label>
                    <Select value={form.cultos_config.culto_principal.dia}
                      onValueChange={v => setCulto('culto_principal', 'dia', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horário</Label>
                    <Input type="time" value={form.cultos_config.culto_principal.horario}
                      onChange={e => setCulto('culto_principal', 'horario', e.target.value)} />
                  </div>
                </div>
              </CultoToggleBlock>

              <CultoToggleBlock title="Escola Bíblica" configKey="escola_biblica">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={form.cultos_config.escola_biblica.nome}
                    onChange={e => setCulto('escola_biblica', 'nome', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Dia da semana</Label>
                    <Select value={form.cultos_config.escola_biblica.dia}
                      onValueChange={v => setCulto('escola_biblica', 'dia', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DIAS_SEMANA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horário</Label>
                    <Input type="time" value={form.cultos_config.escola_biblica.horario}
                      onChange={e => setCulto('escola_biblica', 'horario', e.target.value)} />
                  </div>
                </div>
              </CultoToggleBlock>

              <CultoToggleBlock title="Pequenos Grupos" configKey="pequenos_grupos">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={form.cultos_config.pequenos_grupos.nome}
                    onChange={e => setCulto('pequenos_grupos', 'nome', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={form.cultos_config.pequenos_grupos.descricao}
                    onChange={e => setCulto('pequenos_grupos', 'descricao', e.target.value)}
                    placeholder="Ex: Durante a semana" />
                </div>
              </CultoToggleBlock>
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 6 — REDES SOCIAIS ══════════════ */}
        {step === 6 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><Share2 className="h-5 w-5" />Redes Sociais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Phone,     label: 'WhatsApp',     key: 'whatsapp',     ph: '(19) 99999-9999' },
                { icon: Instagram, label: 'Instagram',    key: 'instagram_url',ph: 'https://instagram.com/suaigreja' },
                { icon: Youtube,   label: 'YouTube',      key: 'youtube_url',  ph: 'https://youtube.com/@suaigreja' },
                { icon: Facebook,  label: 'Facebook',     key: 'facebook_url', ph: 'https://facebook.com/suaigreja' },
                { icon: Globe,     label: 'Site URL',     key: 'site_url',     ph: 'https://www.suaigreja.com.br' },
              ].map(({ icon: Icon, label, key, ph }) => (
                <div key={key} className="space-y-1">
                  <Label className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{label}</Label>
                  <Input value={form[key as keyof FormData] as string}
                    onChange={e => set(key as keyof FormData, e.target.value)} placeholder={ph} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ══════════════ ETAPA 7 — RESPONSÁVEL + REVISÃO ══════════════ */}
        {step === 7 && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><User className="h-5 w-5" />Responsável pela Igreja</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Nome do Pastor / Responsável <span className="text-red-500">*</span></Label>
                  <Input value={form.responsavel_nome} onChange={e => set('responsavel_nome', e.target.value)} placeholder="Ex: Pastor João Silva" />
                </div>
                <div className="space-y-1">
                  <Label>E-mail do Responsável <span className="text-red-500">*</span></Label>
                  <Input type="email" value={form.responsavel_email} onChange={e => set('responsavel_email', e.target.value)} placeholder="pastor@igreja.com.br" />
                </div>
                <div className="space-y-1">
                  <Label>Telefone do Responsável</Label>
                  <Input value={form.responsavel_telefone} onChange={e => set('responsavel_telefone', e.target.value)} placeholder="(19) 99999-9999" />
                </div>
              </CardContent>
            </Card>

            {/* Preview card */}
            <div className="rounded-xl overflow-hidden shadow-lg"
              style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}>
              <div className="p-6 text-white">
                <div className="flex items-center gap-4">
                  {form.logoPreview
                    ? <img src={form.logoPreview} alt="Logo" className="w-16 h-16 object-contain bg-white/20 rounded-xl p-1 shrink-0" />
                    : <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><Building2 className="h-8 w-8 text-white/70" /></div>
                  }
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate">{form.nome || 'Nome da Igreja'}</h2>
                    {form.slogan && <p className="text-white/80 text-sm mt-0.5">{form.slogan}</p>}
                    {form.cidade && form.estado && <p className="text-white/60 text-xs mt-1">{form.cidade}, {form.estado}</p>}
                  </div>
                </div>
                {form.versiculo && (
                  <div className="mt-4 bg-white/10 rounded-lg p-3">
                    <p className="text-sm italic">"{form.versiculo}"</p>
                    {form.versiculo_referencia && <p className="text-xs text-white/60 mt-1">— {form.versiculo_referencia}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <SRow label="Slug"        value={`/i/${form.slug}`} />
                <SRow label="Cidade"      value={form.cidade && form.estado ? `${form.cidade}–${form.estado}` : ''} />
                {form.endereco && <SRow label="Endereço"   value={form.endereco} />}
                {form.telefone && <SRow label="Telefone"   value={form.telefone} />}
                {form.email    && <SRow label="E-mail"     value={form.email} />}
                <Separator />
                <SRow label="Responsável" value={form.responsavel_nome} />
                <SRow label="E-mail resp." value={form.responsavel_email} />
                <Separator />
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Seed automático após criação</p>
                  <p className="text-xs text-emerald-700">5 ministérios + 7 categorias financeiras</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1
            ? <Button variant="outline" onClick={prevStep} disabled={loading}><ArrowLeft className="h-4 w-4 mr-2" />Anterior</Button>
            : <div />
          }
          {step < STEPS.length
            ? <Button onClick={nextStep} className="bg-emerald-700 hover:bg-emerald-800">Próximo<ArrowRight className="h-4 w-4 ml-2" /></Button>
            : <Button onClick={handleCreate} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 px-8">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando…</> : <><Check className="h-4 w-4 mr-2" />Criar Igreja</>}
              </Button>
          }
        </div>
      </div>
    </div>
  );
}

function SRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 min-w-24 shrink-0">{label}</span>
      <span className="font-medium text-gray-800 break-all">{value}</span>
    </div>
  );
}
