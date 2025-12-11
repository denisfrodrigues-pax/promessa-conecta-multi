import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar, Save, LogOut, Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function MemberPerfil() {
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    telefone: profile?.telefone || '',
    endereco: (profile as any)?.endereco || '',
    data_nascimento: (profile as any)?.data_nascimento || '',
    sexo: (profile as any)?.sexo || '',
    estado_civil: (profile as any)?.estado_civil || '',
  });

  const { 
    isSupported: pushSupported, 
    isSubscribed: pushEnabled, 
    isLoading: pushLoading,
    permission: pushPermission,
    toggleSubscription 
  } = usePushNotifications();

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null,
          data_nascimento: formData.data_nascimento || null,
          sexo: formData.sexo || null,
          estado_civil: formData.estado_civil || null,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToggle = async () => {
    await toggleSubscription();
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Header - Premium */}
      <Card className="shadow-card border-0 mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-promessa to-promessa-dark" />
        <CardContent className="p-6 pt-0">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-promessa-light to-promessa flex items-center justify-center shadow-lg border-4 border-background">
              <span className="text-4xl font-bold text-white">
                {profile?.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="pb-2">
              <h2 className="text-xl font-display font-bold">{profile?.nome}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card className="shadow-card mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {pushEnabled ? (
                  <Bell className="w-4 h-4 text-primary" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="push-notifications" className="font-medium">
                  Notificações Push
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {!pushSupported 
                  ? 'Não suportado neste navegador'
                  : pushPermission === 'denied'
                  ? 'Permissão negada. Habilite nas configurações do navegador.'
                  : pushEnabled 
                  ? 'Você receberá alertas de escalas, eventos e avisos'
                  : 'Receba alertas de escalas, eventos e avisos'}
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushEnabled}
              onCheckedChange={handlePushToggle}
              disabled={!pushSupported || pushLoading || pushPermission === 'denied'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Form - Premium */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="nome"
                className="pl-10"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                className="pl-10"
                value={profile?.email || ''}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="telefone"
                className="pl-10"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="endereco"
                className="pl-10 min-h-[80px]"
                placeholder="Seu endereço completo"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="data_nascimento"
                  type="date"
                  className="pl-10"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(v) => setFormData({ ...formData, sexo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado_civil">Estado Civil</Label>
            <Select value={formData.estado_civil} onValueChange={(v) => setFormData({ ...formData, estado_civil: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
