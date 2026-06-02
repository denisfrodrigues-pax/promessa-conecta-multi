import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Check, Building2, Palette, MapPin,
  User, Eye, Upload, X, Loader2, Globe, Phone, Instagram,
  Youtube, Facebook, BookOpen, Image as ImageIcon,
} from 'lucide-react';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const STEPS = [
  { label: 'Identidade', icon: Building2 },
  { label: 'Visual',     icon: Palette },
  { label: 'Localização',icon: MapPin },
  { label: 'Responsável',icon: User },
  { label: 'Revisão',   icon: Eye },
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

interface FormData {
  nome: string;
  slug: string;
  slogan: string;
  versiculo: string;
  versiculo_referencia: string;
  logoFile: File | null;
  logoPreview: string;
  cor_primaria: string;
  cor_secundaria: string;
  heroFile: File | null;
  heroPreview: string;
  loginFile: File | null;
  loginPreview: string;
  cidade: string;
  estado: string;
  endereco: string;
  whatsapp: string;
  instagram_url: string;
  youtube_url: string;
  facebook_url: string;
  site_url: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
}

export default function NovaIgreja() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [slugExists, setSlugExists] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const logoInputRef  = useRef<HTMLInputElement>(null);
  const heroInputRef  = useRef<HTMLInputElement>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    nome: '', slug: '', slogan: '', versiculo: '', versiculo_referencia: '',
    logoFile: null, logoPreview: '',
    cor_primaria: '#2D6A4F', cor_secundaria: '#1B4332',
    heroFile: null, heroPreview: '',
    loginFile: null, loginPreview: '',
    cidade: '', estado: '', endereco: '',
    whatsapp: '', instagram_url: '', youtube_url: '', facebook_url: '', site_url: '',
    responsavel_nome: '', responsavel_email: '', responsavel_telefone: '',
  });

  const set = (field: keyof FormData, value: string | File | null) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleNomeChange = (nome: string) => {
    set('nome', nome);
    if (!slugManual) set('slug', generateSlug(nome));
  };

  const handleSlugChange = (slug: string) => {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    set('slug', clean);
    setSlugManual(true);
    setSlugExists(false);
  };

  const checkSlug = async (slug: string) => {
    if (!slug) return;
    setCheckingSlug(true);
    const { data } = await supabase.from('igrejas').select('id').eq('slug', slug).maybeSingle();
    setSlugExists(!!data);
    setCheckingSlug(false);
  };

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileField: 'logoFile' | 'heroFile' | 'loginFile',
    previewField: 'logoPreview' | 'heroPreview' | 'loginPreview',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, [fileField]: file, [previewField]: preview }));
  };

  const clearImage = (
    fileField: 'logoFile' | 'heroFile' | 'loginFile',
    previewField: 'logoPreview' | 'heroPreview' | 'loginPreview',
  ) => {
    if (form[previewField]) URL.revokeObjectURL(form[previewField] as string);
    setForm(prev => ({ ...prev, [fileField]: null, [previewField]: '' }));
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.nome.trim()) return 'Nome da igreja é obrigatório';
      if (!form.slug.trim()) return 'Slug é obrigatório';
      if (!/^[a-z0-9-]+$/.test(form.slug)) return 'Slug deve conter apenas letras minúsculas, números e hífens';
      if (slugExists) return 'Este slug já está em uso';
    }
    if (step === 4) {
      if (!form.responsavel_nome.trim()) return 'Nome do responsável é obrigatório';
      if (!form.responsavel_email.trim()) return 'E-mail do responsável é obrigatório';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.responsavel_email))
        return 'E-mail inválido';
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

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `${path}.${ext}`;
    const { data, error } = await supabase.storage
      .from('church-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });
    if (error) { console.error(error); return null; }
    const { data: urlData } = supabase.storage.from('church-assets').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      const ts = Date.now();
      const slugBase = form.slug;

      const [logoUrl, heroUrl, loginUrl] = await Promise.all([
        form.logoFile  ? uploadImage(form.logoFile,  `${slugBase}/logo-${ts}`)  : Promise.resolve(null),
        form.heroFile  ? uploadImage(form.heroFile,  `${slugBase}/hero-${ts}`)  : Promise.resolve(null),
        form.loginFile ? uploadImage(form.loginFile, `${slugBase}/login-${ts}`) : Promise.resolve(null),
      ]);

      const { data: igreja, error: igrejaErr } = await supabase
        .from('igrejas')
        .insert({
          nome:                  form.nome.trim(),
          slug:                  form.slug.trim(),
          slogan:                form.slogan.trim() || null,
          versiculo:             form.versiculo.trim() || null,
          versiculo_referencia:  form.versiculo_referencia.trim() || null,
          logo_url:              logoUrl,
          cor_primaria:          form.cor_primaria,
          cor_secundaria:        form.cor_secundaria,
          foto_hero_urls:        heroUrl ? [heroUrl] : null,
          foto_login_url:        loginUrl,
          cidade:                form.cidade.trim() || null,
          estado:                form.estado || null,
          endereco:              form.endereco.trim() || null,
          whatsapp:              form.whatsapp.trim() || null,
          instagram_url:         form.instagram_url.trim() || null,
          youtube_url:           form.youtube_url.trim() || null,
          facebook_url:          form.facebook_url.trim() || null,
          site_url:              form.site_url.trim() || null,
          responsavel_nome:      form.responsavel_nome.trim(),
          responsavel_email:     form.responsavel_email.trim(),
          responsavel_telefone:  form.responsavel_telefone.trim() || null,
          plano:                 'teste',
          ativa:                 true,
        })
        .select('id')
        .single();

      if (igrejaErr || !igreja) throw igrejaErr ?? new Error('Falha ao criar igreja');

      const churchId = igreja.id;

      await supabase.from('ministerios').insert([
        { nome: 'Ministério de Música',    tipo: 'musica',     church_id: churchId, ativo: true, is_core: true },
        { nome: 'Ministério de Recepção',  tipo: 'recepcao',   church_id: churchId, ativo: true, is_core: true },
        { nome: 'Ministério Infantil',     tipo: 'mca',        church_id: churchId, ativo: true, is_core: true },
        { nome: 'Ministério de Celebração',tipo: 'celebracao', church_id: churchId, ativo: true, is_core: true },
        { nome: 'Ministério de Ensino',    tipo: 'ensino',     church_id: churchId, ativo: true, is_core: true },
      ]);

      await supabase.from('categorias_financeiras').insert([
        { nome: 'Dízimos',       natureza: 'receita',  church_id: churchId },
        { nome: 'Ofertas',       natureza: 'receita',  church_id: churchId },
        { nome: 'Missões',       natureza: 'receita',  church_id: churchId },
        { nome: 'Aluguel/Espaço',natureza: 'despesa',  church_id: churchId },
        { nome: 'Materiais',     natureza: 'despesa',  church_id: churchId },
        { nome: 'Eventos',       natureza: 'despesa',  church_id: churchId },
        { nome: 'Salários',      natureza: 'despesa',  church_id: churchId },
      ]);

      toast.success(`Igreja "${form.nome}" criada com sucesso!`);
      navigate('/admin');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Erro ao criar igreja. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const num = i + 1;
              const done = step > num;
              const current = step === num;
              return (
                <div key={s.label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${done    ? 'bg-green-600 text-white'
                    : current ? 'bg-emerald-700 text-white ring-4 ring-emerald-200'
                    : 'bg-gray-200 text-gray-500'}`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${current ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Etapa {step} de {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        {/* Step 1: Identidade */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-700" />Identidade da Igreja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="nome">Nome da Igreja <span className="text-red-500">*</span></Label>
                <Input
                  id="nome" value={form.nome}
                  onChange={e => handleNomeChange(e.target.value)}
                  placeholder="Ex: Igreja da Promessa Sumaré"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="slug">
                  Slug (URL) <span className="text-red-500">*</span>
                  {checkingSlug && <span className="text-gray-400 text-xs ml-2">Verificando...</span>}
                  {!checkingSlug && slugExists && <span className="text-red-500 text-xs ml-2">Já em uso</span>}
                  {!checkingSlug && !slugExists && form.slug && <span className="text-green-600 text-xs ml-2">Disponível</span>}
                </Label>
                <Input
                  id="slug" value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  onBlur={() => checkSlug(form.slug)}
                  placeholder="promessa-sumare"
                />
                <p className="text-xs text-gray-400">Apenas letras minúsculas, números e hífens</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="slogan">Slogan / Tagline</Label>
                <Input id="slogan" value={form.slogan} onChange={e => set('slogan', e.target.value)} placeholder="Ex: Uma Igreja para toda família" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="versiculo">Versículo bíblico</Label>
                <Textarea id="versiculo" value={form.versiculo} onChange={e => set('versiculo', e.target.value)} placeholder="Ex: Porque Deus amou o mundo de tal maneira..." rows={2} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="versiculo_ref">Referência do versículo</Label>
                <Input id="versiculo_ref" value={form.versiculo_referencia} onChange={e => set('versiculo_referencia', e.target.value)} placeholder="Ex: João 3.16" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Visual */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-emerald-700" />Identidade Visual</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Igreja</Label>
                {form.logoPreview ? (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                    <img src={form.logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    <button
                      onClick={() => clearImage('logoFile', 'logoPreview')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">PNG, JPEG, SVG</span>
                    <span className="text-xs">máx 2MB</span>
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                  onChange={e => handleImageSelect(e, 'logoFile', 'logoPreview')} />
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" id="cor_primaria" value={form.cor_primaria}
                      onChange={e => set('cor_primaria', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <Input value={form.cor_primaria} onChange={e => set('cor_primaria', e.target.value)} className="font-mono text-sm" />
                  </div>
                  <div className="h-6 rounded" style={{ backgroundColor: form.cor_primaria }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" id="cor_secundaria" value={form.cor_secundaria}
                      onChange={e => set('cor_secundaria', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <Input value={form.cor_secundaria} onChange={e => set('cor_secundaria', e.target.value)} className="font-mono text-sm" />
                  </div>
                  <div className="h-6 rounded" style={{ backgroundColor: form.cor_secundaria }} />
                </div>
              </div>

              {/* Foto Hero */}
              <div className="space-y-2">
                <Label>Foto de Capa / Hero <span className="text-gray-400 text-xs">(opcional)</span></Label>
                {form.heroPreview ? (
                  <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                    <img src={form.heroPreview} alt="Hero" className="w-full h-full object-cover" />
                    <button
                      onClick={() => clearImage('heroFile', 'heroPreview')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => heroInputRef.current?.click()}
                    className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">Clique para adicionar foto de capa</span>
                  </button>
                )}
                <input ref={heroInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => handleImageSelect(e, 'heroFile', 'heroPreview')} />
              </div>

              {/* Foto Login */}
              <div className="space-y-2">
                <Label>Foto da Tela de Login <span className="text-gray-400 text-xs">(opcional)</span></Label>
                {form.loginPreview ? (
                  <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                    <img src={form.loginPreview} alt="Login" className="w-full h-full object-cover" />
                    <button
                      onClick={() => clearImage('loginFile', 'loginPreview')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => loginInputRef.current?.click()}
                    className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">Clique para adicionar foto de login</span>
                  </button>
                )}
                <input ref={loginInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => handleImageSelect(e, 'loginFile', 'loginPreview')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Localização */}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-700" />Localização e Contato</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: Sumaré" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={form.estado} onValueChange={v => set('estado', v)}>
                    <SelectTrigger id="estado"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input id="endereco" value={form.endereco} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número, bairro" />
              </div>

              <Separator />

              <div className="space-y-1">
                <Label htmlFor="whatsapp" className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> WhatsApp</Label>
                <Input id="whatsapp" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(19) 99999-9999" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="instagram" className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
                <Input id="instagram" value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
              </div>

              <div className="space-y-1">
                <Label htmlFor="youtube" className="flex items-center gap-1"><Youtube className="h-3.5 w-3.5" /> YouTube</Label>
                <Input id="youtube" value={form.youtube_url} onChange={e => set('youtube_url', e.target.value)} placeholder="https://youtube.com/..." />
              </div>

              <div className="space-y-1">
                <Label htmlFor="facebook" className="flex items-center gap-1"><Facebook className="h-3.5 w-3.5" /> Facebook</Label>
                <Input id="facebook" value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
              </div>

              <div className="space-y-1">
                <Label htmlFor="site" className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Site</Label>
                <Input id="site" value={form.site_url} onChange={e => set('site_url', e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Responsável */}
        {step === 4 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-emerald-700" />Responsável pela Igreja</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="resp_nome">Nome do Pastor / Responsável <span className="text-red-500">*</span></Label>
                <Input id="resp_nome" value={form.responsavel_nome} onChange={e => set('responsavel_nome', e.target.value)} placeholder="Ex: Pastor João Silva" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resp_email">E-mail do Responsável <span className="text-red-500">*</span></Label>
                <Input id="resp_email" type="email" value={form.responsavel_email} onChange={e => set('responsavel_email', e.target.value)} placeholder="pastor@igreja.com.br" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resp_tel">Telefone do Responsável</Label>
                <Input id="resp_tel" value={form.responsavel_telefone} onChange={e => set('responsavel_telefone', e.target.value)} placeholder="(19) 99999-9999" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Revisão */}
        {step === 5 && (
          <div className="space-y-4">
            {/* Preview card da identidade visual */}
            <div
              className="rounded-xl overflow-hidden shadow-lg"
              style={{ background: `linear-gradient(135deg, ${form.cor_primaria}, ${form.cor_secundaria})` }}
            >
              <div className="p-6 text-white">
                <div className="flex items-center gap-4">
                  {form.logoPreview ? (
                    <img src={form.logoPreview} alt="Logo" className="w-16 h-16 object-contain bg-white/20 rounded-lg p-1" />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white/70" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{form.nome || 'Nome da Igreja'}</h2>
                    {form.slogan && <p className="text-white/80 text-sm">{form.slogan}</p>}
                    {form.cidade && form.estado && (
                      <p className="text-white/60 text-xs mt-1">{form.cidade}, {form.estado}</p>
                    )}
                  </div>
                </div>
                {form.versiculo && (
                  <div className="mt-4 bg-white/10 rounded-lg p-3">
                    <p className="text-sm italic">"{form.versiculo}"</p>
                    {form.versiculo_referencia && (
                      <p className="text-xs text-white/70 mt-1">— {form.versiculo_referencia}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <SummaryRow label="Slug" value={`/${form.slug}`} />
                {form.endereco && <SummaryRow label="Endereço" value={form.endereco} />}
                {form.whatsapp  && <SummaryRow label="WhatsApp" value={form.whatsapp} />}
                <Separator />
                <SummaryRow label="Responsável" value={form.responsavel_nome} />
                <SummaryRow label="E-mail" value={form.responsavel_email} />
                {form.responsavel_telefone && <SummaryRow label="Telefone" value={form.responsavel_telefone} />}
                <Separator />
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Seed automático após criação:</p>
                  <p className="text-xs text-emerald-700">5 ministérios padrão + 7 categorias financeiras</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <Button onClick={nextStep} className="bg-emerald-700 hover:bg-emerald-800">
              Próximo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 px-6"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Criar Igreja</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-500 min-w-24 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-800 break-all">{value}</span>
    </div>
  );
}
