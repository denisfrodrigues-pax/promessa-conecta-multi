import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, Save, Upload, MessageCircle, User, Phone, Mail, MapPin, 
  Calendar, Heart, Clock, Home, Users, AlertCircle, Plus, History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatPhoneBR, cleanPhone } from '@/lib/formatters';

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  estado_civil: string | null;
  data_batismo: string | null;
  foto_perfil: string | null;
  data_registro: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
}

interface Base {
  id: string;
  nome: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  lider_id: string | null;
}

interface Lider {
  id: string;
  nome: string;
  telefone: string | null;
}

interface BaseComLider extends Base {
  lider?: Lider | null;
  membros_count?: number;
}

interface Acompanhamento {
  id: string;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  base: BaseComLider | null;
}

interface BaseMembroAtivo {
  base_id: string;
  base: BaseComLider;
}

// Status config - same as other modules
const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  desligado: 'Desligado',
  transferido: 'Transferido',
  em_acompanhamento: 'Em Acompanhamento',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 border-green-300',
  inativo: 'bg-gray-100 text-gray-800 border-gray-300',
  desligado: 'bg-red-100 text-red-800 border-red-300',
  transferido: 'bg-orange-100 text-orange-800 border-orange-300',
  em_acompanhamento: 'bg-blue-100 text-blue-800 border-blue-300',
};

const acompStatusLabels: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const acompStatusColors: Record<string, string> = {
  novo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

const estadoCivilOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

// Helper functions (cleanPhone imported from formatters)
const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  const msg = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato :)');
  return `https://wa.me/55${cleaned}?text=${msg}`;
};

const formatDateTime = (date: string | null) => {
  if (!date) return '–';
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const formatDate = (date: string | null) => {
  if (!date) return '–';
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

const getInitials = (nome: string) => {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const isBaseLotada = (base: BaseComLider | null): boolean => {
  if (!base || !base.capacidade) return false;
  return (base.membros_count || 0) >= base.capacidade;
};

const getOcupacaoPercent = (base: BaseComLider | null): number => {
  if (!base || !base.capacidade) return 0;
  return Math.min(100, Math.round(((base.membros_count || 0) / base.capacidade) * 100));
};

export default function MembroDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  
  // Base atual
  const [baseAtual, setBaseAtual] = useState<BaseMembroAtivo | null>(null);
  
  // Histórico
  const [historico, setHistorico] = useState<Acompanhamento[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  
  // Modal vincular base
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [basesDisponiveis, setBasesDisponiveis] = useState<BaseComLider[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('em_acompanhamento');
  const [observacao, setObservacao] = useState('');
  const [savingBase, setSavingBase] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    estado_civil: '',
    data_batismo: '',
    status: 'ativo',
    observacoes: '',
  });

  useEffect(() => {
    if (id) {
      fetchMembro();
      fetchBaseAtual();
      fetchHistorico();
    }
  }, [id]);

  const fetchMembro = async () => {
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setMembro(data);
      setFormData({
        nome: data.nome || '',
        telefone: data.telefone || '',
        email: data.email || '',
        data_nascimento: data.data_nascimento || '',
        endereco: data.endereco || '',
        estado_civil: data.estado_civil || '',
        data_batismo: data.data_batismo || '',
        status: data.status || 'ativo',
        observacoes: data.observacoes || '',
      });
      setFotoPreview(data.foto_perfil);
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      toast.error('Erro ao carregar dados do membro');
      navigate('/admin/membros');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseAtual = async () => {
    try {
      const { data } = await supabase
        .from('bases_membros')
        .select(`
          base_id,
          bases!inner(id, nome, dia_semana, horario, local, capacidade, lider_id)
        `)
        .eq('membro_id', id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (data && data.bases) {
        const base = data.bases as unknown as Base;
        
        // Get leader info
        let lider: Lider | null = null;
        if (base.lider_id) {
          const { data: liderData } = await supabase
            .from('membros')
            .select('id, nome, telefone')
            .eq('id', base.lider_id)
            .single();
          lider = liderData;
        }

        // Get members count
        const { count } = await supabase
          .from('bases_membros')
          .select('*', { count: 'exact', head: true })
          .eq('base_id', base.id)
          .eq('status', 'ativo');

        setBaseAtual({
          base_id: data.base_id,
          base: {
            ...base,
            lider,
            membros_count: count || 0
          }
        });
      } else {
        setBaseAtual(null);
      }
    } catch (error) {
      console.error('Erro ao buscar base atual:', error);
    }
  };

  const fetchHistorico = async () => {
    setLoadingHistorico(true);
    try {
      // Fetch acompanhamentos for this member
      // Note: acompanhamentos uses visitante_id, not membro_id
      // We'll need to check if there's a link or just show bases_membros history
      
      const { data: basesData } = await supabase
        .from('bases_membros')
        .select(`
          id, created_at, status, observacao,
          bases(id, nome, dia_semana, horario, local, capacidade, lider_id)
        `)
        .eq('membro_id', id)
        .order('created_at', { ascending: false });

      if (basesData) {
        const historicoFormatado: Acompanhamento[] = [];
        
        for (const item of basesData) {
          const base = item.bases as unknown as Base | null;
          if (!base) continue;

          let lider: Lider | null = null;
          if (base.lider_id) {
            const { data: liderData } = await supabase
              .from('membros')
              .select('id, nome, telefone')
              .eq('id', base.lider_id)
              .single();
            lider = liderData;
          }

          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');

          historicoFormatado.push({
            id: item.id,
            status: item.status || 'ativo',
            observacao: item.observacao,
            created_at: item.created_at || '',
            updated_at: item.created_at || '',
            base: {
              ...base,
              lider,
              membros_count: count || 0
            }
          });
        }

        setHistorico(historicoFormatado);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const fetchBasesDisponiveis = async () => {
    const { data } = await supabase
      .from('bases')
      .select('id, nome, dia_semana, horario, local, capacidade, lider_id')
      .eq('status', 'ativo')
      .order('nome');

    if (data) {
      const basesComInfo: BaseComLider[] = [];
      for (const base of data) {
        let lider: Lider | null = null;
        if (base.lider_id) {
          const { data: liderData } = await supabase
            .from('membros')
            .select('id, nome, telefone')
            .eq('id', base.lider_id)
            .single();
          lider = liderData;
        }

        const { count } = await supabase
          .from('bases_membros')
          .select('*', { count: 'exact', head: true })
          .eq('base_id', base.id)
          .eq('status', 'ativo');

        basesComInfo.push({
          ...base,
          lider,
          membros_count: count || 0
        });
      }
      setBasesDisponiveis(basesComInfo);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFoto = async (): Promise<string | null> => {
    if (!fotoFile || !id) return null;
    try {
      setUploading(true);
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('membros_fotos')
        .upload(fileName, fotoFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('membros_fotos')
        .getPublicUrl(fileName);
      return urlData.publicUrl + `?t=${Date.now()}`;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let fotoUrl = membro?.foto_perfil;
      if (fotoFile) {
        const newUrl = await uploadFoto();
        if (newUrl) fotoUrl = newUrl;
      }

      const { error } = await supabase
        .from('membros')
        .update({
          nome: formData.nome.trim(),
          telefone: cleanPhone(formData.telefone) || null,
          email: formData.email.trim() || null,
          data_nascimento: formData.data_nascimento || null,
          endereco: formData.endereco.trim() || null,
          estado_civil: formData.estado_civil || null,
          data_batismo: formData.data_batismo || null,
          status: formData.status,
          observacoes: formData.observacoes.trim() || null,
          foto_perfil: fotoUrl,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Membro atualizado com sucesso!');
      setIsEditing(false);
      setFotoFile(null);
      fetchMembro();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenBaseModal = () => {
    fetchBasesDisponiveis();
    setSelectedBaseId('');
    setSelectedStatus('em_acompanhamento');
    setObservacao('');
    setShowBaseModal(true);
  };

  const handleVincularBase = async () => {
    if (!selectedBaseId) {
      toast.error('Selecione uma base');
      return;
    }

    setSavingBase(true);
    try {
      // Deactivate current base membership if exists
      if (baseAtual) {
        await supabase
          .from('bases_membros')
          .update({ status: 'saida', data_saida: new Date().toISOString() })
          .eq('membro_id', id)
          .eq('status', 'ativo');
      }

      // Create new base membership
      const { error } = await supabase
        .from('bases_membros')
        .insert({
          membro_id: id,
          base_id: selectedBaseId,
          status: 'ativo',
          observacao: observacao.trim() || null,
        });

      if (error) throw error;

      toast.success('Membro vinculado à base com sucesso!');
      setShowBaseModal(false);
      fetchBaseAtual();
      fetchHistorico();
    } catch (error) {
      console.error('Erro ao vincular base:', error);
      toast.error('Erro ao vincular à base');
    } finally {
      setSavingBase(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!membro) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Membro não encontrado</p>
        <Button onClick={() => navigate('/admin/membros')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/membros')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold">{membro.nome}</h1>
            {hasValidPhone(membro.telefone) && (
              <button
                onClick={() => window.open(getWhatsAppUrl(membro.telefone), '_blank')}
                className="text-green-600 hover:text-green-700"
                title="Abrir WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusColors[formData.status]}>
            {statusLabels[formData.status]}
          </Badge>
          {baseAtual && (
            <>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Home className="w-3 h-3" />
                {baseAtual.base.nome}
              </Badge>
              {isBaseLotada(baseAtual.base) && (
                <Badge variant="destructive">Lotada</Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium">{formatDate(membro.data_registro || membro.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batismo</p>
                <p className="font-medium">{membro.data_batismo ? formatDate(membro.data_batismo) : 'Não batizado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{membro.telefone || '–'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Base Atual Section */}
      {baseAtual && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="w-4 h-4" />
              Base Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-lg">{baseAtual.base.nome}</p>
                {baseAtual.base.lider && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Líder: {baseAtual.base.lider.nome}</span>
                    {hasValidPhone(baseAtual.base.lider.telefone) && (
                      <button
                        onClick={() => window.open(getWhatsAppUrl(baseAtual.base.lider!.telefone), '_blank')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {baseAtual.base.dia_semana && baseAtual.base.horario
                    ? `${baseAtual.base.dia_semana} às ${baseAtual.base.horario}`
                    : baseAtual.base.dia_semana || baseAtual.base.horario || '–'}
                  {baseAtual.base.local && ` • ${baseAtual.base.local}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{baseAtual.base.membros_count || 0}/{baseAtual.base.capacidade || '∞'}</span>
                  {isBaseLotada(baseAtual.base) && (
                    <Badge variant="destructive" className="text-xs">Lotada</Badge>
                  )}
                </div>
                <Progress value={getOcupacaoPercent(baseAtual.base)} className="w-24 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button for Base */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleOpenBaseModal}>
          <Plus className="w-4 h-4 mr-2" />
          {baseAtual ? 'Trocar Base' : 'Vincular à Base'}
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={fotoPreview || undefined} alt={membro.nome} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(membro.nome)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Label htmlFor="foto" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    Trocar foto
                  </div>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </Label>
                <p className="text-xs text-muted-foreground">Máximo 5MB</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do Membro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={formatPhoneBR(formData.telefone)}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhoneBR(e.target.value) })}
                  disabled={!isEditing}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Nascimento
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_civil">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Estado Civil
                </Label>
                <Select
                  value={formData.estado_civil}
                  onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoCivilOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_batismo">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data do Batismo
                </Label>
                <Input
                  id="data_batismo"
                  type="date"
                  value={formData.data_batismo}
                  onChange={(e) => setFormData({ ...formData, data_batismo: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                    <SelectItem value="transferido">Transferido</SelectItem>
                    <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Bases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Bases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro de histórico ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.base?.nome || 'Base não encontrada'}</p>
                        <Badge 
                          variant="outline" 
                          className={item.status === 'ativo' 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : 'bg-gray-100 text-gray-800 border-gray-300'}
                        >
                          {item.status === 'ativo' ? 'Ativo' : item.status === 'saida' ? 'Saiu' : item.status}
                        </Badge>
                      </div>
                      {item.base?.lider && (
                        <p className="text-sm text-muted-foreground">
                          Líder: {item.base.lider.nome}
                        </p>
                      )}
                      {item.base && (
                        <p className="text-sm text-muted-foreground">
                          {item.base.dia_semana && item.base.horario
                            ? `${item.base.dia_semana} às ${item.base.horario}`
                            : item.base.dia_semana || item.base.horario || ''}
                          {item.base.local && ` • ${item.base.local}`}
                        </p>
                      )}
                      {item.observacao && (
                        <p className="text-sm mt-1 italic text-muted-foreground">
                          "{item.observacao}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </p>
                      {item.base && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {item.base.membros_count || 0}/{item.base.capacidade || '∞'}
                          </span>
                          {isBaseLotada(item.base) && (
                            <Badge variant="destructive" className="text-xs ml-1">Lotada</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/admin/membros')}>
          Voltar
        </Button>
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              fetchMembro();
              setFotoFile(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      {/* Modal Vincular Base */}
      <Dialog open={showBaseModal} onOpenChange={setShowBaseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{baseAtual ? 'Trocar Base' : 'Vincular à Base'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione a Base</Label>
              <Select value={selectedBaseId} onValueChange={setSelectedBaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma base" />
                </SelectTrigger>
                <SelectContent>
                  {basesDisponiveis.map(base => (
                    <SelectItem key={base.id} value={base.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{base.nome}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({base.membros_count || 0}/{base.capacidade || '∞'})
                          {isBaseLotada(base) && ' - Lotada'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBaseId && (
              <div className="p-3 bg-muted rounded-lg">
                {(() => {
                  const base = basesDisponiveis.find(b => b.id === selectedBaseId);
                  if (!base) return null;
                  return (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{base.nome}</p>
                      {base.lider && <p>Líder: {base.lider.nome}</p>}
                      <p>{base.dia_semana} às {base.horario}</p>
                      {base.local && <p>{base.local}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={getOcupacaoPercent(base)} className="flex-1 h-2" />
                        <span className="text-xs">{base.membros_count || 0}/{base.capacidade || '∞'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações sobre a vinculação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBaseModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVincularBase} disabled={!selectedBaseId || savingBase}>
              {savingBase ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
