import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Pencil,
  LogOut,
  Bell,
  BellOff,
  Camera,
  Loader2,
  Lock,
  ChevronRight,
  CreditCard,
  MapPin,
  GraduationCap,
  Briefcase,
  X,
  Check,
  Search,
  Users,
  Globe,
  Droplets,
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ChurchLogo } from '@/components/ChurchLogo';
import { cn } from '@/lib/utils';

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatPhone(v: string) {
  const n = v.replace(/\D/g, '');
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return n
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

function formatCEP(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

function formatCPF(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function formatCPFMasked(cpf: string) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11) return cpf;
  return `***.${n.slice(3, 6)}.${n.slice(6, 9)}-**`;
}

function validateCPF(cpf: string): boolean {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +n[i] * (10 - i);
  let d1 = (s * 10) % 11; if (d1 >= 10) d1 = 0;
  if (d1 !== +n[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +n[i] * (11 - i);
  let d2 = (s * 10) % 11; if (d2 >= 10) d2 = 0;
  return d2 === +n[10];
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return y && m && day ? `${day}/${m}/${y}` : d;
}

// ─── Static lists ─────────────────────────────────────────────────────────────

const GRAUS = [
  { v: 'fundamental_incompleto', l: 'Fundamental Incompleto' },
  { v: 'fundamental_completo', l: 'Fundamental Completo' },
  { v: 'medio_incompleto', l: 'Médio Incompleto' },
  { v: 'medio_completo', l: 'Médio Completo' },
  { v: 'superior_incompleto', l: 'Superior Incompleto' },
  { v: 'superior_completo', l: 'Superior Completo' },
  { v: 'pos_graduacao', l: 'Pós-Graduação' },
  { v: 'mestrado', l: 'Mestrado' },
  { v: 'doutorado', l: 'Doutorado' },
];

const ESTADOS_CIVIS = [
  { v: 'solteiro', l: 'Solteiro(a)' },
  { v: 'casado', l: 'Casado(a)' },
  { v: 'divorciado', l: 'Divorciado(a)' },
  { v: 'viuvo', l: 'Viúvo(a)' },
  { v: 'separado', l: 'Separado(a)' },
  { v: 'uniao_estavel', l: 'União Estável' },
];

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

const ORIGENS = [
  { v: 'promessista_nato', l: 'Promessista Nato' },
  { v: 'transferencia_denominacao', l: 'Transferência de outra denominação' },
  { v: 'transferencia_iap', l: 'Transferência de outra IAP' },
  { v: 'neopentecostal', l: 'Igreja Neopentecostal' },
  { v: 'reformada', l: 'Igreja Reformada' },
  { v: 'pentecostal', l: 'Pentecostal' },
  { v: 'sabatista', l: 'Sabatista' },
  { v: 'catolica', l: 'Igreja Católica' },
  { v: 'outras_religioes', l: 'Outras religiões' },
  { v: 'sem_religiao', l: 'Sem religião anterior' },
];

const SITUACAO_MIN_LABELS: Record<string, string> = {
  ativo: 'Membro Ativo',
  em_disciplina: 'Membro em Disciplina',
  frequentador: 'Frequentador',
};

const ORDENACAO_LABELS: Record<string, string> = {
  nenhum: 'Nenhum',
  pastor_parcial: 'Pastor Tempo Parcial',
  pastor_integral: 'Pastor Tempo Integral',
  missionaria_parcial: 'Missionária Tempo Parcial',
  missionaria_integral: 'Missionária Tempo Integral',
  presbitero: 'Presbítero',
  diacono: 'Diácono(isa)',
  jubilado: 'Jubilado(a)',
};

const ORIGEM_LABELS: Record<string, string> = Object.fromEntries(
  ORIGENS.map((o) => [o.v, o.l])
);

// ─── Small helpers ────────────────────────────────────────────────────────────

function labelFor(list: { v: string; l: string }[], val: string) {
  return list.find((i) => i.v === val)?.l ?? val;
}

// ─── View-row component ───────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  last?: boolean;
}

function InfoRow({ icon: Icon, label, value, last }: InfoRowProps) {
  const isEmpty = !value || value === '—';
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3.5', !last && 'border-b border-gray-100')}>
      <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#1a5c38]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-0.5">
          {label}
        </p>
        <p className={cn('text-[14px] break-words', isEmpty ? 'text-gray-300 italic' : 'text-gray-800')}>
          {isEmpty ? 'Não informado' : value}
        </p>
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, editing, saving, onEdit, onSave, onCancel, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <span className="text-[15px] font-semibold text-gray-800">{title}</span>
        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a5c38] active:opacity-70"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex items-center gap-1 text-[13px] text-gray-400 active:opacity-70"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#1a5c38] px-3 py-1.5 rounded-full active:opacity-80"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Field component (edit mode) ─────────────────────────────────────────────

interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-[12px] text-gray-500 font-medium">{label}</Label>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProfileState {
  nome: string;
  telefone: string;
  data_nascimento: string;
  sexo: string;
  estado_civil: string;
  naturalidade: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  grau_instrucao: string;
  formacao: string;
  profissao: string;
  cpf: string;
  nacionalidade: string;
  genero: string;
  nome_mae: string;
  nome_pai: string;
  pais: string;
  curso: string;
}

const EMPTY_PROFILE: ProfileState = {
  nome: '', telefone: '', data_nascimento: '', sexo: '', estado_civil: '',
  naturalidade: '', cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', uf: '', grau_instrucao: '', formacao: '',
  profissao: '', cpf: '', nacionalidade: '', genero: '',
  nome_mae: '', nome_pai: '', pais: 'Brasil', curso: '',
};

interface MinisterialData {
  situacao_ministerial: string | null;
  data_situacao_inicio: string | null;
  situacao_observacao: string | null;
  ordenacao_funcao: string | null;
  data_ordenacao_inicio: string | null;
  data_ordenacao_fim: string | null;
  origem_membro: string | null;
  igreja_anterior: string | null;
  data_recebimento: string | null;
  data_batismo_agua: string | null;
  pastor_oficiante: string | null;
  local_batismo: string | null;
  batismo_espirito_santo: boolean | null;
  data_batismo_espirito: string | null;
}

export default function MemberPerfil() {
  const { profile, signOut, user } = useAuth();
  const [data, setData] = useState<ProfileState>(EMPTY_PROFILE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('pessoal');
  const [paiMaePromessista, setPaiMaePromessista] = useState(false);
  const [membroData, setMembroData] = useState<MinisterialData | null>(null);

  // draft state per section
  const [draftPersonal, setDraftPersonal] = useState<Partial<ProfileState>>({});
  const [draftAddress, setDraftAddress] = useState<Partial<ProfileState>>({});
  const [draftFormation, setDraftFormation] = useState<Partial<ProfileState>>({});
  const [draftBatismo, setDraftBatismo] = useState<Partial<MinisterialData>>({});

  // editing flags
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingFormation, setEditingFormation] = useState(false);
  const [editingBatismo, setEditingBatismo] = useState(false);

  // editing flags — família
  const [editingFamilia, setEditingFamilia] = useState(false);
  const [savingFamilia, setSavingFamilia] = useState(false);
  const [draftFamilia, setDraftFamilia] = useState({ nome_mae: '', nome_pai: '', pai_mae_promessista: false });

  // saving flags
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingFormation, setSavingFormation] = useState(false);
  const [savingBatismo, setSavingBatismo] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // config
  const [membrosEditamPerfil, setMembrosEditamPerfil] = useState(true);
  const [notificacoesPushAtivas, setNotificacoesPushAtivas] = useState(false);

  const { isSupported: pushSupported, isSubscribed: pushEnabled,
    isLoading: pushLoading, permission: pushPermission, toggleSubscription } =
    usePushNotifications();

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id || !profile?.id) return;

    supabase
      .from('configuracoes_instituicao')
      .select('membros_editam_perfil, notificacoes_push')
      .single()
      .then(({ data: cfg }) => {
        if (!cfg) return;
        const c = cfg as any;
        setMembrosEditamPerfil(c.membros_editam_perfil ?? true);
        setNotificacoesPushAtivas(c.notificacoes_push ?? false);
      });

    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (!p) return;
        const d = p as any;
        setData((prev) => ({
          ...prev,
          nome: d.nome || '',
          telefone: d.telefone ? formatPhone(d.telefone) : '',
          data_nascimento: d.data_nascimento || '',
          sexo: d.sexo || '',
          estado_civil: d.estado_civil || '',
          naturalidade: d.naturalidade || '',
          cep: d.cep ? formatCEP(d.cep) : '',
          logradouro: d.logradouro || '',
          numero: d.numero || '',
          complemento: d.complemento || '',
          bairro: d.bairro || '',
          cidade: d.cidade || '',
          uf: d.uf || '',
          grau_instrucao: d.grau_instrucao || '',
          formacao: d.formacao || '',
          profissao: d.profissao || '',
          cpf: d.cpf || '',
        }));
        if (d.foto_url) setAvatarUrl(d.foto_url);
      });

    supabase
      .from('membros')
      .select(`
        nacionalidade, genero, rua, estado, nome_mae, nome_pai, pai_mae_promessista, pais, curso,
        situacao_ministerial, data_situacao_inicio, situacao_observacao,
        ordenacao_funcao, data_ordenacao_inicio, data_ordenacao_fim,
        origem_membro, igreja_anterior, data_recebimento,
        data_batismo_agua, pastor_oficiante, local_batismo,
        batismo_espirito_santo, data_batismo_espirito
      `)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data: m }) => {
        if (!m) return;
        const mb = m as any;
        setData((prev) => ({
          ...prev,
          nacionalidade: mb.nacionalidade || '',
          genero: mb.genero || '',
          logradouro: prev.logradouro || mb.rua || '',
          uf: prev.uf || mb.estado || '',
          nome_mae: mb.nome_mae || '',
          nome_pai: mb.nome_pai || '',
          pais: mb.pais || 'Brasil',
          curso: mb.curso || '',
        }));
        setPaiMaePromessista(!!mb.pai_mae_promessista);
        setMembroData({
          situacao_ministerial: mb.situacao_ministerial || null,
          data_situacao_inicio: mb.data_situacao_inicio || null,
          situacao_observacao: mb.situacao_observacao || null,
          ordenacao_funcao: mb.ordenacao_funcao || null,
          data_ordenacao_inicio: mb.data_ordenacao_inicio || null,
          data_ordenacao_fim: mb.data_ordenacao_fim || null,
          origem_membro: mb.origem_membro || null,
          igreja_anterior: mb.igreja_anterior || null,
          data_recebimento: mb.data_recebimento || null,
          data_batismo_agua: mb.data_batismo_agua || null,
          pastor_oficiante: mb.pastor_oficiante || null,
          local_batismo: mb.local_batismo || null,
          batismo_espirito_santo: mb.batismo_espirito_santo ?? null,
          data_batismo_espirito: mb.data_batismo_espirito || null,
        });
      });
  }, [user?.id, profile?.id]);

  // ── Avatar ───────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Use apenas JPG ou PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: upProfile } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', profile?.id);
      if (upProfile) throw upProfile;
      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao atualizar foto');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── CEP lookup ────────────────────────────────────────────────────────────

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (json.erro) { toast.error('CEP não encontrado'); return; }
      setDraftAddress((prev) => ({
        ...prev,
        logradouro: json.logradouro || '',
        bairro: json.bairro || '',
        cidade: json.localidade || '',
        uf: json.uf || '',
        complemento: json.complemento || prev.complemento || '',
      }));
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function saveProfileFields(fields: Record<string, string | boolean | null>) {
    const { error } = await supabase
      .from('profiles')
      .update(fields as any)
      .eq('id', profile!.id);
    if (error) throw error;
  }

  async function saveMembrosFields(fields: Record<string, string | boolean | null>) {
    await supabase
      .from('membros')
      .update(fields as any)
      .eq('user_id', profile!.id);
  }

  // ── Section saves ─────────────────────────────────────────────────────────

  const savePersonal = async () => {
    if (!profile) return;
    const d = draftPersonal;
    if (d.nome !== undefined && !String(d.nome).trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (d.cpf !== undefined) {
      const cleanCpf = String(d.cpf).replace(/\D/g, '');
      if (cleanCpf && !validateCPF(cleanCpf)) {
        toast.error('CPF inválido');
        return;
      }
    }
    setSavingPersonal(true);
    try {
      const cpfClean = d.cpf !== undefined
        ? (String(d.cpf).replace(/\D/g, '') || null)
        : (data.cpf?.replace(/\D/g, '') || null);
      await saveProfileFields({
        nome: d.nome ?? data.nome,
        telefone: d.telefone ? String(d.telefone).replace(/\D/g, '') : (data.telefone?.replace(/\D/g, '') || null),
        data_nascimento: d.data_nascimento ?? (data.data_nascimento || null),
        sexo: d.sexo ?? (data.sexo || null),
        estado_civil: d.estado_civil ?? (data.estado_civil || null),
        naturalidade: d.naturalidade ?? (data.naturalidade || null),
        cpf: cpfClean,
      });
      await saveMembrosFields({
        nome: d.nome ?? data.nome,
        telefone: d.telefone ? String(d.telefone).replace(/\D/g, '') : (data.telefone?.replace(/\D/g, '') || null),
        data_nascimento: d.data_nascimento ?? (data.data_nascimento || null),
        genero: d.sexo ?? (data.sexo || null),
        estado_civil: d.estado_civil ?? (data.estado_civil || null),
        naturalidade: d.naturalidade ?? (data.naturalidade || null),
        nacionalidade: d.nacionalidade ?? (data.nacionalidade || null),
        cpf: cpfClean,
      });
      setData((prev) => ({ ...prev, ...d }));
      setEditingPersonal(false);
      setDraftPersonal({});
      toast.success('Dados pessoais salvos!');
    } catch {
      toast.error('Erro ao salvar dados pessoais');
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveAddress = async () => {
    if (!profile) return;
    const d = draftAddress;
    setSavingAddress(true);
    try {
      await saveProfileFields({
        cep: d.cep ? String(d.cep).replace(/\D/g, '') : (data.cep?.replace(/\D/g, '') || null),
        logradouro: d.logradouro ?? (data.logradouro || null),
        numero: d.numero ?? (data.numero || null),
        complemento: d.complemento ?? (data.complemento || null),
        bairro: d.bairro ?? (data.bairro || null),
        cidade: d.cidade ?? (data.cidade || null),
        uf: d.uf ?? (data.uf || null),
      });
      await saveMembrosFields({
        cep: d.cep ? String(d.cep).replace(/\D/g, '') : (data.cep?.replace(/\D/g, '') || null),
        rua: d.logradouro ?? (data.logradouro || null),
        numero: d.numero ?? (data.numero || null),
        complemento: d.complemento ?? (data.complemento || null),
        bairro: d.bairro ?? (data.bairro || null),
        cidade: d.cidade ?? (data.cidade || null),
        estado: d.uf ?? (data.uf || null),
        pais: d.pais ?? (data.pais || null),
      });
      setData((prev) => ({ ...prev, ...d }));
      setEditingAddress(false);
      setDraftAddress({});
      toast.success('Endereço salvo!');
    } catch {
      toast.error('Erro ao salvar endereço');
    } finally {
      setSavingAddress(false);
    }
  };

  const saveFormation = async () => {
    if (!profile) return;
    const d = draftFormation;
    setSavingFormation(true);
    try {
      await saveProfileFields({
        grau_instrucao: d.grau_instrucao ?? (data.grau_instrucao || null),
        formacao: d.formacao ?? (data.formacao || null),
        profissao: d.profissao ?? (data.profissao || null),
      });
      await saveMembrosFields({
        grau_instrucao: d.grau_instrucao ?? (data.grau_instrucao || null),
        profissao: d.profissao ?? (data.profissao || null),
        curso: d.curso ?? (data.curso || null),
      });
      setData((prev) => ({ ...prev, ...d }));
      setEditingFormation(false);
      setDraftFormation({});
      toast.success('Formação salva!');
    } catch {
      toast.error('Erro ao salvar formação');
    } finally {
      setSavingFormation(false);
    }
  };

  const saveBatismo = async () => {
    if (!profile) return;
    const d = draftBatismo;
    setSavingBatismo(true);
    try {
      const fields = {
        origem_membro: d.origem_membro !== undefined ? (d.origem_membro || null) : (membroData?.origem_membro ?? null),
        igreja_anterior: d.igreja_anterior !== undefined ? (d.igreja_anterior || null) : (membroData?.igreja_anterior ?? null),
        data_recebimento: d.data_recebimento !== undefined ? (d.data_recebimento || null) : (membroData?.data_recebimento ?? null),
        local_batismo: d.local_batismo !== undefined ? (d.local_batismo || null) : (membroData?.local_batismo ?? null),
        pastor_oficiante: d.pastor_oficiante !== undefined ? (d.pastor_oficiante || null) : (membroData?.pastor_oficiante ?? null),
        data_batismo_agua: d.data_batismo_agua !== undefined ? (d.data_batismo_agua || null) : (membroData?.data_batismo_agua ?? null),
        batismo_espirito_santo: d.batismo_espirito_santo !== undefined ? d.batismo_espirito_santo : (membroData?.batismo_espirito_santo ?? null),
        data_batismo_espirito: d.data_batismo_espirito !== undefined ? (d.data_batismo_espirito || null) : (membroData?.data_batismo_espirito ?? null),
      };
      const { error } = await supabase
        .from('membros')
        .update(fields as any)
        .eq('user_id', profile.id);
      if (error) throw error;
      setMembroData((prev) => prev ? { ...prev, ...fields } : prev);
      setEditingBatismo(false);
      setDraftBatismo({});
      toast.success('Dados de batismo salvos!');
    } catch {
      toast.error('Erro ao salvar dados de batismo');
    } finally {
      setSavingBatismo(false);
    }
  };

  const saveFamilia = async () => {
    if (!profile) return;
    setSavingFamilia(true);
    try {
      const { error } = await supabase
        .from('membros')
        .update({
          nome_mae: draftFamilia.nome_mae.trim() || null,
          nome_pai: draftFamilia.nome_pai.trim() || null,
          pai_mae_promessista: draftFamilia.pai_mae_promessista,
        })
        .eq('user_id', profile.id);
      if (error) throw error;
      setData((prev) => ({ ...prev, nome_mae: draftFamilia.nome_mae, nome_pai: draftFamilia.nome_pai }));
      setPaiMaePromessista(draftFamilia.pai_mae_promessista);
      setEditingFamilia(false);
      toast.success('Dados de família salvos!');
    } catch {
      toast.error('Erro ao salvar dados de família');
    } finally {
      setSavingFamilia(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile.email,
        { redirectTo: `${window.location.origin}/app/perfil` }
      );
      if (error) throw error;
      toast.success('Link de redefinição enviado para seu e-mail');
    } catch {
      toast.error('Erro ao enviar link de redefinição');
    }
  };

  // ── Draft helpers ─────────────────────────────────────────────────────────

  const pd = (key: keyof ProfileState, val: string) =>
    setDraftPersonal((p) => ({ ...p, [key]: val }));
  const ad = (key: keyof ProfileState, val: string) =>
    setDraftAddress((p) => ({ ...p, [key]: val }));
  const fd = (key: keyof ProfileState, val: string) =>
    setDraftFormation((p) => ({ ...p, [key]: val }));
  const bd = (key: keyof MinisterialData, val: string | boolean | null) =>
    setDraftBatismo((p) => ({ ...p, [key]: val }));

  // merged view values (draft takes priority when editing)
  const pv = (key: keyof ProfileState) =>
    String(editingPersonal ? (draftPersonal[key] ?? data[key]) : data[key]) || '';
  const av = (key: keyof ProfileState) =>
    String(editingAddress ? (draftAddress[key] ?? data[key]) : data[key]) || '';
  const fv = (key: keyof ProfileState) =>
    String(editingFormation ? (draftFormation[key] ?? data[key]) : data[key]) || '';
  const bv = (key: keyof MinisterialData): string => {
    const draft = draftBatismo[key];
    const stored = membroData?.[key];
    if (editingBatismo && draft !== undefined) return String(draft ?? '');
    return String(stored ?? '');
  };
  const bvBool = (key: keyof MinisterialData): boolean | null => {
    if (editingBatismo && draftBatismo[key] !== undefined) return draftBatismo[key] as boolean | null;
    return (membroData?.[key] as boolean | null) ?? null;
  };

  const displayName = data.nome || profile?.nome || '';
  const avatarSrc = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{ background: 'linear-gradient(160deg, #1a5c38 0%, #2d8a57 100%)', minHeight: 180, paddingBottom: 52 }}
      >
        <div className="absolute top-4 left-4 opacity-80">
          <ChurchLogo size={26} maxWidth={72} />
        </div>
        <div className="flex flex-col items-center pt-12 px-8 text-center">
          <h1 className="text-white font-bold text-[22px] leading-tight line-clamp-2">{displayName}</h1>
          <p className="text-white/70 text-[13px] mt-1 truncate max-w-[260px]">{profile?.email}</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-[90px] h-[90px] rounded-full overflow-hidden border-[3px] border-white shadow-xl bg-gradient-to-br from-[#2d8a57] to-[#1a5c38] focus:outline-none"
            aria-label="Alterar foto"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-[34px] font-bold text-white">
                {displayName.charAt(0).toUpperCase() || '?'}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-2">
              {uploadingAvatar
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Camera className="w-4 h-4 text-white" />}
            </div>
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="pt-14 pb-28 px-4 max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── Tab List ────────────────────────────────────────────────── */}
          <TabsList className="flex w-full overflow-x-auto bg-white shadow-sm rounded-2xl mb-3 h-auto p-1 gap-0.5">
            {[
              { value: 'pessoal', label: 'Pessoal' },
              { value: 'endereco', label: 'Endereço' },
              { value: 'formacao', label: 'Formação' },
              { value: 'ministerial', label: 'Ministerial' },
              { value: 'batismo', label: 'Batismo' },
              { value: 'conta', label: 'Conta' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 text-[11px] py-2 px-1 whitespace-nowrap min-w-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab: Pessoal ──────────────────────────────────────────────── */}
          <TabsContent value="pessoal" className="space-y-3 mt-0">

            <SectionCard
              title="Dados Pessoais"
              editing={editingPersonal}
              saving={savingPersonal}
              onEdit={() => { setDraftPersonal({}); setEditingPersonal(true); }}
              onSave={savePersonal}
              onCancel={() => { setEditingPersonal(false); setDraftPersonal({}); }}
            >
              {!editingPersonal ? (
                <>
                  <InfoRow icon={User} label="Nome" value={data.nome} />
                  <InfoRow icon={Mail} label="E-mail" value={profile?.email} />
                  <InfoRow icon={Phone} label="Telefone" value={data.telefone} />
                  <InfoRow icon={Calendar} label="Nascimento" value={formatDate(data.data_nascimento)} />
                  <InfoRow icon={User} label="Gênero" value={
                    data.sexo === 'masculino' ? 'Masculino' :
                    data.sexo === 'feminino' ? 'Feminino' : undefined
                  } />
                  <InfoRow icon={User} label="Estado Civil" value={labelFor(ESTADOS_CIVIS, data.estado_civil)} />
                  <InfoRow icon={MapPin} label="Nacionalidade" value={data.nacionalidade} />
                  <InfoRow icon={MapPin} label="Naturalidade" value={data.naturalidade} />
                  <InfoRow icon={CreditCard} label="CPF" value={data.cpf ? formatCPFMasked(data.cpf) : undefined} last />
                </>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <Field label="Nome completo">
                    <Input value={pv('nome')} onChange={(e) => pd('nome', e.target.value)} placeholder="Seu nome completo" className="h-10" />
                  </Field>
                  <Field label="E-mail">
                    <Input value={profile?.email || ''} disabled className="h-10 bg-gray-50 text-gray-400" />
                    <p className="text-[11px] text-gray-400">Não pode ser alterado</p>
                  </Field>
                  <Field label="Telefone">
                    <Input
                      value={pv('telefone')}
                      onChange={(e) => pd('telefone', formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      inputMode="tel"
                      maxLength={15}
                      className="h-10"
                    />
                  </Field>
                  <Field label="Data de nascimento">
                    <Input type="date" value={pv('data_nascimento')} onChange={(e) => pd('data_nascimento', e.target.value)} className="h-10" />
                  </Field>
                  <Field label="Gênero">
                    <Select value={pv('sexo')} onValueChange={(v) => pd('sexo', v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado civil">
                    <Select value={pv('estado_civil')} onValueChange={(v) => pd('estado_civil', v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS_CIVIS.map((ec) => <SelectItem key={ec.v} value={ec.v}>{ec.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nacionalidade">
                    <Input value={pv('nacionalidade')} onChange={(e) => pd('nacionalidade', e.target.value)} placeholder="Ex: Brasileiro(a)" className="h-10" />
                  </Field>
                  <Field label="Naturalidade">
                    <Input value={pv('naturalidade')} onChange={(e) => pd('naturalidade', e.target.value)} placeholder="Cidade/Estado de nascimento" className="h-10" />
                  </Field>
                  <Field label="CPF">
                    <Input
                      value={pv('cpf')}
                      onChange={(e) => pd('cpf', formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      maxLength={14}
                      className="h-10"
                    />
                  </Field>
                </div>
              )}
            </SectionCard>

            {/* Família */}
            {membrosEditamPerfil ? (
              <SectionCard
                title="Família"
                editing={editingFamilia}
                saving={savingFamilia}
                onEdit={() => {
                  setDraftFamilia({ nome_mae: data.nome_mae, nome_pai: data.nome_pai, pai_mae_promessista: paiMaePromessista });
                  setEditingFamilia(true);
                }}
                onSave={saveFamilia}
                onCancel={() => { setEditingFamilia(false); }}
              >
                {!editingFamilia ? (
                  <>
                    <InfoRow icon={Users} label="Nome da Mãe" value={data.nome_mae} />
                    <InfoRow icon={Users} label="Nome do Pai" value={data.nome_pai} />
                    <InfoRow icon={Users} label="Pais Promessistas" value={paiMaePromessista ? 'Sim' : 'Não'} last />
                  </>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <Field label="Nome da Mãe">
                      <Input
                        value={draftFamilia.nome_mae}
                        onChange={(e) => setDraftFamilia(p => ({ ...p, nome_mae: e.target.value }))}
                        placeholder="Nome completo da mãe"
                        className="h-10"
                      />
                    </Field>
                    <Field label="Nome do Pai">
                      <Input
                        value={draftFamilia.nome_pai}
                        onChange={(e) => setDraftFamilia(p => ({ ...p, nome_pai: e.target.value }))}
                        placeholder="Nome completo do pai"
                        className="h-10"
                      />
                    </Field>
                    <Field label="Pais são Promessistas?">
                      <div className="flex items-center gap-3 pt-1">
                        <Switch
                          checked={draftFamilia.pai_mae_promessista}
                          onCheckedChange={(v) => setDraftFamilia(p => ({ ...p, pai_mae_promessista: v }))}
                        />
                        <span className="text-[14px] text-gray-700">
                          {draftFamilia.pai_mae_promessista ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </Field>
                  </div>
                )}
              </SectionCard>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <span className="text-[15px] font-semibold text-gray-800">Família</span>
                </div>
                <InfoRow icon={Users} label="Nome da Mãe" value={data.nome_mae} />
                <InfoRow icon={Users} label="Nome do Pai" value={data.nome_pai} />
                <InfoRow icon={Users} label="Pais Promessistas" value={paiMaePromessista ? 'Sim' : 'Não'} last />
              </div>
            )}

          </TabsContent>

          {/* ── Tab: Endereço ─────────────────────────────────────────────── */}
          <TabsContent value="endereco" className="mt-0">
            <SectionCard
              title="Endereço"
              editing={editingAddress}
              saving={savingAddress}
              onEdit={() => { setDraftAddress({}); setEditingAddress(true); }}
              onSave={saveAddress}
              onCancel={() => { setEditingAddress(false); setDraftAddress({}); }}
            >
              {!editingAddress ? (
                <>
                  <InfoRow icon={MapPin} label="CEP" value={data.cep} />
                  <InfoRow icon={MapPin} label="Logradouro" value={data.logradouro} />
                  <InfoRow icon={MapPin} label="Número / Complemento" value={
                    [data.numero, data.complemento].filter(Boolean).join(', ') || undefined
                  } />
                  <InfoRow icon={MapPin} label="Bairro" value={data.bairro} />
                  <InfoRow icon={MapPin} label="Cidade / Estado" value={
                    [data.cidade, data.uf].filter(Boolean).join(' — ') || undefined
                  } />
                  <InfoRow icon={Globe} label="País" value={data.pais} last />
                </>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <Field label="CEP">
                    <div className="flex gap-2">
                      <Input
                        value={av('cep')}
                        onChange={(e) => ad('cep', formatCEP(e.target.value))}
                        onBlur={() => fetchCep(av('cep'))}
                        placeholder="00000-000"
                        maxLength={9}
                        inputMode="numeric"
                        className="h-10 flex-1"
                      />
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => fetchCep(av('cep'))} disabled={loadingCep}>
                        {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </Field>
                  <Field label="Rua / Avenida">
                    <Input value={av('logradouro')} onChange={(e) => ad('logradouro', e.target.value)} placeholder="Nome da rua" className="h-10" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número">
                      <Input value={av('numero')} onChange={(e) => ad('numero', e.target.value)} placeholder="Nº" className="h-10" />
                    </Field>
                    <Field label="Complemento">
                      <Input value={av('complemento')} onChange={(e) => ad('complemento', e.target.value)} placeholder="Apto, Bloco..." className="h-10" />
                    </Field>
                  </div>
                  <Field label="Bairro">
                    <Input value={av('bairro')} onChange={(e) => ad('bairro', e.target.value)} placeholder="Bairro" className="h-10" />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Cidade" className="col-span-2">
                      <Input value={av('cidade')} onChange={(e) => ad('cidade', e.target.value)} placeholder="Cidade" className="h-10" />
                    </Field>
                    <Field label="UF">
                      <Select value={av('uf')} onValueChange={(v) => ad('uf', v)}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="País">
                    <Input value={av('pais')} onChange={(e) => ad('pais', e.target.value)} placeholder="Brasil" className="h-10" />
                  </Field>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab: Formação ─────────────────────────────────────────────── */}
          <TabsContent value="formacao" className="mt-0">
            <SectionCard
              title="Formação e Trabalho"
              editing={editingFormation}
              saving={savingFormation}
              onEdit={() => { setDraftFormation({}); setEditingFormation(true); }}
              onSave={saveFormation}
              onCancel={() => { setEditingFormation(false); setDraftFormation({}); }}
            >
              {!editingFormation ? (
                <>
                  <InfoRow icon={GraduationCap} label="Grau de instrução" value={labelFor(GRAUS, data.grau_instrucao)} />
                  <InfoRow icon={GraduationCap} label="Formação" value={data.formacao} />
                  <InfoRow icon={GraduationCap} label="Curso" value={data.curso} />
                  <InfoRow icon={Briefcase} label="Profissão" value={data.profissao} last />
                </>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <Field label="Grau de instrução">
                    <Select value={fv('grau_instrucao')} onValueChange={(v) => fd('grau_instrucao', v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{GRAUS.map((g) => <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Formação">
                    <Input value={fv('formacao')} onChange={(e) => fd('formacao', e.target.value)} placeholder="Ex: Administração, Engenharia..." className="h-10" />
                  </Field>
                  <Field label="Curso">
                    <Input value={fv('curso')} onChange={(e) => fd('curso', e.target.value)} placeholder="Curso técnico ou superior" className="h-10" />
                  </Field>
                  <Field label="Profissão">
                    <Input value={fv('profissao')} onChange={(e) => fd('profissao', e.target.value)} placeholder="Sua profissão atual" className="h-10" />
                  </Field>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab: Ministerial (somente leitura) ────────────────────────── */}
          <TabsContent value="ministerial" className="space-y-3 mt-0">

            <div className="bg-gray-50 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                <span className="text-[15px] font-semibold text-gray-800">Situação Ministerial</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ⓘ Gerenciado pelo administrador</span>
              </div>
              {membroData && (membroData.situacao_ministerial || membroData.data_situacao_inicio || membroData.situacao_observacao) ? (
                <>
                  <InfoRow icon={User} label="Situação" value={membroData.situacao_ministerial ? (SITUACAO_MIN_LABELS[membroData.situacao_ministerial] || membroData.situacao_ministerial) : undefined} />
                  <InfoRow icon={Calendar} label="Desde" value={formatDate(membroData.data_situacao_inicio || '')} />
                  <InfoRow icon={User} label="Observação" value={membroData.situacao_observacao || undefined} last />
                </>
              ) : (
                <p className="px-4 py-4 text-[13px] text-gray-400 italic">Nenhuma informação registrada ainda</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                <span className="text-[15px] font-semibold text-gray-800">Ordenação</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ⓘ Gerenciado pelo administrador</span>
              </div>
              {membroData && membroData.ordenacao_funcao && membroData.ordenacao_funcao !== 'nenhum' ? (
                <>
                  <InfoRow icon={User} label="Função" value={ORDENACAO_LABELS[membroData.ordenacao_funcao] || membroData.ordenacao_funcao} />
                  <InfoRow icon={Calendar} label="Desde" value={formatDate(membroData.data_ordenacao_inicio || '')} />
                  <InfoRow icon={Calendar} label="Até" value={formatDate(membroData.data_ordenacao_fim || '')} last />
                </>
              ) : (
                <p className="px-4 py-4 text-[13px] text-gray-400 italic">Nenhuma informação registrada ainda</p>
              )}
            </div>

          </TabsContent>

          {/* ── Tab: Batismo (editável) ────────────────────────────────────── */}
          <TabsContent value="batismo" className="mt-0">
            <SectionCard
              title="Origem e Batismo"
              editing={editingBatismo}
              saving={savingBatismo}
              onEdit={() => { setDraftBatismo({}); setEditingBatismo(true); }}
              onSave={saveBatismo}
              onCancel={() => { setEditingBatismo(false); setDraftBatismo({}); }}
            >
              {!editingBatismo ? (
                <>
                  <InfoRow icon={MapPin} label="Como chegou" value={membroData?.origem_membro ? (ORIGEM_LABELS[membroData.origem_membro] || membroData.origem_membro) : undefined} />
                  {membroData?.igreja_anterior && (
                    <InfoRow icon={MapPin} label="Igreja anterior" value={membroData.igreja_anterior} />
                  )}
                  <InfoRow icon={Calendar} label="Data de recebimento" value={formatDate(membroData?.data_recebimento || '')} />
                  <InfoRow icon={Droplets} label="Batismo em Água" value={formatDate(membroData?.data_batismo_agua || '')} />
                  <InfoRow icon={User} label="Pastor Oficiante" value={membroData?.pastor_oficiante || undefined} />
                  <InfoRow icon={MapPin} label="Local do Batismo" value={membroData?.local_batismo || undefined} />
                  <InfoRow icon={Droplets} label="Batismo no Espírito Santo" value={
                    membroData?.batismo_espirito_santo === null || membroData?.batismo_espirito_santo === undefined
                      ? undefined
                      : membroData.batismo_espirito_santo ? 'Sim' : 'Não'
                  } />
                  {membroData?.batismo_espirito_santo && (
                    <InfoRow icon={Calendar} label="Data Batismo Espírito" value={formatDate(membroData.data_batismo_espirito || '')} last />
                  )}
                  {!membroData?.batismo_espirito_santo && (
                    <div className="h-1" />
                  )}
                </>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <Field label="Como chegou à igreja">
                    <Select value={bv('origem_membro')} onValueChange={(v) => bd('origem_membro', v)}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {ORIGENS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Igreja anterior">
                    <Input value={bv('igreja_anterior')} onChange={(e) => bd('igreja_anterior', e.target.value)} placeholder="Nome da igreja anterior" className="h-10" />
                  </Field>
                  <Field label="Data de recebimento">
                    <Input type="date" value={bv('data_recebimento')} onChange={(e) => bd('data_recebimento', e.target.value)} className="h-10" />
                  </Field>
                  <Field label="Local do Batismo">
                    <Input value={bv('local_batismo')} onChange={(e) => bd('local_batismo', e.target.value)} placeholder="Local onde foi batizado" className="h-10" />
                  </Field>
                  <Field label="Pastor Oficiante">
                    <Input value={bv('pastor_oficiante')} onChange={(e) => bd('pastor_oficiante', e.target.value)} placeholder="Nome do pastor" className="h-10" />
                  </Field>
                  <Field label="Data do Batismo em Água">
                    <Input type="date" value={bv('data_batismo_agua')} onChange={(e) => bd('data_batismo_agua', e.target.value)} className="h-10" />
                  </Field>
                  <Field label="Batizado no Espírito Santo">
                    <Select
                      value={bvBool('batismo_espirito_santo') === null ? '' : bvBool('batismo_espirito_santo') ? 'sim' : 'nao'}
                      onValueChange={(v) => bd('batismo_espirito_santo', v === '' ? null : v === 'sim')}
                    >
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {bvBool('batismo_espirito_santo') === true && (
                    <Field label="Data Batismo no Espírito Santo">
                      <Input type="date" value={bv('data_batismo_espirito')} onChange={(e) => bd('data_batismo_espirito', e.target.value)} className="h-10" />
                    </Field>
                  )}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Tab: Conta ────────────────────────────────────────────────── */}
          <TabsContent value="conta" className="space-y-3 mt-0">

            {/* Notificações */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <span className="text-[15px] font-semibold text-gray-800">Notificações</span>
              </div>
              {!notificacoesPushAtivas ? (
                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BellOff className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-[14px] text-gray-500 pt-1.5">Notificações push não disponíveis no momento.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {pushEnabled
                        ? <Bell className="w-4 h-4 text-[#1a5c38]" />
                        : <BellOff className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-gray-800">Notificações Push</p>
                      <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                        {!pushSupported
                          ? 'Requer HTTPS e browser compatível'
                          : pushPermission === 'denied'
                          ? 'Permissão negada — habilite nas configurações do navegador'
                          : pushEnabled
                          ? 'Alertas de escalas, eventos e avisos ativos'
                          : 'Ative para receber alertas de escalas e avisos'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={pushEnabled}
                    onCheckedChange={async () => {
                      try {
                        await toggleSubscription();
                      } catch {
                        toast.error('Não foi possível alterar as notificações. Verifique as permissões do navegador.');
                      }
                    }}
                    disabled={!pushSupported || pushLoading || pushPermission === 'denied'}
                  />
                </div>
              )}
            </div>

            {/* Segurança */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <span className="text-[15px] font-semibold text-gray-800">Segurança</span>
              </div>
              <button
                onClick={handlePasswordReset}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#1a5c38]" />
                  </div>
                  <span className="text-[14px] font-medium text-gray-800">Alterar senha</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-4 active:bg-red-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[14px] font-medium text-red-500">Sair da conta</span>
              </button>
            </div>

          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
