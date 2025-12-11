import { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';

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
  cores: {
    primary?: string;
    secondary?: string;
    accent?: string;
  } | null;
}

// Mock de logs para demonstração
const mockLogs = [
  { id: 1, acao: 'Configurações atualizadas', data: new Date().toISOString(), usuario: 'Admin', status: 'sucesso' },
  { id: 2, acao: 'Logo alterada', data: new Date(Date.now() - 86400000).toISOString(), usuario: 'Admin', status: 'sucesso' },
  { id: 3, acao: 'Notificações ativadas', data: new Date(Date.now() - 172800000).toISOString(), usuario: 'Admin', status: 'sucesso' },
];

function ConfiguracoesSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}

export default function Configuracoes() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuracoes | null>(null);

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

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

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
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updateData = {
        nome_igreja: nomeIgreja,
        endereco,
        telefone,
        email,
        urls_transmissao: { youtube, instagram },
        facebook,
        capacidade_base_padrao: capacidadeBase,
        bases_publicas: basesPublicas,
        visitantes_auto: visitantesAuto,
        membros_editam_perfil: membrosEditam,
        notificacoes_lideres: notificacoesLideres,
        notificacoes_email: notificacoesEmail,
        notificacoes_push: notificacoesPush,
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

      toast.success('Configurações atualizadas com sucesso!');
      fetchConfiguracoes();
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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
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
                  Push notifications (em breve)
                </p>
              </div>
              <Switch
                checked={notificacoesPush}
                onCheckedChange={setNotificacoesPush}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="space-y-3">
            {mockLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">{log.acao}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{log.usuario}</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Histórico completo em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
