import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Save, 
  LogOut, 
  Bell, 
  BellOff,
  CreditCard,
  GraduationCap,
  Briefcase,
  Church,
  Loader2,
  Search
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface ProfileFormData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
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
  pcd: string;
  batizado_aguas: boolean;
  data_batismo: string;
}

const GRAUS_INSTRUCAO = [
  { value: 'fundamental_incompleto', label: 'Ensino Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Ensino Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Ensino Médio Incompleto' },
  { value: 'medio_completo', label: 'Ensino Médio Completo' },
  { value: 'superior_incompleto', label: 'Ensino Superior Incompleto' },
  { value: 'superior_completo', label: 'Ensino Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
];

const TIPOS_PCD = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'fisica', label: 'Deficiência Física' },
  { value: 'visual', label: 'Deficiência Visual' },
  { value: 'auditiva', label: 'Deficiência Auditiva' },
  { value: 'intelectual', label: 'Deficiência Intelectual' },
  { value: 'multipla', label: 'Deficiência Múltipla' },
  { value: 'tea', label: 'Transtorno do Espectro Autista (TEA)' },
];

const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function MemberPerfil() {
  const { profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    nome: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    sexo: '',
    estado_civil: '',
    naturalidade: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    grau_instrucao: '',
    formacao: '',
    profissao: '',
    pcd: '',
    batizado_aguas: false,
    data_batismo: '',
  });

  const { 
    isSupported: pushSupported, 
    isSubscribed: pushEnabled, 
    isLoading: pushLoading,
    permission: pushPermission,
    toggleSubscription 
  } = usePushNotifications();

  // Load profile data
  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        nome: p.nome || '',
        cpf: p.cpf || '',
        data_nascimento: p.data_nascimento || '',
        telefone: p.telefone || '',
        sexo: p.sexo || '',
        estado_civil: p.estado_civil || '',
        naturalidade: p.naturalidade || '',
        cep: p.cep || '',
        logradouro: p.logradouro || '',
        numero: p.numero || '',
        complemento: p.complemento || '',
        bairro: p.bairro || '',
        cidade: p.cidade || '',
        uf: p.uf || '',
        grau_instrucao: p.grau_instrucao || '',
        formacao: p.formacao || '',
        profissao: p.profissao || '',
        pcd: p.pcd || '',
        batizado_aguas: p.batizado_aguas || false,
        data_batismo: p.data_batismo || '',
      });
    }
  }, [profile]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
        complemento: data.complemento || prev.complemento,
      }));
      toast.success('Endereço preenchido automaticamente');
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepBlur = () => {
    if (formData.cep.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(formData.cep);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validation
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast.error('CPF inválido');
      return;
    }
    if (!formData.data_nascimento) {
      toast.error('Data de nascimento é obrigatória');
      return;
    }
    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      toast.error('Telefone inválido');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''),
          data_nascimento: formData.data_nascimento || null,
          telefone: formData.telefone || null,
          sexo: formData.sexo || null,
          estado_civil: formData.estado_civil || null,
          naturalidade: formData.naturalidade || null,
          cep: formData.cep.replace(/\D/g, '') || null,
          logradouro: formData.logradouro || null,
          numero: formData.numero || null,
          complemento: formData.complemento || null,
          bairro: formData.bairro || null,
          cidade: formData.cidade || null,
          uf: formData.uf || null,
          grau_instrucao: formData.grau_instrucao || null,
          formacao: formData.formacao || null,
          profissao: formData.profissao || null,
          pcd: formData.pcd || null,
          batizado_aguas: formData.batizado_aguas,
          data_batismo: formData.batizado_aguas && formData.data_batismo ? formData.data_batismo : null,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('profiles_cpf_unique')) {
        toast.error('Este CPF já está cadastrado');
      } else {
        toast.error('Erro ao atualizar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePushToggle = async () => {
    await toggleSubscription();
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Header */}
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

      {/* Profile Form */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="text-destructive">*</span>
              <span>Campos obrigatórios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    className="pl-10"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cpf"
                    className="pl-10"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="email">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    className="pl-10 bg-muted"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    className="pl-10"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Optional Fields - Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sexo">Gênero</Label>
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

              <div className="space-y-2">
                <Label htmlFor="estado_civil">Estado Civil</Label>
                <Select value={formData.estado_civil} onValueChange={(v) => setFormData({ ...formData, estado_civil: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CIVIS.map((ec) => (
                      <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="naturalidade">Naturalidade</Label>
                <Input
                  id="naturalidade"
                  value={formData.naturalidade}
                  onChange={(e) => setFormData({ ...formData, naturalidade: e.target.value })}
                  placeholder="Cidade/Estado de nascimento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pcd">PCD (Pessoa com Deficiência)</Label>
                <Select value={formData.pcd} onValueChange={(v) => setFormData({ ...formData, pcd: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PCD.map((pcd) => (
                      <SelectItem key={pcd.value} value={pcd.value}>{pcd.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Nº"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Select value={formData.uf} onValueChange={(v) => setFormData({ ...formData, uf: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Education & Work */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Formação e Trabalho
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grau_instrucao">Grau de Instrução</Label>
                <Select value={formData.grau_instrucao} onValueChange={(v) => setFormData({ ...formData, grau_instrucao: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAUS_INSTRUCAO.map((gi) => (
                      <SelectItem key={gi.value} value={gi.value}>{gi.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formacao">Formação</Label>
                <Input
                  id="formacao"
                  value={formData.formacao}
                  onChange={(e) => setFormData({ ...formData, formacao: e.target.value })}
                  placeholder="Ex: Administração, Engenharia..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profissao" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Profissão
                </Label>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  placeholder="Sua profissão atual"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Church Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Church className="w-4 h-4" />
              Informações da Igreja
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batizado nas Águas</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="batizado_aguas"
                    checked={formData.batizado_aguas}
                    onCheckedChange={(checked) => setFormData({ ...formData, batizado_aguas: checked })}
                  />
                  <Label htmlFor="batizado_aguas" className="font-normal">
                    {formData.batizado_aguas ? 'Sim' : 'Não'}
                  </Label>
                </div>
              </div>

              {formData.batizado_aguas && (
                <div className="space-y-2">
                  <Label htmlFor="data_batismo">Data do Batismo</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="data_batismo"
                      type="date"
                      className="pl-10"
                      value={formData.data_batismo}
                      onChange={(e) => setFormData({ ...formData, data_batismo: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
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
