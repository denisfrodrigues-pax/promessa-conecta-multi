import { useState, useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Building2,
  Bell,
  Cog,
  Save,
  Loader2,
  Instagram,
  Youtube,
  Facebook,
  Phone,
  MapPin,
  Mail,
  Globe,
  History,
  Upload,
  X,
  Image as ImageIcon,
  Clock,
  Calendar,
  Eye,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Configuracoes {
  id: string;
  nome_igreja: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  logo_url: string | null;
  urls_transmissao: {
    youtube?: string;
    instagram?: string;
  } | null;
  facebook: string | null;
  capacidade_base_padrao: number | null;
  bases_publicas: boolean | null;
  visitantes_auto: boolean | null;
  membros_editam_perfil: boolean | null;
  notificacoes_lideres: boolean | null;
  notificacoes_email: boolean | null;
  notificacoes_push: boolean | null;
  google_maps_url: string | null;
  horario_ebd: string | null;
  horario_culto: string | null;
}


const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function ConfiguracoesSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[500px]" />
        <Skeleton className="h-[400px]" />
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}

export default function Configuracoes() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, toggleSubscription } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [capacidadeBase, setCapacidadeBase] = useState(20);
  const [basesPublicas, setBasesPublicas] = useState(true);
  const [visitantesAuto, setVisitantesAuto] = useState(true);
  const [membrosEditam, setMembrosEditam] = useState(true);
  const [notificacoesLideres, setNotificacoesLideres] = useState(true);
  const [notificacoesEmail, setNotificacoesEmail] = useState(false);
  const [notificacoesPush, setNotificacoesPush] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [horarioEbd, setHorarioEbd] = useState('18:00');
  const [horarioCulto, setHorarioCulto] = useState('19:07');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; created_at: string | null; usuario: string }[]>([]);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState('');
  const [previewCalendar, setPreviewCalendar] = useState(false);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchConfiguracoes();
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, created_at, profiles:user_id(nome)')
        .eq('table_name', 'configuracoes_instituicao')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = (data || []).map((row) => ({
        id: row.id,
        action: row.action,
        created_at: row.created_at,
        usuario: (row.profiles as { nome: string } | null)?.nome || 'Admin',
      }));

      setAuditLogs(formatted);
    } catch {
      // Silently ignore — audit log display is non-critical
    }
  }

  async function fetchConfiguracoes() {
    try {
      const { data, error } = await supabase
        .from('configuracoes_instituicao')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as Configuracoes);
        setNomeIgreja(data.nome_igreja || '');
        setEndereco(data.endereco || '');
        setTelefone(data.telefone || '');
        setEmail(data.email || '');
        setLogoUrl(data.logo_url || null);
        
        const urls = data.urls_transmissao as { youtube?: string; instagram?: string } | null;
        setInstagram(urls?.instagram || '');
        setYoutube(urls?.youtube || '');
        setFacebook(data.facebook || '');
        
        setCapacidadeBase(data.capacidade_base_padrao || 20);
        setBasesPublicas(data.bases_publicas ?? true);
        setVisitantesAuto(data.visitantes_auto ?? true);
        setMembrosEditam(data.membros_editam_perfil ?? true);
        setNotificacoesLideres(data.notificacoes_lideres ?? true);
        setNotificacoesEmail(data.notificacoes_email ?? false);
        setNotificacoesPush(data.notificacoes_push ?? false);
        setGoogleMapsUrl(data.google_maps_url || '');
        setHorarioEbd(data.horario_ebd || '18:00');
        setHorarioCulto(data.horario_culto || '19:07');
        setGoogleCalendarUrl((data as any).google_calendar_embed_url || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PNG, JPG ou WebP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Tamanho máximo: 1MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogoFile(null);
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return logoUrl;

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (logoUrl && !logoUrl.includes('placeholder')) {
        const oldPath = logoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `church-logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast.error('Erro ao fazer upload da logo');
      return logoUrl;
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upload logo first if there's a new file
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadLogo();
      }

      const updateData = {
        nome_igreja: nomeIgreja,
        endereco,
        telefone,
        email,
        logo_url: finalLogoUrl,
        urls_transmissao: { youtube, instagram },
        facebook,
        capacidade_base_padrao: capacidadeBase,
        bases_publicas: basesPublicas,
        visitantes_auto: visitantesAuto,
        membros_editam_perfil: membrosEditam,
        notificacoes_lideres: notificacoesLideres,
        notificacoes_email: notificacoesEmail,
        notificacoes_push: notificacoesPush,
        google_maps_url: googleMapsUrl || null,
        horario_ebd: horarioEbd || null,
        horario_culto: horarioCulto || null,
        google_calendar_embed_url: googleCalendarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (config?.id) {
        const { error } = await supabase
          .from('configuracoes_instituicao')
          .update(updateData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_instituicao')
          .insert(updateData);

        if (error) throw error;
      }

      // Clear file state after successful save
      setLogoFile(null);
      setLogoPreview(null);
      setLogoUrl(finalLogoUrl);

      toast.success('Configurações atualizadas com sucesso!');
      fetchConfiguracoes();
      fetchAuditLogs();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <ConfiguracoesSkeleton />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return <ConfiguracoesSkeleton />;
  }

  const displayLogo = logoPreview || logoUrl;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || uploadingLogo}>
          {saving || uploadingLogo ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Tudo
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card: Dados da Igreja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados da Igreja
            </CardTitle>
            <CardDescription>
              Informações básicas e contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Logo da Igreja</Label>
              <div className="flex items-start gap-4">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                  {displayLogo ? (
                    <img 
                      src={displayLogo} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>
                
                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {displayLogo ? 'Trocar Logo' : 'Enviar Logo'}
                  </Button>
                  {displayLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WebP. Máx. 1MB. Proporção recomendada: 1:1
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="nome_igreja">Nome da Igreja</Label>
              <Input
                id="nome_igreja"
                value={nomeIgreja}
                onChange={(e) => setNomeIgreja(e.target.value)}
                placeholder="Nome da sua igreja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Endereço
              </Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@igreja.com"
                />
              </div>
            </div>

            <Separator />

            {/* Horários e Mapa */}
            <div className="space-y-4">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Horários e Localização
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_ebd" className="text-xs">
                    Horário Escola Bíblica
                  </Label>
                  <Input
                    id="horario_ebd"
                    value={horarioEbd}
                    onChange={(e) => setHorarioEbd(e.target.value)}
                    placeholder="18:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_culto" className="text-xs">
                    Horário Culto de Celebração
                  </Label>
                  <Input
                    id="horario_culto"
                    value={horarioCulto}
                    onChange={(e) => setHorarioCulto(e.target.value)}
                    placeholder="19:07"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_maps_url" className="text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Link do Google Maps (embed)
                </Label>
                <Input
                  id="google_maps_url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link embed do Google Maps para exibir o mapa na página de contato
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Redes Sociais
              </Label>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-xs flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/suaigreja"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="text-xs flex items-center gap-1">
                  <Youtube className="w-3 h-3" />
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@suaigreja"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-xs flex items-center gap-1">
                  <Facebook className="w-3 h-3" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/suaigreja"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Configurações de Operação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5" />
              Operação
            </CardTitle>
            <CardDescription>
              Configurações de funcionamento do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="capacidade">Capacidade Padrão de Base</Label>
              <Input
                id="capacidade"
                type="number"
                min={1}
                max={500}
                value={capacidadeBase}
                onChange={(e) => setCapacidadeBase(parseInt(e.target.value) || 20)}
              />
              <p className="text-xs text-muted-foreground">
                Valor padrão ao criar novas bases
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bases Públicas</Label>
                  <p className="text-xs text-muted-foreground">
                    Permitir que bases sejam visíveis para todos
                  </p>
                </div>
                <Switch
                  checked={basesPublicas}
                  onCheckedChange={setBasesPublicas}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-cadastro de Visitantes</Label>
                  <p className="text-xs text-muted-foreground">
                    Visitantes podem se cadastrar sozinhos
                  </p>
                </div>
                <Switch
                  checked={visitantesAuto}
                  onCheckedChange={setVisitantesAuto}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Membros Editam Perfil</Label>
                  <p className="text-xs text-muted-foreground">
                    Membros podem atualizar seus próprios dados
                  </p>
                </div>
                <Switch
                  checked={membrosEditam}
                  onCheckedChange={setMembrosEditam}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card: Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure o envio de notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Notificações para Líderes</Label>
                <p className="text-xs text-muted-foreground">
                  Avisar líderes sobre eventos e escalas
                </p>
              </div>
              <Switch
                checked={notificacoesLideres}
                onCheckedChange={setNotificacoesLideres}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Notificações por E-mail</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar e-mails automáticos
                </p>
              </div>
              <Switch
                checked={notificacoesEmail}
                onCheckedChange={setNotificacoesEmail}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-xs text-muted-foreground">
                  {pushSupported
                    ? pushSubscribed
                      ? 'Ativas neste dispositivo'
                      : 'Ativar para este dispositivo'
                    : 'Não suportado neste navegador'}
                </p>
              </div>
              <Switch
                checked={pushSubscribed}
                onCheckedChange={() => toggleSubscription()}
                disabled={!pushSupported || pushLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: Calendário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendário
          </CardTitle>
          <CardDescription>
            Integração com Google Calendar público da igreja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_calendar_url">URL de Incorporação do Google Calendar</Label>
            <div className="flex gap-2">
              <Input
                id="google_calendar_url"
                value={googleCalendarUrl}
                onChange={e => setGoogleCalendarUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/embed?src=..."
                className="flex-1"
              />
              {googleCalendarUrl.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewCalendar(true)}
                  title="Visualizar calendário"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Acesse o Google Calendar → Configurações do calendário → Role até "Integrar calendário" → Copie o link de incorporação (valor do atributo <code className="bg-muted px-1 rounded">src</code> do iframe).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal preview do calendário */}
      <Dialog open={previewCalendar} onOpenChange={setPreviewCalendar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview — Calendário da Igreja</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border">
            <iframe
              src={googleCalendarUrl}
              className="w-full h-[450px] block"
              frameBorder="0"
              scrolling="no"
              title="Preview Google Calendar"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Card: Log de Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Registro de Ações
          </CardTitle>
          <CardDescription>
            Histórico de alterações nas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium capitalize">{log.action}</p>
                      {log.created_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{log.usuario}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      sucesso
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
