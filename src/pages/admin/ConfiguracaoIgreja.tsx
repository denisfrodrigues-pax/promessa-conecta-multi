import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import {
  CultoPrincipalBlock, EscolaBiblicaBlock, PequenosGruposBlock,
  DEFAULT_CULTOS_CONFIG,
} from '@/components/CultoBlocks';
import type { CultosConfig } from '@/components/CultoBlocks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building2, Save, Loader2, Upload, X, Image as ImageIcon, Palette,
  User, Mail, Phone, Crown, MapPin, Globe, Instagram, Youtube,
  Facebook, MessageCircle, Puzzle, Clock, Plus, Trash2, Pencil, Copy, ExternalLink,
  Sparkles, Search, BookOpen,
} from 'lucide-react';

type Plano = 'teste' | 'basico' | 'completo';

const PLANO_LABELS: Record<Plano, string> = {
  teste: 'Teste (30 dias gratuitos)',
  basico: 'Básico',
  completo: 'Completo',
};
const PLANO_COLORS: Record<Plano, string> = {
  teste: 'bg-amber-100 text-amber-800',
  basico: 'bg-blue-100 text-blue-800',
  completo: 'bg-green-100 text-green-800',
};

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

interface IgrejaForm {
  // Identidade
  nome: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  foto_hero_urls: string[];
  foto_login_url: string;
  slogan: string;
  versiculo: string;
  versiculo_referencia: string;
  // Responsável
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
  // Sobre
  missao: string;
  visao: string;
  historia: string;
  // Localização
  cep: string;
  cidade: string;
  estado: string;
  endereco: string;
  no_endereco: string;
  complemento_endereco: string;
  telefone: string;
  email: string;
  google_maps_url: string;
  // Cultos config
  cultos_config: CultosConfig;
  // Redes
  instagram_url: string;
  youtube_url: string;
  facebook_url: string;
  whatsapp: string;
  site_url: string;
  // Módulos — flags
  modulo_pequenos_grupos: boolean;
  modulo_escola_biblica: boolean;
  modulo_financeiro: boolean;
  modulo_repertorio: boolean;
  modulo_auditoria: boolean;
  // Módulos — nomes
  nome_modulo_pequenos_grupos: string;
  nome_modulo_culto: string;
  nome_modulo_escola_biblica: string;
  nome_modulo_financeiro: string;
  // Somente leitura
  plano: Plano;
  ativo: boolean;
}

interface EventoSemanal {
  id: string;
  nome: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string | null;
  local: string | null;
  descricao: string | null;
  ativo: boolean;
}

const EMPTY_FORM: IgrejaForm = {
  nome: '',
  logo_url: '',
  cor_primaria: '#396939',
  cor_secundaria: '',
  foto_hero_urls: [],
  foto_login_url: '',
  slogan: '',
  versiculo: '',
  versiculo_referencia: '',
  responsavel_nome: '',
  responsavel_email: '',
  responsavel_telefone: '',
  missao: '',
  visao: '',
  historia: '',
  cep: '',
  cidade: '',
  estado: '',
  endereco: '',
  no_endereco: '',
  complemento_endereco: '',
  telefone: '',
  email: '',
  google_maps_url: '',
  cultos_config: DEFAULT_CULTOS_CONFIG,
  instagram_url: '',
  youtube_url: '',
  facebook_url: '',
  whatsapp: '',
  site_url: '',
  modulo_pequenos_grupos: true,
  modulo_escola_biblica: true,
  modulo_financeiro: true,
  modulo_repertorio: true,
  modulo_auditoria: true,
  nome_modulo_pequenos_grupos: 'Base',
  nome_modulo_culto: 'Culto',
  nome_modulo_escola_biblica: 'Escola Bíblica',
  nome_modulo_financeiro: 'Financeiro',
  plano: 'teste',
  ativo: true,
};

const EMPTY_EVENTO = {
  nome: '',
  dia_semana: 0,
  horario_inicio: '19:00',
  horario_fim: '',
  local: '',
  descricao: '',
};

const PLANO_OPTIONS: Plano[] = ['teste', 'basico', 'completo'];

export default function ConfiguracaoIgreja() {
  const { churchId: authChurchId, roles } = useAuth();
  const { slug, church } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const isSuperAdmin = roles.includes('superadmin');
  const publicUrl = `https://promessa-conecta-multi.vercel.app/i/${slug}/publico`;
  const [form, setForm] = useState<IgrejaForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogin, setUploadingLogin] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const fileLogoRef = useRef<HTMLInputElement>(null);
  const fileHeroRef = useRef<HTMLInputElement>(null);
  const fileLoginRef = useRef<HTMLInputElement>(null);

  // Eventos semanais
  const [eventos, setEventos] = useState<EventoSemanal[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventoDialog, setEventoDialog] = useState(false);
  const [editEvento, setEditEvento] = useState<EventoSemanal | null>(null);
  const [eventoForm, setEventoForm] = useState(EMPTY_EVENTO);
  const [savingEvento, setSavingEvento] = useState(false);

  useEffect(() => {
    if (churchId) {
      fetchIgreja();
      fetchEventos();
    }
  }, [churchId]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchIgreja = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('igrejas')
      .select(`
        nome, logo_url, cor_primaria, cor_secundaria,
        foto_hero_urls, foto_login_url,
        slogan, versiculo, versiculo_referencia,
        missao, visao, historia,
        responsavel_nome, responsavel_email, responsavel_telefone,
        cep, cidade, estado, endereco, no_endereco, complemento_endereco,
        telefone, email, google_maps_url,
        cultos_config,
        instagram_url, youtube_url, facebook_url, whatsapp, site_url,
        modulo_pequenos_grupos, modulo_escola_biblica, modulo_financeiro,
        modulo_repertorio, modulo_auditoria,
        nome_modulo_pequenos_grupos, nome_modulo_culto,
        nome_modulo_escola_biblica, nome_modulo_financeiro,
        plano, ativo
      `)
      .eq('id', churchId!)
      .single();

    if (!error && data) {
      setForm({
        nome: data.nome ?? '',
        logo_url: data.logo_url ?? '',
        cor_primaria: data.cor_primaria ?? '#396939',
        cor_secundaria: data.cor_secundaria ?? '',
        foto_hero_urls: Array.isArray(data.foto_hero_urls) ? data.foto_hero_urls as string[] : [],
        foto_login_url: data.foto_login_url ?? '',
        slogan: data.slogan ?? '',
        versiculo: data.versiculo ?? '',
        versiculo_referencia: data.versiculo_referencia ?? '',
        missao: (data as any).missao ?? '',
        visao:  (data as any).visao  ?? '',
        historia: (data as any).historia ?? '',
        responsavel_nome: data.responsavel_nome ?? '',
        responsavel_email: data.responsavel_email ?? '',
        responsavel_telefone: data.responsavel_telefone ?? '',
        cep:    (data as any).cep    ?? '',
        cidade: data.cidade ?? '',
        estado: data.estado ?? '',
        endereco: data.endereco ?? '',
        no_endereco:          (data as any).no_endereco          ?? '',
        complemento_endereco: (data as any).complemento_endereco ?? '',
        telefone:      (data as any).telefone      ?? '',
        email:         (data as any).email         ?? '',
        google_maps_url: (data as any).google_maps_url ?? '',
        cultos_config: (data as any).cultos_config ?? DEFAULT_CULTOS_CONFIG,
        instagram_url: data.instagram_url ?? '',
        youtube_url: data.youtube_url ?? '',
        facebook_url: data.facebook_url ?? '',
        whatsapp: data.whatsapp ?? '',
        site_url: data.site_url ?? '',
        modulo_pequenos_grupos: data.modulo_pequenos_grupos ?? true,
        modulo_escola_biblica: data.modulo_escola_biblica ?? true,
        modulo_financeiro: data.modulo_financeiro ?? true,
        modulo_repertorio: data.modulo_repertorio ?? true,
        modulo_auditoria: data.modulo_auditoria ?? true,
        nome_modulo_pequenos_grupos: data.nome_modulo_pequenos_grupos ?? 'Base',
        nome_modulo_culto: data.nome_modulo_culto ?? 'Culto',
        nome_modulo_escola_biblica: data.nome_modulo_escola_biblica ?? 'Escola Bíblica',
        nome_modulo_financeiro: data.nome_modulo_financeiro ?? 'Financeiro',
        plano: (data.plano as Plano) ?? 'teste',
        ativo: data.ativo ?? true,
      });
    }
    setLoading(false);
  };

  const fetchEventos = async () => {
    if (!churchId) return;
    setLoadingEventos(true);
    const { data } = await supabase
      .from('igreja_eventos_semanais')
      .select('*')
      .eq('church_id', churchId)
      .order('dia_semana')
      .order('horario_inicio');
    setEventos((data ?? []) as EventoSemanal[]);
    setLoadingEventos(false);
  };

  // ─── Helpers form ─────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSwitch = (name: keyof IgrejaForm, value: boolean) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setCulto = useCallback((key: keyof CultosConfig, field: string, value: unknown) =>
    setForm(p => ({
      ...p,
      cultos_config: { ...p.cultos_config, [key]: { ...p.cultos_config[key], [field]: value } },
    })), []);

  // ─── CEP lookup ──────────────────────────────────────────────────────────
  const handleCepChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    setForm(p => ({ ...p, cep: digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits }));
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
    } catch { toast.error('Erro ao buscar CEP'); }
    finally { setCepLoading(false); }
  };

  // ─── Melhore com IA ───────────────────────────────────────────────────────
  const handleMelhorarHistoria = async () => {
    if (!form.historia.trim()) { toast.error('Escreva algo primeiro para melhorar com IA'); return; }
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      toast.error('Chave de IA não configurada. Contate o administrador.');
      console.error('VITE_ANTHROPIC_API_KEY não encontrada nas variáveis de ambiente');
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Você é um assistente especializado em comunicação evangélica. Reescreva o seguinte texto de história de igreja de forma clara, inspiradora e acolhedora, mantendo as informações originais. Máximo 3 parágrafos. Texto original: ${form.historia}`,
          }],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const texto = data.content?.[0]?.text as string | undefined;
      if (texto) { setForm(p => ({ ...p, historia: texto.trim() })); toast.success('Texto melhorado com IA!'); }
    } catch (e) { console.error(e); toast.error('Erro ao chamar IA. Verifique a chave no .env'); }
    finally { setAiLoading(false); }
  };

  // ─── Upload logo ───────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !churchId) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG, WebP ou SVG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 2 MB.'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `church-logos/${churchId}.${ext}`;
      const { error: upError } = await supabase.storage.from('documentos').upload(path, file, { upsert: true, contentType: file.type });
      if (upError) throw upError;
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo enviada!');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar logo.');
    } finally {
      setUploading(false);
      if (fileLogoRef.current) fileLogoRef.current.value = '';
    }
  };

  // ─── Upload hero ───────────────────────────────────────────────────────────
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !churchId) return;
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) {
      toast.warning('Alguns arquivos foram ignorados (inválidos ou > 5 MB).');
    }
    if (!valid.length) return;

    setUploadingHero(true);
    try {
      const newUrls: string[] = [];
      for (const file of valid) {
        const ext = file.name.split('.').pop();
        const path = `church-heroes/${churchId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upError } = await supabase.storage.from('documentos').upload(path, file, { upsert: false, contentType: file.type });
        if (upError) throw upError;
        const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setForm(prev => ({ ...prev, foto_hero_urls: [...prev.foto_hero_urls, ...newUrls] }));
      toast.success(`${newUrls.length} foto(s) adicionada(s) ao hero!`);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar fotos do hero.');
    } finally {
      setUploadingHero(false);
      if (fileHeroRef.current) fileHeroRef.current.value = '';
    }
  };

  const removeHeroUrl = (idx: number) => {
    setForm(prev => ({ ...prev, foto_hero_urls: prev.foto_hero_urls.filter((_, i) => i !== idx) }));
  };

  // ─── Upload login bg ──────────────────────────────────────────────────────
  const handleLoginUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !churchId) return;
    if (!file.type.startsWith('image/')) { toast.error('Arquivo inválido.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 5 MB.'); return; }

    setUploadingLogin(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `church-login-bg/${churchId}.${ext}`;
      const { error: upError } = await supabase.storage.from('documentos').upload(path, file, { upsert: true, contentType: file.type });
      if (upError) throw upError;
      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
      setForm(prev => ({ ...prev, foto_login_url: urlData.publicUrl }));
      toast.success('Foto de fundo do login enviada!');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar foto de fundo.');
    } finally {
      setUploadingLogin(false);
      if (fileLoginRef.current) fileLoginRef.current.value = '';
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome da igreja é obrigatório.'); return; }
    if (!churchId) return;

    setSaving(true);
    const { error } = await supabase
      .from('igrejas')
      .update({
        nome: form.nome.trim(),
        logo_url: form.logo_url || null,
        cor_primaria: form.cor_primaria,
        cor_secundaria: form.cor_secundaria || null,
        foto_hero_urls: form.foto_hero_urls,
        foto_login_url: form.foto_login_url || null,
        slogan: form.slogan.trim() || null,
        versiculo: form.versiculo.trim() || null,
        versiculo_referencia: form.versiculo_referencia.trim() || null,
        responsavel_nome: form.responsavel_nome.trim() || null,
        responsavel_email: form.responsavel_email.trim() || null,
        responsavel_telefone: form.responsavel_telefone.trim() || null,
        missao: form.missao.trim() || null,
        visao:  form.visao.trim()  || null,
        historia: form.historia.trim() || null,
        cep:    form.cep.trim() || null,
        cidade: form.cidade.trim() || null,
        estado: form.estado.trim() || null,
        endereco: form.endereco.trim() || null,
        no_endereco:          form.no_endereco.trim()          || null,
        complemento_endereco: form.complemento_endereco.trim() || null,
        telefone:       form.telefone.trim()       || null,
        email:          form.email.trim()          || null,
        google_maps_url: form.google_maps_url.trim() || null,
        cultos_config: form.cultos_config,
        instagram_url: form.instagram_url.trim() || null,
        youtube_url: form.youtube_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        site_url: form.site_url.trim() || null,
        modulo_pequenos_grupos: form.modulo_pequenos_grupos,
        modulo_escola_biblica: form.modulo_escola_biblica,
        modulo_financeiro: form.modulo_financeiro,
        modulo_repertorio: form.modulo_repertorio,
        modulo_auditoria: form.modulo_auditoria,
        nome_modulo_pequenos_grupos: form.nome_modulo_pequenos_grupos.trim() || 'Base',
        nome_modulo_culto: form.nome_modulo_culto.trim() || 'Culto',
        nome_modulo_escola_biblica: form.nome_modulo_escola_biblica.trim() || 'Escola Bíblica',
        nome_modulo_financeiro: form.nome_modulo_financeiro.trim() || 'Financeiro',
        ...(isSuperAdmin ? { plano: form.plano } : {}),
      })
      .eq('id', churchId);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Configurações da igreja atualizadas!');
    }
    setSaving(false);
  };

  // ─── Eventos semanais CRUD ────────────────────────────────────────────────
  const openNovoEvento = () => {
    setEditEvento(null);
    setEventoForm(EMPTY_EVENTO);
    setEventoDialog(true);
  };

  const openEditEvento = (ev: EventoSemanal) => {
    setEditEvento(ev);
    setEventoForm({
      nome: ev.nome,
      dia_semana: ev.dia_semana,
      horario_inicio: ev.horario_inicio,
      horario_fim: ev.horario_fim ?? '',
      local: ev.local ?? '',
      descricao: ev.descricao ?? '',
    });
    setEventoDialog(true);
  };

  const handleSaveEvento = async () => {
    if (!eventoForm.nome.trim()) { toast.error('Nome do evento é obrigatório.'); return; }
    if (!eventoForm.horario_inicio) { toast.error('Horário de início é obrigatório.'); return; }
    if (!churchId) return;

    setSavingEvento(true);
    try {
      const payload = {
        church_id: churchId,
        nome: eventoForm.nome.trim(),
        dia_semana: eventoForm.dia_semana,
        horario_inicio: eventoForm.horario_inicio,
        horario_fim: eventoForm.horario_fim || null,
        local: eventoForm.local.trim() || null,
        descricao: eventoForm.descricao.trim() || null,
      };

      if (editEvento) {
        const { error } = await supabase
          .from('igreja_eventos_semanais')
          .update(payload)
          .eq('id', editEvento.id);
        if (error) throw error;
        toast.success('Evento atualizado!');
      } else {
        const { error } = await supabase
          .from('igreja_eventos_semanais')
          .insert({ ...payload, ativo: true });
        if (error) throw error;
        toast.success('Evento criado!');
      }

      setEventoDialog(false);
      fetchEventos();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar evento.');
    } finally {
      setSavingEvento(false);
    }
  };

  const handleDeleteEvento = async (id: string) => {
    if (!confirm('Excluir este evento semanal?')) return;
    const { error } = await supabase.from('igreja_eventos_semanais').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir.'); return; }
    toast.success('Evento excluído.');
    fetchEventos();
  };

  const handleToggleEvento = async (ev: EventoSemanal) => {
    const { error } = await supabase
      .from('igreja_eventos_semanais')
      .update({ ativo: !ev.ativo })
      .eq('id', ev.id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    fetchEventos();
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-promessa-700" />
            Configurações da Igreja
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie as informações, identidade visual e módulos da sua igreja.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
            : <><Save className="w-4 h-4 mr-2" />Salvar</>
          }
        </Button>
      </div>

      {/* 2.2 — Card de link público */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-800 mb-1">Página pública da sua igreja</p>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-emerald-700 hover:underline break-all">{publicUrl}</a>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs"
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                <Copy className="h-3.5 w-3.5 mr-1" />Copiar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />Abrir
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas */}
      <Tabs defaultValue="visual">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="visual">🎨 Visual</TabsTrigger>
          <TabsTrigger value="sobre">📖 Sobre</TabsTrigger>
          <TabsTrigger value="localizacao">📍 Localização</TabsTrigger>
          <TabsTrigger value="modulos">🧩 Módulos</TabsTrigger>
          <TabsTrigger value="cultos">⛪ Cultos</TabsTrigger>
        </TabsList>

        {/* ─── Aba Visual ─────────────────────────────────────────────────── */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Identidade */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identidade da Igreja</CardTitle>
                  <CardDescription>Nome público, slogan e versículo de identidade</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Igreja *</Label>
                    <Input id="nome" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Igreja da Promessa – Centro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slogan">Slogan / Tagline</Label>
                    <Input id="slogan" name="slogan" value={form.slogan} onChange={handleChange} placeholder="Ex: Uma igreja para o seu coração" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="versiculo">Versículo Bíblico</Label>
                      <Textarea id="versiculo" name="versiculo" value={form.versiculo} onChange={handleChange} placeholder="Ex: Porque Deus amou o mundo..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="versiculo_referencia">Referência</Label>
                      <Input id="versiculo_referencia" name="versiculo_referencia" value={form.versiculo_referencia} onChange={handleChange} placeholder="Ex: João 3:16" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logo</CardTitle>
                  <CardDescription>PNG, JPEG, WebP ou SVG — máx. 2 MB</CardDescription>
                </CardHeader>
                <CardContent>
                  {form.logo_url ? (
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                      <img src={form.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{form.logo_url}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setForm(p => ({ ...p, logo_url: '' }))}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-promessa-400 transition-colors"
                      onClick={() => fileLogoRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para enviar a logo</p>
                    </div>
                  )}
                  <input ref={fileLogoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                  {uploading && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><Loader2 className="w-3 h-3 animate-spin" />Enviando...</p>}
                </CardContent>
              </Card>

              {/* Cores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />Cores</CardTitle>
                  <CardDescription>Cores primária e secundária do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" name="cor_primaria" value={form.cor_primaria} onChange={handleChange} className="h-10 w-16 rounded cursor-pointer border border-input p-1" />
                      <Input name="cor_primaria" value={form.cor_primaria} onChange={handleChange} placeholder="#396939" className="w-32 font-mono text-sm" maxLength={7} />
                      <span className="text-xs text-muted-foreground">Botões e destaques</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" name="cor_secundaria" value={form.cor_secundaria || '#ffffff'} onChange={handleChange} className="h-10 w-16 rounded cursor-pointer border border-input p-1" />
                      <Input name="cor_secundaria" value={form.cor_secundaria} onChange={handleChange} placeholder="#ffffff" className="w-32 font-mono text-sm" maxLength={7} />
                      <span className="text-xs text-muted-foreground">Acentos e gradientes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fotos Hero */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fotos do Hero / Slideshow</CardTitle>
                  <CardDescription>Imagens exibidas no site público — máx. 5 MB por foto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.foto_hero_urls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.foto_hero_urls.map((url, idx) => (
                        <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border">
                          <img src={url} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeHeroUrl(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => fileHeroRef.current?.click()} disabled={uploadingHero}>
                    {uploadingHero ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Adicionar fotos</>}
                  </Button>
                  <input ref={fileHeroRef} type="file" accept="image/*" multiple className="hidden" onChange={handleHeroUpload} disabled={uploadingHero} />
                </CardContent>
              </Card>

              {/* Foto Login */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fundo da Tela de Login</CardTitle>
                  <CardDescription>Imagem de fundo exibida na tela de login — máx. 5 MB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.foto_login_url ? (
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                      <img src={form.foto_login_url} alt="Fundo login" className="h-16 w-auto object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{form.foto_login_url}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setForm(p => ({ ...p, foto_login_url: '' }))}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => fileLoginRef.current?.click()} disabled={uploadingLogin}>
                      {uploadingLogin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Enviar imagem de fundo</>}
                    </Button>
                  )}
                  <input ref={fileLoginRef} type="file" accept="image/*" className="hidden" onChange={handleLoginUpload} disabled={uploadingLogin} />
                </CardContent>
              </Card>
            </div>

            {/* Coluna lateral — Plano e Status */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />Plano Atual
                  </CardTitle>
                  {!isSuperAdmin && <CardDescription>Para alterar o plano, entre em contato com a equipe Promessa Conecta.</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 2.3 — superadmin pode editar plano */}
                  {isSuperAdmin ? (
                    <Select
                      value={form.plano}
                      onValueChange={v => setForm(p => ({ ...p, plano: v as Plano }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANO_OPTIONS.map(p => (
                          <SelectItem key={p} value={p}>{PLANO_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`text-sm px-3 py-1 ${PLANO_COLORS[form.plano]}`}>{PLANO_LABELS[form.plano]}</Badge>
                  )}
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>✅ Dashboard e relatórios</p>
                    <p>✅ Gestão de membros e bases</p>
                    <p>✅ Escalas e ministérios</p>
                    {form.plano !== 'teste' && <p>✅ Financeiro completo</p>}
                    {form.plano === 'completo' && <p>✅ Módulos avançados</p>}
                    {form.plano === 'teste' && (
                      <p className="text-amber-600 font-medium pt-1">⚠️ Período de avaliação.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent>
                  <Badge variant="outline" className={form.ativo ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                    {form.ativo ? '✅ Ativa' : '❌ Inativa'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">Para alterar o status, entre em contato com o suporte.</p>
                </CardContent>
              </Card>

              {/* Responsável */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_nome" className="flex items-center gap-2"><User className="w-4 h-4" />Nome</Label>
                    <Input id="responsavel_nome" name="responsavel_nome" value={form.responsavel_nome} onChange={handleChange} placeholder="Nome do pastor/responsável" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_email" className="flex items-center gap-2"><Mail className="w-4 h-4" />E-mail</Label>
                    <Input id="responsavel_email" name="responsavel_email" type="email" value={form.responsavel_email} onChange={handleChange} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_telefone" className="flex items-center gap-2"><Phone className="w-4 h-4" />Telefone</Label>
                    <Input id="responsavel_telefone" name="responsavel_telefone" value={form.responsavel_telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Aba Sobre ──────────────────────────────────────────────────── */}
        <TabsContent value="sobre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Sobre a Igreja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="missao">Missão</Label>
                <Textarea id="missao" name="missao" value={form.missao} onChange={handleChange}
                  placeholder="Ex: Existimos para Amar e Servir a Deus e as pessoas…" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visao">Visão</Label>
                <Textarea id="visao" name="visao" value={form.visao} onChange={handleChange}
                  placeholder="Ex: Ser uma igreja consolidada, saudável e relevante…" rows={3} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="historia">História Resumida</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleMelhorarHistoria} disabled={aiLoading}
                    className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-7 px-2 gap-1">
                    {aiLoading
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Melhorando…</>
                      : <><Sparkles className="h-3 w-3" />✨ Melhore com IA</>}
                  </Button>
                </div>
                <Textarea id="historia" name="historia" value={form.historia} onChange={handleChange}
                  placeholder="Conte brevemente a história da igreja…" rows={5} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
            </Button>
          </div>
        </TabsContent>

        {/* ─── Aba Localização ─────────────────────────────────────────────── */}
        <TabsContent value="localizacao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CEP com busca automática */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Search className="h-3.5 w-3.5" />CEP
                    {cepLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-1" />}
                  </Label>
                  <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" maxLength={9} />
                  <p className="text-xs text-muted-foreground">Preencha o CEP para buscar o endereço automaticamente</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" value={form.cidade} onChange={handleChange} placeholder="São Paulo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado (UF)</Label>
                    <Input id="estado" name="estado" value={form.estado} onChange={handleChange} placeholder="SP" maxLength={2} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Logradouro / Rua</Label>
                  <Input id="endereco" name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua Exemplo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="no_endereco">Número</Label>
                    <Input id="no_endereco" name="no_endereco" value={form.no_endereco} onChange={handleChange} placeholder="123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento_endereco">Complemento</Label>
                    <Input id="complemento_endereco" name="complemento_endereco" value={form.complemento_endereco} onChange={handleChange} placeholder="Sala 2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />Telefone</Label>
                    <Input id="telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />E-mail</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@igreja.com.br" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_maps_url" className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Google Maps URL</Label>
                  <Input id="google_maps_url" name="google_maps_url" value={form.google_maps_url} onChange={handleChange} placeholder="https://maps.google.com/..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" />Redes Sociais e Site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="flex items-center gap-2"><Instagram className="w-4 h-4" />Instagram</Label>
                  <Input id="instagram_url" name="instagram_url" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/suaigreja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url" className="flex items-center gap-2"><Youtube className="w-4 h-4" />YouTube</Label>
                  <Input id="youtube_url" name="youtube_url" value={form.youtube_url} onChange={handleChange} placeholder="https://youtube.com/@suaigreja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_url" className="flex items-center gap-2"><Facebook className="w-4 h-4" />Facebook</Label>
                  <Input id="facebook_url" name="facebook_url" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/suaigreja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="5511999999999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_url" className="flex items-center gap-2"><Globe className="w-4 h-4" />Site</Label>
                  <Input id="site_url" name="site_url" value={form.site_url} onChange={handleChange} placeholder="https://suaigreja.com.br" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Aba Módulos ─────────────────────────────────────────────────── */}
        <TabsContent value="modulos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Puzzle className="w-4 h-4" />Módulos do Sistema</CardTitle>
              <CardDescription>
                Habilite ou desabilite módulos e personalize seus nomes no menu.
                Módulos desabilitados ficam ocultos no menu mas os dados são preservados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {/* Pequenos Grupos */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.modulo_pequenos_grupos} onCheckedChange={v => handleSwitch('modulo_pequenos_grupos', v)} id="mod_pg" />
                    <Label htmlFor="mod_pg" className="font-medium">Pequenos Grupos / Bases</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Nome no menu</Label>
                    <Input name="nome_modulo_pequenos_grupos" value={form.nome_modulo_pequenos_grupos} onChange={handleChange} placeholder="Base" className="max-w-xs" disabled={!form.modulo_pequenos_grupos} />
                  </div>
                </div>

                {/* Culto */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked id="mod_culto" disabled />
                    <Label htmlFor="mod_culto" className="font-medium">Culto / Celebração</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Nome no menu</Label>
                    <Input name="nome_modulo_culto" value={form.nome_modulo_culto} onChange={handleChange} placeholder="Culto" className="max-w-xs" />
                  </div>
                </div>

                {/* Escola Bíblica */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.modulo_escola_biblica} onCheckedChange={v => handleSwitch('modulo_escola_biblica', v)} id="mod_eb" />
                    <Label htmlFor="mod_eb" className="font-medium">Escola Bíblica</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Nome no menu</Label>
                    <Input name="nome_modulo_escola_biblica" value={form.nome_modulo_escola_biblica} onChange={handleChange} placeholder="Escola Bíblica" className="max-w-xs" disabled={!form.modulo_escola_biblica} />
                  </div>
                </div>

                {/* Financeiro */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.modulo_financeiro} onCheckedChange={v => handleSwitch('modulo_financeiro', v)} id="mod_fin" />
                    <Label htmlFor="mod_fin" className="font-medium">Financeiro</Label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Nome no menu</Label>
                    <Input name="nome_modulo_financeiro" value={form.nome_modulo_financeiro} onChange={handleChange} placeholder="Financeiro" className="max-w-xs" disabled={!form.modulo_financeiro} />
                  </div>
                </div>

                {/* Repertório */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.modulo_repertorio} onCheckedChange={v => handleSwitch('modulo_repertorio', v)} id="mod_rep" />
                    <Label htmlFor="mod_rep" className="font-medium">Repertório Musical</Label>
                  </div>
                  <div className="sm:col-span-2 text-sm text-muted-foreground">
                    Módulo de letras e cifras para ministério de música
                  </div>
                </div>

                {/* Auditoria */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.modulo_auditoria} onCheckedChange={v => handleSwitch('modulo_auditoria', v)} id="mod_aud" />
                    <Label htmlFor="mod_aud" className="font-medium">Auditoria</Label>
                  </div>
                  <div className="sm:col-span-2 text-sm text-muted-foreground">
                    Log de alterações e histórico de ações administrativas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar Módulos</>}
            </Button>
          </div>
        </TabsContent>

        {/* ─── Aba Cultos ─────────────────────────────────────────────────── */}
        <TabsContent value="cultos" className="space-y-6">
          {/* Configuração rápida de cultos (cultos_config) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Configuração Rápida de Cultos</CardTitle>
              <CardDescription>Configure os encontros principais exibidos no site público e na área do membro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CultoPrincipalBlock
                config={form.cultos_config.culto_principal}
                onChange={(field, value) => setCulto('culto_principal', field, value)}
              />
              <EscolaBiblicaBlock
                config={form.cultos_config.escola_biblica}
                onChange={(field, value) => setCulto('escola_biblica', field, value)}
              />
              <PequenosGruposBlock
                config={form.cultos_config.pequenos_grupos}
                onChange={(field, value) => setCulto('pequenos_grupos', field, value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Eventos Semanais Recorrentes</CardTitle>
                  <CardDescription>Cultos, EBD e outros encontros que se repetem toda semana</CardDescription>
                </div>
                <Button size="sm" onClick={openNovoEvento}>
                  <Plus className="w-4 h-4 mr-2" />Adicionar Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEventos ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : eventos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum evento semanal cadastrado ainda.</p>
                  <p className="text-xs mt-1">Clique em "Adicionar Evento" para começar.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {eventos.map(ev => (
                    <div key={ev.id} className="py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{ev.nome}</p>
                          {!ev.ativo && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Inativo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {DIAS_SEMANA[ev.dia_semana]} às {ev.horario_inicio.slice(0, 5)}
                          {ev.horario_fim && ` – ${ev.horario_fim.slice(0, 5)}`}
                          {ev.local && ` • ${ev.local}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={ev.ativo}
                          onCheckedChange={() => handleToggleEvento(ev)}
                          className="scale-90"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEvento(ev)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDeleteEvento(ev.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Dialog Evento ──────────────────────────────────────────────────── */}
      <Dialog open={eventoDialog} onOpenChange={setEventoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editEvento ? 'Editar Evento' : 'Novo Evento Semanal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ev_nome">Nome do Evento *</Label>
              <Input id="ev_nome" value={eventoForm.nome} onChange={e => setEventoForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Culto de Celebração" />
            </div>
            <div className="space-y-2">
              <Label>Dia da Semana *</Label>
              <Select value={String(eventoForm.dia_semana)} onValueChange={v => setEventoForm(p => ({ ...p, dia_semana: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ev_inicio">Horário Início *</Label>
                <Input id="ev_inicio" type="time" value={eventoForm.horario_inicio} onChange={e => setEventoForm(p => ({ ...p, horario_inicio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev_fim">Horário Fim</Label>
                <Input id="ev_fim" type="time" value={eventoForm.horario_fim} onChange={e => setEventoForm(p => ({ ...p, horario_fim: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev_local">Local</Label>
              <Input id="ev_local" value={eventoForm.local} onChange={e => setEventoForm(p => ({ ...p, local: e.target.value }))} placeholder="Ex: Templo Principal, Salão..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev_desc">Descrição</Label>
              <Textarea id="ev_desc" value={eventoForm.descricao} onChange={e => setEventoForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes sobre o evento..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventoDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvento} disabled={savingEvento}>
              {savingEvento ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
