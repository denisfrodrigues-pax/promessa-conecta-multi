import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ChurchLogo } from '@/components/ChurchLogo';
import { cn } from '@/lib/utils';

interface ProfileData {
  nome: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
}

function formatPhone(value: string) {
  const n = value.replace(/\D/g, '');
  if (n.length <= 10) {
    return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return n
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

function formatCPFMasked(cpf: string) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11) return cpf;
  return `***.***.${n.slice(6, 9)}-**`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
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
        <p className="text-[15px] text-gray-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function MemberPerfil() {
  const { profile, signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    telefone: '',
    data_nascimento: '',
    cpf: '',
  });

  const {
    isSupported: pushSupported,
    isSubscribed: pushEnabled,
    isLoading: pushLoading,
    permission: pushPermission,
    toggleSubscription,
  } = usePushNotifications();

  useEffect(() => {
    if (profile?.foto_url) setAvatarUrl(profile.foto_url);
  }, [profile?.foto_url]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('nome, telefone, data_nascimento, cpf, foto_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const p = data as any;
        setProfileData({
          nome: p.nome || '',
          telefone: p.telefone ? formatPhone(p.telefone) : '',
          data_nascimento: p.data_nascimento || '',
          cpf: p.cpf || '',
        });
        if (p.foto_url) setAvatarUrl(p.foto_url);
      });
  }, [user?.id]);

  const handleAvatarClick = () => fileInputRef.current?.click();

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
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', profile?.id);
      if (updateError) throw updateError;

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

  const openEdit = () => {
    setEditNome(profileData.nome);
    setEditTelefone(profileData.telefone);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!editNome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: editNome.trim(),
          telefone: editTelefone ? editTelefone.replace(/\D/g, '') : null,
        })
        .eq('id', profile.id);
      if (error) throw error;
      setProfileData((prev) => ({
        ...prev,
        nome: editNome.trim(),
        telefone: editTelefone,
      }));
      setEditOpen(false);
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
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

  const displayName = profileData.nome || profile?.nome || '';
  const avatarSrc = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      {/* ── Header ── */}
      <div
        className="relative"
        style={{
          background: 'linear-gradient(160deg, #1a5c38 0%, #2d8a57 100%)',
          minHeight: 180,
          paddingBottom: 52,
        }}
      >
        {/* Logo top-left */}
        <div className="absolute top-4 left-4 opacity-80">
          <ChurchLogo size={26} maxWidth={72} />
        </div>

        {/* Name + email centred */}
        <div className="flex flex-col items-center pt-12 px-8 text-center">
          <h1 className="text-white font-bold text-[22px] leading-tight line-clamp-2">
            {displayName}
          </h1>
          <p className="text-white/70 text-[13px] mt-1 truncate max-w-[260px]">
            {profile?.email}
          </p>
        </div>

        {/* Avatar — overflows header bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            className="relative w-[90px] h-[90px] rounded-full overflow-hidden border-[3px] border-white shadow-xl bg-gradient-to-br from-[#2d8a57] to-[#1a5c38] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            aria-label="Alterar foto de perfil"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-[34px] font-bold text-white">
                {displayName.charAt(0).toUpperCase() || '?'}
              </span>
            )}
            {/* Camera overlay */}
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

      {/* ── Body ── */}
      <div className="pt-14 pb-28 px-4 max-w-md mx-auto space-y-3">
        {/* Card: Informações Pessoais */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            <span className="text-[15px] font-semibold text-gray-800">
              Informações Pessoais
            </span>
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a5c38] active:opacity-70"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
          <InfoRow icon={User} label="Nome" value={displayName} />
          <InfoRow icon={Mail} label="E-mail" value={profile?.email || ''} />
          <InfoRow
            icon={Phone}
            label="Telefone"
            value={profileData.telefone || '—'}
          />
          {profileData.data_nascimento && (
            <InfoRow
              icon={Calendar}
              label="Nascimento"
              value={formatDate(profileData.data_nascimento)}
            />
          )}
          {profileData.cpf && (
            <InfoRow
              icon={CreditCard}
              label="CPF"
              value={formatCPFMasked(profileData.cpf)}
              last
            />
          )}
          {!profileData.cpf && !profileData.data_nascimento && (
            <div className="px-4 py-3.5 border-t border-gray-100">
              <p className="text-[12px] text-gray-400 text-center">
                Dados adicionais gerenciados pelo administrador
              </p>
            </div>
          )}
        </div>

        {/* Card: Notificações */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <span className="text-[15px] font-semibold text-gray-800">
              Notificações
            </span>
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
                <p className="text-[14px] font-medium text-gray-800">
                  Notificações Push
                </p>
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

        {/* Card: Segurança */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <span className="text-[15px] font-semibold text-gray-800">
              Segurança
            </span>
          </div>
          <button
            onClick={handlePasswordReset}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#eef7f2] flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#1a5c38]" />
              </div>
              <span className="text-[14px] font-medium text-gray-800">
                Alterar senha
              </span>
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
            <span className="text-[14px] font-medium text-red-500">
              Sair da conta
            </span>
          </button>
        </div>
      </div>

      {/* ── Edit Sheet ── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-safe-area-inset-bottom"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="text-left">Editar Perfil</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nome" className="text-[13px] text-gray-500">
                Nome completo
              </Label>
              <Input
                id="edit-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Seu nome completo"
                className="h-11 text-[15px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-telefone"
                className="text-[13px] text-gray-500"
              >
                Telefone
              </Label>
              <Input
                id="edit-telefone"
                value={editTelefone}
                onChange={(e) =>
                  setEditTelefone(formatPhone(e.target.value))
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
                inputMode="tel"
                className="h-11 text-[15px]"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              CPF, data de nascimento e outros dados são gerenciados pelo
              administrador.
            </p>
          </div>

          <SheetFooter className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setEditOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 bg-[#1a5c38] hover:bg-[#164d30] text-white"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
