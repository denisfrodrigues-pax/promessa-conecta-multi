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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Check, Building2, Palette, MapPin,
  User, Eye, Upload, X, Loader2, Globe, Phone, Instagram,
  Youtube, Facebook, BookOpen, Image as ImageIcon, Share2, Camera,
} from 'lucide-react';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const STEPS = [
  { label: 'Identidade',   icon: Building2 },
  { label: 'Visual',       icon: Palette },
  { label: 'Fotos Hero',   icon: Camera },
  { label: 'Sobre',        icon: BookOpen },
  { label: 'Localização',  icon: MapPin },
  { label: 'Redes',        icon: Share2 },
  { label: 'Responsável',  icon: User },
];

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface HeroItem { file: File; preview: string; }

interface FormData {
  // Step 1
  nome: string; slug: string; slogan: string; versiculo: string; versiculo_referencia: string;
  // Step 2
  logoFile: File | null; logoPreview: string;
  cor_primaria: string; cor_secundaria: string;
  loginFile: File | null; loginPreview: string;
  // Step 3
  heroItems: HeroItem[];
  // Step 4
  missao: string; visao: string; historia: string;
  // Step 5
  cidade: string; estado: string; endereco: string;
  telefone: string; email: string; google_maps_url: string;
  horario_ebd: string; horario_culto: string; horario_bases: string;
  // Step 6
  whatsapp: string; instagram_url: string; youtube_url: string;
  facebook_url: string; site_url: string;
  // Step 7
  responsavel_nome: string; responsavel_email: string; responsavel_telefone: string;
}

const INIT: FormData = {
  nome: '', slug: '', slogan: '', versiculo: '', versiculo_referencia: '',
  logoFile: null, logoPreview: '', cor_primaria: '#2D6A4F', cor_secundaria: '#1B4332',
  loginFile: null, loginPreview: '',
  heroItems: [],
  missao: '', visao: '', historia: '',
  cidade: '', estado: '', endereco: '', telefone: '', email: '', google_maps_url: '',
  horario_ebd: '', horario_culto: '', horario_bases: '',
  whatsapp: '', instagram_url: '', youtube_url: '', facebook_url: '', site_url: '',
  responsavel_nome: '', responsavel_email: '', responsavel_telefone: '',
};

export default function NovaIgreja() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [form, setForm] = useState<FormData>(INIT);

  const logoRef  = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const heroRef  = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  /* ── slug helpers ── */
  const handleNomeChange = (v: string) => {
    set('nome', v);
    if (!slugManual) set('slug', generateSlug(v));
  };
  const handleSlugChange = (v: string) => {
    const clean = v.toLowerCase().replace(/[^a-z0-9-]/g, '');
    set('slug', clean);
    setSlugManual(true);
    setSlugStatus('idle');
  };
  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setSlugStatus('checking');
    const { data } = await supabase.from('igrejas').select('id').eq('slug', slug).maybeSingle();
    setSlugStatus(data ? 'taken' : 'ok');
  };

  /* ── image helpers ── */
  const handleSingleImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileKey: 'logoFile' | 'loginFile',
    previewKey: 'logoPreview' | 'loginPreview',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }
    const preview = URL.createObjectURL(file);
    setForm(p => ({ ...p, [fileKey]: file, [previewKey]: preview }));
  };
  const clearSingle = (fileKey: 'logoFile' | 'loginFile', previewKey: 'logoPreview' | 'loginPreview') => {
    if (form[previewKey]) URL.revokeObjectURL(form[previewKey] as string);
    setForm(p => ({ ...p, [fileKey]: null, [previewKey]: '' }));
  };

  const handleHeroAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 4 - form.heroItems.length;
    const toAdd = files.slice(0, remaining);
    const invalid = toAdd.filter(f => f.size > 2 * 1024 * 1024);
    if (invalid.length) { toast.error('Cada foto deve ter no máximo 2MB'); return; }
    const items: HeroItem[] = toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setForm(p => ({ ...p, heroItems: [...p.heroItems, ...items] }));
    if (heroRef.current) heroRef.current.value = '';
  };
  const removeHero = (i: number) => {
    URL.revokeObjectURL(form.heroItems[i].preview);
    setForm(p => ({ ...p, heroItems: p.heroItems.filter((_, idx) => idx !== i) }));
  };

  /* ── validation ── */
  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.nome.trim()) return 'Nome da igreja é obrigatório';
      if (!form.slug.trim()) return 'Slug é obrigatório';
      if (!/^[a-z0-9-]+$/.test(form.slug)) return 'Slug só pode ter letras minúsculas, números e hífens';
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

  /* ── upload helper ── */
  const upload = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const { data, error } = await supabase.storage
      .from('church-assets')
      .upload(`${path}.${ext}`, file, { upsert: true });
    if (error) { console.error(error); return null; }
    return supabase.storage.from('church-assets').getPublicUrl(data.path).data.publicUrl;
  };

  /* ── create ── */
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

      const { data: igreja, error: iErr } = await supabase
        .from('igrejas')
        .insert({
          nome: form.nome.trim(),
          slug: form.slug.trim(),
          slogan: form.slogan.trim() || null,
          versiculo: form.versiculo.trim() || null,
          versiculo_referencia: form.versiculo_referencia.trim() || null,
          logo_url: logoUrl,
          cor_primaria: form.cor_primaria,
          cor_secundaria: form.cor_secundaria,
          foto_hero_urls: heroUrls.filter(Boolean),
          foto_login_url: loginUrl,
          missao: form.missao.trim() || null,
          visao: form.visao.trim() || null,
          historia: form.historia.trim() || null,
          cidade: form.cidade.trim(),
          estado: form.estado,
          endereco: form.endereco.trim() || null,
          telefone: form.telefone.trim() || null,
          email: form.email.trim() || null,
          google_maps_url: form.google_maps_url.trim() || null,
          horario_ebd: form.horario_ebd.trim() || null,
          horario_culto: form.horario_culto.trim() || null,
          horario_bases: form.horario_bases.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          youtube_url: form.youtube_url.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          site_url: form.site_url.trim() || null,
          responsavel_nome: form.responsavel_nome.trim(),
          responsavel_email: form.responsavel_email.trim(),
          responsavel_telefone: form.responsavel_telefone.trim() || null,
          plano: 'teste',
          ativo: true,
        })
        .select('id')
        .single();

      if (iErr || !igreja) throw iErr ?? new Error('Falha ao criar igreja');
      const id = igreja.id;

      await supabase.from('ministerios').insert([
        { nome: 'Ministério de Música',     tipo: 'musica',     church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Recepção',   tipo: 'recepcao',   church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério Infantil',      tipo: 'mca',        church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Celebração', tipo: 'celebracao', church_id: id, ativo: true, is_core: true },
        { nome: 'Ministério de Ensino',     tipo: 'ensino',     church_id: id, ativo: true, is_core: true },
      ]);

      await supabase.from('categorias_financeiras').insert([
        { nome: 'Dízimos',        natureza: 'receita', church_id: id },
        { nome: 'Ofertas',        natureza: 'receita', church_id: id },
        { nome: 'Missões',        natureza: 'receita', church_id: id },
        { nome: 'Aluguel/Espaço', natureza: 'despesa', church_id: id },
        { nome: 'Materiais',      natureza: 'despesa', church_id: id },
        { nome: 'Eventos',        natureza: 'despesa', church_id: id },
        { nome: 'Salários',       natureza: 'despesa', church_id: id },
      ]);

      toast.success(`Igreja "${form.nome}" criada com sucesso!`);
      navigate('/admin');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar igreja. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  /* ── UI helpers ── */
  const UploadBox = ({
    onClick, children,
  }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button" onClick={onClick}
      className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 py-4 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Igreja</h1>
            <p className="text-sm text-gray-500">Preencha todas as informações antes de criar</p>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const n = i + 1;
              const done = step > n;
              const cur  = step === n;
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

        {/* ════════════════════ ETAPA 1 — IDENTIDADE ════════════════════ */}
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

        {/* ════════════════════ ETAPA 2 — VISUAL ════════════════════ */}
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
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Clique para enviar logo</span>
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
                      <input type="color" value={form[key] || '#000000'}
                        onChange={e => set(key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <Input value={form[key]} onChange={e => set(key, e.target.value)} className="font-mono text-sm" />
                    </div>
                    <div className="h-5 rounded-md" style={{ backgroundColor: form[key] || '#ccc' }} />
                  </div>
                ))}
              </div>

              {/* Foto de login */}
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
                    <ImageIcon className="h-5 w-5 mb-1" />
                    <span className="text-sm">Adicionar foto de login</span>
                  </UploadBox>
                )}
                <input ref={loginRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => handleSingleImage(e, 'loginFile', 'loginPreview')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════ ETAPA 3 — FOTOS HERO ════════════════════ */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800"><Camera className="h-5 w-5" />Fotos do Site Público (Hero)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Até 4 fotos para o slideshow da página inicial. Mínimo 1 obrigatória.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Grid de previews */}
              <div className="grid grid-cols-2 gap-3">
                {form.heroItems.map((item, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100">
                    <img src={item.preview} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeHero(i)}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow">
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}

                {form.heroItems.length < 4 && (
                  <button onClick={() => heroRef.current?.click()}
                    className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs text-center px-2">
                      {form.heroItems.length === 0 ? 'Adicionar fotos' : `+ foto (${form.heroItems.length}/4)`}
                    </span>
                  </button>
                )}
              </div>

              <input ref={heroRef} type="file" accept="image/png,image/jpeg,image/webp"
                multiple className="hidden" onChange={handleHeroAdd} />

              {form.heroItems.length > 0 && (
                <p className="text-xs text-gray-400 text-center">{form.heroItems.length} de 4 fotos selecionadas • arraste para reordenar</p>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Dicas:</strong> Use fotos em modo paisagem (16:9), alta resolução (min 1280×720px), máx 2MB cada.
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════ ETAPA 4 — SOBRE ════════════════════ */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><BookOpen className="h-5 w-5" />Sobre a Igreja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Missão</Label>
                <Textarea value={form.missao} onChange={e => set('missao', e.target.value)}
                  placeholder="Ex: Existimos para Amar e Servir a Deus e as pessoas…" rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Visão</Label>
                <Textarea value={form.visao} onChange={e => set('visao', e.target.value)}
                  placeholder="Ex: Ser uma igreja consolidada, saudável e relevante…" rows={3} />
              </div>
              <div className="space-y-1">
                <Label>História Resumida</Label>
                <Textarea value={form.historia} onChange={e => set('historia', e.target.value)}
                  placeholder="Conte brevemente a história da igreja…" rows={4} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════ ETAPA 5 — LOCALIZAÇÃO ════════════════════ */}
        {step === 5 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><MapPin className="h-5 w-5" />Localização e Contato</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro, CEP" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Telefone</Label>
                  <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(19) 99999-9999" />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />E-mail da Igreja</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contato@igreja.com.br" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Google Maps URL</Label>
                <Input value={form.google_maps_url} onChange={e => set('google_maps_url', e.target.value)} placeholder="https://maps.google.com/..." />
              </div>

              <Separator />
              <p className="text-sm font-medium text-gray-700">Horários dos Cultos</p>

              <div className="space-y-1">
                <Label>Escola Bíblica (EBD)</Label>
                <Input value={form.horario_ebd} onChange={e => set('horario_ebd', e.target.value)} placeholder="Ex: Sábados às 18h00" />
              </div>
              <div className="space-y-1">
                <Label>Culto de Celebração</Label>
                <Input value={form.horario_culto} onChange={e => set('horario_culto', e.target.value)} placeholder="Ex: Sábados às 19h07" />
              </div>
              <div className="space-y-1">
                <Label>Bases / Grupos</Label>
                <Input value={form.horario_bases} onChange={e => set('horario_bases', e.target.value)} placeholder="Ex: Durante a semana" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════ ETAPA 6 — REDES SOCIAIS ════════════════════ */}
        {step === 6 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800"><Share2 className="h-5 w-5" />Redes Sociais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(19) 99999-9999" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" />Instagram URL</Label>
                <Input value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/suaigreja" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Youtube className="h-3.5 w-3.5" />YouTube URL</Label>
                <Input value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} placeholder="https://youtube.com/@suaigreja" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" />Facebook URL</Label>
                <Input value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/suaigreja" />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Site URL</Label>
                <Input value={form.site_url} onChange={e => set('site_url', e.target.value)} placeholder="https://www.suaigreja.com.br" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ════════════════════ ETAPA 7 — RESPONSÁVEL + REVISÃO ════════════════════ */}
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
                  {form.logoPreview ? (
                    <img src={form.logoPreview} alt="Logo" className="w-16 h-16 object-contain bg-white/20 rounded-xl p-1 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate">{form.nome || 'Nome da Igreja'}</h2>
                    {form.slogan && <p className="text-white/80 text-sm mt-0.5">{form.slogan}</p>}
                    {form.cidade && form.estado && (
                      <p className="text-white/60 text-xs mt-1">{form.cidade}, {form.estado}</p>
                    )}
                  </div>
                </div>
                {form.versiculo && (
                  <div className="mt-4 bg-white/10 rounded-lg p-3">
                    <p className="text-sm italic">"{form.versiculo}"</p>
                    {form.versiculo_referencia && <p className="text-xs text-white/60 mt-1">— {form.versiculo_referencia}</p>}
                  </div>
                )}
                {form.heroItems.length > 0 && (
                  <p className="text-xs text-white/50 mt-3">{form.heroItems.length} foto(s) de capa · {form.responsavel_nome}</p>
                )}
              </div>
            </div>

            {/* Resumo */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <SRow label="Slug"       value={`/i/${form.slug}`} />
                <SRow label="Cidade"     value={form.cidade && form.estado ? `${form.cidade}–${form.estado}` : ''} />
                {form.endereco && <SRow label="Endereço" value={form.endereco} />}
                {form.telefone && <SRow label="Telefone" value={form.telefone} />}
                {form.email    && <SRow label="E-mail"   value={form.email} />}
                <Separator />
                <SRow label="Responsável" value={form.responsavel_nome} />
                <SRow label="E-mail resp." value={form.responsavel_email} />
                <Separator />
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Seed automático</p>
                  <p className="text-xs text-emerald-700">5 ministérios + 7 categorias financeiras</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
            </Button>
          ) : <div />}

          {step < STEPS.length ? (
            <Button onClick={nextStep} className="bg-emerald-700 hover:bg-emerald-800">
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 px-8">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando…</> : <><Check className="h-4 w-4 mr-2" />Criar Igreja</>}
            </Button>
          )}
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
