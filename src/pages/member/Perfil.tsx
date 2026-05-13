import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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

function formatCPFMasked(cpf: string) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11) return cpf;
  return `***.${n.slice(3, 6)}.${n.slice(6, 9)}-**`;
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
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3.5',
        !last && 'border-b border-gray-100'
      )}
    >
      <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#1a5c38]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[14px] text-gray-800 break-words">{value || '—'}</p>
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

function SectionCard({
  title,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  children,
}: SectionCardProps) {
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
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
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
  // profiles table
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
  // membros-only
  nacionalidade: string;
  genero: string; // mirrors sexo for membros
}

const EMPTY_PROFILE: ProfileState = {
  nome: '', telefone: '', data_nascimento: '', sexo: '', estado_civil: '',
  naturalidade: '', cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', uf: '', grau_instrucao: '', formacao: '',
  profissao: '', cpf: '', nacionalidade: '', genero: '',
};

export default function MemberPerfil() {
  const { profile, signOut, user } = useAuth();
  const [data, setData] = useState<ProfileState>(EMPTY_PROFILE);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // draft state per section
  const [draftPersonal, setDraftPersonal] = useState<Partial<ProfileState>>({});
  const [draftAddress, setDraftAddress] = useState<Partial<ProfileState>>({});
  const [draftFormation, setDraftFormation] = useState<Partial<ProfileState>>({});

  // editing flags
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingFormation, setEditingFormation] = useState(false);

  // saving flags
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingFormation, setSavingFormation] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const { isSupported: pushSupported, isSubscribed: pushEnabled,
    isLoading: pushLoading, permission: pushPermission, toggleSubscription } =
    usePushNotifications();

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id || !profile?.id) return;

    // Load profiles
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

    // Load membros (extra fields not in profiles)
    supabase
      .from('membros')
      .select('nacionalidade, genero, rua, estado')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data: m }) => {
        if (!m) return;
        const mb = m as any;
        setData((prev) => ({
          ...prev,
          nacionalidade: mb.nacionalidade || '',
          genero: mb.genero || '',
          // prefer profiles data but fall back to membros if empty
          logradouro: prev.logradouro || mb.rua || '',
          uf: prev.uf || mb.estado || '',
        }));
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
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
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

  async function saveProfileFields(fields: Partial<Record<string, unknown>>) {
    const { error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', profile!.id);
    if (error) throw error;
  }

  async function saveMembrosFields(fields: Partial<Record<string, unknown>>) {
    // Try update first; if no row, ignore (admin manages membros creation)
    await supabase
      .from('membros')
      .update(fields)
      .eq('user_id', profile!.id);
    // Errors here are non-fatal (may not have a membros record)
  }

  // ── Section saves ─────────────────────────────────────────────────────────

  const savePersonal = async () => {
    if (!profile) return;
    const d = draftPersonal;
    if (d.nome !== undefined && !String(d.nome).trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSavingPersonal(true);
    try {
      await saveProfileFields({
        nome: d.nome ?? data.nome,
        telefone: d.telefone ? String(d.telefone).replace(/\D/g, '') : (data.telefone ? data.telefone.replace(/\D/g, '') : null),
        data_nascimento: d.data_nascimento ?? data.data_nascimento || null,
        sexo: d.sexo ?? data.sexo || null,
        estado_civil: d.estado_civil ?? data.estado_civil || null,
        naturalidade: d.naturalidade ?? data.naturalidade || null,
      });
      // Sync to membros
      await saveMembrosFields({
        nome: d.nome ?? data.nome,
        telefone: d.telefone ? String(d.telefone).replace(/\D/g, '') : (data.telefone?.replace(/\D/g, '') || null),
        data_nascimento: d.data_nascimento ?? data.data_nascimento || null,
        genero: d.sexo ?? data.sexo || null,
        estado_civil: d.estado_civil ?? data.estado_civil || null,
        naturalidade: d.naturalidade ?? data.naturalidade || null,
        nacionalidade: d.nacionalidade ?? data.nacionalidade || null,
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
        logradouro: d.logradouro ?? data.logradouro || null,
        numero: d.numero ?? data.numero || null,
        complemento: d.complemento ?? data.complemento || null,
        bairro: d.bairro ?? data.bairro || null,
        cidade: d.cidade ?? data.cidade || null,
        uf: d.uf ?? data.uf || null,
      });
      await saveMembrosFields({
        cep: d.cep ? String(d.cep).replace(/\D/g, '') : (data.cep?.replace(/\D/g, '') || null),
        rua: d.logradouro ?? data.logradouro || null,
        numero: d.numero ?? data.numero || null,
        complemento: d.complemento ?? data.complemento || null,
        bairro: d.bairro ?? data.bairro || null,
        cidade: d.cidade ?? data.cidade || null,
        estado: d.uf ?? data.uf || null,
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
        grau_instrucao: d.grau_instrucao ?? data.grau_instrucao || null,
        formacao: d.formacao ?? data.formacao || null,
        profissao: d.profissao ?? data.profissao || null,
      });
      await saveMembrosFields({
        grau_instrucao: d.grau_instrucao ?? data.grau_instrucao || null,
        profissao: d.profissao ?? data.profissao || null,
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

  // helpers for draft updates
  const pd = (key: keyof ProfileState, val: string) =>
    setDraftPersonal((p) => ({ ...p, [key]: val }));
  const ad = (key: keyof ProfileState, val: string) =>
    setDraftAddress((p) => ({ ...p, [key]: val }));
  const fd = (key: keyof ProfileState, val: string) =>
    setDraftFormation((p) => ({ ...p, [key]: val }));

  // merged view values (draft takes priority when editing)
  const pv = (key: keyof ProfileState) =>
    String(editingPersonal ? (draftPersonal[key] ?? data[key]) : data[key]) || '';
  const av = (key: keyof ProfileState) =>
    String(editingAddress ? (draftAddress[key] ?? data[key]) : data[key]) || '';
  const fv = (key: keyof ProfileState) =>
    String(editingFormation ? (draftFormation[key] ?? data[key]) : data[key]) || '';

  const displayName = data.nome || profile?.nome || '';
  const avatarSrc = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(160deg, #1a5c38 0%, #2d8a57 100%)',
          minHeight: 180,
          paddingBottom: 52,
        }}
      >
        <div className="absolute top-4 left-4 opacity-80">
          <ChurchLogo size={26} maxWidth={72} />
        </div>
        <div className="flex flex-col items-center pt-12 px-8 text-center">
          <h1 className="text-white font-bold text-[22px] leading-tight line-clamp-2">
            {displayName}
          </h1>
          <p className="text-white/70 text-[13px] mt-1 truncate max-w-[260px]">
            {profile?.email}
          </p>
        </div>
        {/* Avatar */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />
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
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="pt-14 pb-28 px-4 max-w-md mx-auto space-y-3">

        {/* ── Dados Pessoais ─────────────────────────────────────────────── */}
        <SectionCard
          title="Dados Pessoais"
          editing={editingPersonal}
          saving={savingPersonal}
          onEdit={() => {
            setDraftPersonal({});
            setEditingPersonal(true);
          }}
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
              <InfoRow icon={MapPin} label="Naturalidade" value={data.naturalidade} last />
              {data.cpf && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium leading-none mb-0.5">CPF</p>
                    <p className="text-[14px] text-gray-500">{formatCPFMasked(data.cpf)}</p>
                    <p className="text-[10px] text-gray-400">Alterado apenas pelo administrador</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <Field label="Nome completo">
                <Input
                  value={pv('nome')}
                  onChange={(e) => pd('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  className="h-10"
                />
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
                <Input
                  type="date"
                  value={pv('data_nascimento')}
                  onChange={(e) => pd('data_nascimento', e.target.value)}
                  className="h-10"
                />
              </Field>
              <Field label="Gênero">
                <Select value={pv('sexo')} onValueChange={(v) => pd('sexo', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado civil">
                <Select value={pv('estado_civil')} onValueChange={(v) => pd('estado_civil', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CIVIS.map((ec) => (
                      <SelectItem key={ec.v} value={ec.v}>{ec.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nacionalidade">
                <Input
                  value={pv('nacionalidade')}
                  onChange={(e) => pd('nacionalidade', e.target.value)}
                  placeholder="Ex: Brasileiro(a)"
                  className="h-10"
                />
              </Field>
              <Field label="Naturalidade">
                <Input
                  value={pv('naturalidade')}
                  onChange={(e) => pd('naturalidade', e.target.value)}
                  placeholder="Cidade/Estado de nascimento"
                  className="h-10"
                />
              </Field>
            </div>
          )}
        </SectionCard>

        {/* ── Endereço ───────────────────────────────────────────────────── */}
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
              } last />
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={() => fetchCep(av('cep'))}
                    disabled={loadingCep}
                  >
                    {loadingCep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Field>
              <Field label="Rua / Avenida">
                <Input
                  value={av('logradouro')}
                  onChange={(e) => ad('logradouro', e.target.value)}
                  placeholder="Nome da rua"
                  className="h-10"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número">
                  <Input
                    value={av('numero')}
                    onChange={(e) => ad('numero', e.target.value)}
                    placeholder="Nº"
                    className="h-10"
                  />
                </Field>
                <Field label="Complemento">
                  <Input
                    value={av('complemento')}
                    onChange={(e) => ad('complemento', e.target.value)}
                    placeholder="Apto, Bloco..."
                    className="h-10"
                  />
                </Field>
              </div>
              <Field label="Bairro">
                <Input
                  value={av('bairro')}
                  onChange={(e) => ad('bairro', e.target.value)}
                  placeholder="Bairro"
                  className="h-10"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Cidade" className="col-span-2">
                  <Input
                    value={av('cidade')}
                    onChange={(e) => ad('cidade', e.target.value)}
                    placeholder="Cidade"
                    className="h-10"
                  />
                </Field>
                <Field label="UF">
                  <Select value={av('uf')} onValueChange={(v) => ad('uf', v)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Formação ───────────────────────────────────────────────────── */}
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
              <InfoRow icon={Briefcase} label="Profissão" value={data.profissao} last />
            </>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <Field label="Grau de instrução">
                <Select value={fv('grau_instrucao')} onValueChange={(v) => fd('grau_instrucao', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAUS.map((g) => (
                      <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Formação / Curso">
                <Input
                  value={fv('formacao')}
                  onChange={(e) => fd('formacao', e.target.value)}
                  placeholder="Ex: Administração, Engenharia..."
                  className="h-10"
                />
              </Field>
              <Field label="Profissão">
                <Input
                  value={fv('profissao')}
                  onChange={(e) => fd('profissao', e.target.value)}
                  placeholder="Sua profissão atual"
                  className="h-10"
                />
              </Field>
            </div>
          )}
        </SectionCard>

        {/* ── Notificações ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <span className="text-[15px] font-semibold text-gray-800">Notificações</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
              <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                {pushEnabled ? (
                  <Bell className="w-4 h-4 text-[#1a5c38]" />
                ) : (
                  <BellOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-[14px] font-medium text-gray-800">Notificações Push</p>
                <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                  {!pushSupported
                    ? 'Não suportado neste navegador'
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
              onCheckedChange={toggleSubscription}
              disabled={!pushSupported || pushLoading || pushPermission === 'denied'}
            />
          </div>
        </div>

        {/* ── Segurança ──────────────────────────────────────────────────── */}
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

      </div>
    </div>
  );
}
