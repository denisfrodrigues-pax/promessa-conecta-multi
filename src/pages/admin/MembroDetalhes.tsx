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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Save, Upload, MessageCircle, User, Phone, Mail, MapPin,
  Calendar, Heart, Clock, Home, Users, AlertCircle, Plus, History, Link2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatPhoneBR, cleanPhone } from '@/lib/formatters';

/**
 * ARQUITETURA DE DADOS: PROFILES vs MEMBROS
 *
 * - profiles: tabela de DADOS PESSOAIS (fonte primária quando há vínculo)
 *   → nome, email, telefone, data_nascimento, endereco, estado_civil, data_batismo, foto_url
 *
 * - membros: tabela de DADOS ADMINISTRATIVOS/ECLESIÁSTICOS
 *   → status, observacoes, data_registro
 *   → O campo 'nome' existe apenas como fallback técnico (quando user_id = null)
 *
 * Quando membros.user_id existe:
 *   → Dados pessoais são exibidos de profiles (NÃO de membros)
 *   → Dados pessoais são editáveis APENAS pelo usuário no seu perfil
 *   → Admin pode editar apenas dados administrativos (status, observacoes)
 *
 * @see src/pages/member/Perfil.tsx para edição de dados pessoais pelo usuário
 */
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
  user_id: string | null;
}

interface ProfileData {
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  sexo: string | null;
  data_nascimento: string | null;
  naturalidade: string | null;
  foto_url: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  estado_civil: string | null;
  grau_instrucao: string | null;
  formacao: string | null;
  profissao: string | null;
  pcd: string | null;
  batizado_aguas: boolean | null;
  data_batismo: string | null;
  data_cadastro: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const formatEnderecoFromProfile = (profile: ProfileData): string => {
  const parts: string[] = [];
  if (profile.logradouro) {
    let endereco = profile.logradouro;
    if (profile.numero) endereco += `, ${profile.numero}`;
    if (profile.complemento) endereco += ` - ${profile.complemento}`;
    parts.push(endereco);
  }
  if (profile.bairro) parts.push(profile.bairro);
  if (profile.cidade) {
    let cidadeUf = profile.cidade;
    if (profile.uf) cidadeUf += `/${profile.uf}`;
    parts.push(cidadeUf);
  }
  if (profile.cep) parts.push(`CEP: ${profile.cep}`);
  return parts.join(' - ') || '';
};

const sexoLabels: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
};

const estadoCivilLabels: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
};

const grauInstrucaoLabels: Record<string, string> = {
  fundamental_incompleto: 'Fundamental Incompleto',
  fundamental_completo: 'Fundamental Completo',
  medio_incompleto: 'Médio Incompleto',
  medio_completo: 'Médio Completo',
  superior_incompleto: 'Superior Incompleto',
  superior_completo: 'Superior Completo',
  pos_graduacao: 'Pós-Graduação',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
};

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

const estadoCivilOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

const SITUACAO_MIN_OPTIONS = [
  { value: 'ativo', label: 'Membro Ativo' },
  { value: 'em_disciplina', label: 'Membro em Disciplina' },
  { value: 'frequentador', label: 'Frequentador' },
];

const ORDENACAO_MIN_OPTIONS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'pastor_parcial', label: 'Pastor Tempo Parcial' },
  { value: 'pastor_integral', label: 'Pastor Tempo Integral' },
  { value: 'missionaria_parcial', label: 'Missionária Tempo Parcial' },
  { value: 'missionaria_integral', label: 'Missionária Tempo Integral' },
  { value: 'presbitero', label: 'Presbítero' },
  { value: 'diacono', label: 'Diácono(isa)' },
  { value: 'jubilado', label: 'Jubilado(a)' },
];

const ORIGEM_MIN_OPTIONS = [
  { value: 'promessista_nato', label: 'Promessista Nato' },
  { value: 'transferencia_denominacao', label: 'Transferência de outra denominação' },
  { value: 'transferencia_iap', label: 'Transferência de outra IAP' },
  { value: 'neopentecostal', label: 'Igreja Neopentecostal' },
  { value: 'reformada', label: 'Igreja Reformada' },
  { value: 'pentecostal', label: 'Pentecostal' },
  { value: 'sabatista', label: 'Sabatista' },
  { value: 'catolica', label: 'Igreja Católica' },
  { value: 'outras_religioes', label: 'Outras religiões' },
  { value: 'sem_religiao', label: 'Sem religião anterior' },
];

const hasValidPhone = (phone: string | null | undefined): boolean => {
  return cleanPhone(phone || null).length >= 10;
};

const getWhatsAppUrl = (phone: string | null | undefined): string => {
  const cleaned = cleanPhone(phone || null);
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
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('pessoal');

  const isLinkedToProfile = membro?.user_id !== null && profileData !== null;

  const [baseAtual, setBaseAtual] = useState<BaseMembroAtivo | null>(null);
  const [historico, setHistorico] = useState<Acompanhamento[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

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

  const [ministerialData, setMinisterialData] = useState({
    situacao_ministerial: 'ativo',
    data_situacao_inicio: '',
    data_situacao_fim: '',
    situacao_observacao: '',
    origem_membro: '',
    igreja_anterior: '',
    data_recebimento: '',
    batismo_nas_aguas: false,
    data_batismo_agua: '',
    local_batismo: '',
    pastor_oficiante: '',
    batismo_espirito_santo: false,
    data_batismo_espirito: '',
    ordenacao_funcao: 'nenhum',
    data_ordenacao_inicio: '',
    data_ordenacao_fim: '',
    ordenacao_observacao: '',
    observacoes_pastorais: '',
    estado_civil: '',
    nome_mae: '',
    nome_pai: '',
    pai_mae_promessista: false,
    pais: 'Brasil',
    curso: '',
  });

  const setMin = (field: string, value: unknown) =>
    setMinisterialData((prev) => ({ ...prev, [field]: value }));

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
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Membro não encontrado');
        navigate('/admin/membros');
        return;
      }

      setMembro(data);

      let profile: ProfileData | null = null;
      if (data.user_id) {
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .select(`
            nome, email, telefone, cpf, sexo, data_nascimento, naturalidade, foto_url,
            logradouro, numero, complemento, bairro, cidade, uf, cep,
            estado_civil, grau_instrucao, formacao, profissao, pcd,
            batizado_aguas, data_batismo, data_cadastro,
            created_at, updated_at
          `)
          .eq('id', data.user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Erro ao buscar perfil vinculado:', profileError);
        }

        if (profileResult) {
          profile = profileResult;
          setProfileData(profile);
        }
      }

      const combinedNome = profile?.nome || data.nome || '';
      const combinedEmail = profile?.email || data.email || '';
      const combinedTelefone = profile?.telefone || data.telefone || '';
      const combinedNascimento = profile?.data_nascimento || data.data_nascimento || '';
      const combinedEndereco = profile
        ? formatEnderecoFromProfile(profile)
        : (data.endereco || '');
      const combinedEstadoCivil = profile?.estado_civil || data.estado_civil || '';
      const combinedBatismo = profile?.data_batismo || data.data_batismo || '';
      const combinedFoto = profile?.foto_url || data.foto_perfil;

      setFormData({
        nome: combinedNome,
        telefone: combinedTelefone,
        email: combinedEmail,
        data_nascimento: combinedNascimento,
        endereco: combinedEndereco,
        estado_civil: combinedEstadoCivil,
        data_batismo: combinedBatismo,
        status: data.status || 'ativo',
        observacoes: data.observacoes || '',
      });

      setMinisterialData({
        situacao_ministerial: (data as any).situacao_ministerial || 'ativo',
        data_situacao_inicio: (data as any).data_situacao_inicio || '',
        data_situacao_fim: (data as any).data_situacao_fim || '',
        situacao_observacao: (data as any).situacao_observacao || '',
        origem_membro: (data as any).origem_membro || '',
        igreja_anterior: (data as any).igreja_anterior || '',
        data_recebimento: (data as any).data_recebimento || '',
        batismo_nas_aguas: Boolean((data as any).data_batismo_agua),
        data_batismo_agua: (data as any).data_batismo_agua || '',
        local_batismo: (data as any).local_batismo || '',
        pastor_oficiante: (data as any).pastor_oficiante || '',
        batismo_espirito_santo: (data as any).batismo_espirito_santo || false,
        data_batismo_espirito: (data as any).data_batismo_espirito || '',
        ordenacao_funcao: (data as any).ordenacao_funcao || 'nenhum',
        data_ordenacao_inicio: (data as any).data_ordenacao_inicio || '',
        data_ordenacao_fim: (data as any).data_ordenacao_fim || '',
        ordenacao_observacao: (data as any).ordenacao_observacao || '',
        observacoes_pastorais: (data as any).observacoes_pastorais || '',
        estado_civil: data.estado_civil || '',
        nome_mae: (data as any).nome_mae || '',
        nome_pai: (data as any).nome_pai || '',
        pai_mae_promessista: (data as any).pai_mae_promessista || false,
        pais: (data as any).pais || 'Brasil',
        curso: (data as any).curso || '',
      });
      setFotoPreview(combinedFoto);
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
        .select(`base_id, bases!inner(id, nome, dia_semana, horario, local, capacidade, lider_id)`)
        .eq('membro_id', id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (data && data.bases) {
        const base = data.bases as unknown as Base;
        let lider: Lider | null = null;
        if (base.lider_id) {
          const { data: liderData } = await supabase
            .from('membros')
            .select('id, nome, telefone')
            .eq('id', base.lider_id)
            .maybeSingle();
          lider = liderData;
        }
        const { count } = await supabase
          .from('bases_membros')
          .select('*', { count: 'exact', head: true })
          .eq('base_id', base.id)
          .eq('status', 'ativo');

        setBaseAtual({ base_id: data.base_id, base: { ...base, lider, membros_count: count || 0 } });
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
      const { data: basesData } = await supabase
        .from('bases_membros')
        .select(`id, created_at, status, observacao, bases(id, nome, dia_semana, horario, local, capacidade, lider_id)`)
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
              .maybeSingle();
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
            base: { ...base, lider, membros_count: count || 0 },
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
            .maybeSingle();
          lider = liderData;
        }
        const { count } = await supabase
          .from('bases_membros')
          .select('*', { count: 'exact', head: true })
          .eq('base_id', base.id)
          .eq('status', 'ativo');
        basesComInfo.push({ ...base, lider, membros_count: count || 0 });
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
      const { data: urlData } = supabase.storage.from('membros_fotos').getPublicUrl(fileName);
      return urlData.publicUrl + `?t=${Date.now()}`;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isLinkedToProfile && !formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        status: formData.status,
        observacoes: formData.observacoes.trim() || null,
        situacao_ministerial: ministerialData.situacao_ministerial || null,
        data_situacao_inicio: ministerialData.data_situacao_inicio || null,
        data_situacao_fim: ministerialData.data_situacao_fim || null,
        situacao_observacao: ministerialData.situacao_observacao.trim() || null,
        origem_membro: ministerialData.origem_membro || null,
        igreja_anterior: ministerialData.igreja_anterior.trim() || null,
        data_recebimento: ministerialData.data_recebimento || null,
        data_batismo_agua: ministerialData.batismo_nas_aguas ? (ministerialData.data_batismo_agua || null) : null,
        local_batismo: ministerialData.batismo_nas_aguas ? (ministerialData.local_batismo.trim() || null) : null,
        pastor_oficiante: ministerialData.batismo_nas_aguas ? (ministerialData.pastor_oficiante.trim() || null) : null,
        batismo_espirito_santo: ministerialData.batismo_espirito_santo,
        data_batismo_espirito: ministerialData.batismo_espirito_santo ? (ministerialData.data_batismo_espirito || null) : null,
        ordenacao_funcao: ministerialData.ordenacao_funcao || 'nenhum',
        data_ordenacao_inicio: ministerialData.data_ordenacao_inicio || null,
        data_ordenacao_fim: ministerialData.data_ordenacao_fim || null,
        ordenacao_observacao: ministerialData.ordenacao_observacao.trim() || null,
        observacoes_pastorais: ministerialData.observacoes_pastorais.trim() || null,
        estado_civil: ministerialData.estado_civil || null,
        nome_mae: ministerialData.nome_mae.trim() || null,
        nome_pai: ministerialData.nome_pai.trim() || null,
        pai_mae_promessista: ministerialData.pai_mae_promessista,
        pais: ministerialData.pais || null,
        curso: ministerialData.curso.trim() || null,
      };

      if (!isLinkedToProfile) {
        let fotoUrl = membro?.foto_perfil;
        if (fotoFile) {
          const newUrl = await uploadFoto();
          if (newUrl) fotoUrl = newUrl;
        }
        Object.assign(updateData, {
          nome: formData.nome.trim(),
          telefone: cleanPhone(formData.telefone) || null,
          email: formData.email.trim() || null,
          data_nascimento: formData.data_nascimento || null,
          endereco: formData.endereco.trim() || null,
          data_batismo: formData.data_batismo || null,
          foto_perfil: fotoUrl,
        });
      }

      const { error } = await supabase.from('membros').update(updateData).eq('id', id);
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
      if (baseAtual) {
        await supabase
          .from('bases_membros')
          .update({ status: 'saida', data_saida: new Date().toISOString() })
          .eq('membro_id', id)
          .eq('status', 'ativo');
      }
      const { error } = await supabase.from('bases_membros').insert({
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
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
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

  const displayName = isLinkedToProfile ? (profileData?.nome || membro.nome) : membro.nome;
  const displayPhone = isLinkedToProfile ? profileData?.telefone : membro.telefone;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/membros')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">
                {isLinkedToProfile ? (profileData?.email || '–') : (formData.email || '–')}
              </p>
            </div>
            {hasValidPhone(displayPhone) && (
              <button
                onClick={() => window.open(getWhatsAppUrl(displayPhone), '_blank')}
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
              {isBaseLotada(baseAtual.base) && <Badge variant="destructive">Lotada</Badge>}
            </>
          )}
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsEditing(false); fetchMembro(); setFotoFile(null); }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Incomplete profile banner */}
      {!isLinkedToProfile && (() => {
        const missing: string[] = [];
        if (!formData.telefone) missing.push('telefone');
        if (!formData.data_nascimento) missing.push('data de nascimento');
        if (missing.length === 0) return null;
        return (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600 px-4 py-3 text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-yellow-500" />
            <div className="flex-1 text-sm">
              <span className="font-medium">Cadastro incompleto:</span>{' '}
              faltam {missing.join(' e ')}.
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-300 dark:hover:bg-yellow-900/40 shrink-0"
              onClick={() => { setIsEditing(true); setActiveTab('pessoal'); }}
            >
              Completar cadastro
            </Button>
          </div>
        );
      })()}

      {/* ── Info Cards ── */}
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
                <p className="text-sm text-muted-foreground">Batismo nas Águas</p>
                <p className="font-medium">
                  {ministerialData.data_batismo_agua
                    ? formatDate(ministerialData.data_batismo_agua)
                    : (isLinkedToProfile && profileData?.batizado_aguas
                        ? (profileData.data_batismo ? formatDate(profileData.data_batismo) : 'Batizado')
                        : 'Não batizado')}
                </p>
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
                <p className="font-medium">
                  {displayPhone ? formatPhoneBR(displayPhone) : '–'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Base Atual ── */}
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
                      <button onClick={() => window.open(getWhatsAppUrl(baseAtual.base.lider!.telefone), '_blank')} className="text-green-600 hover:text-green-700">
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
                  {isBaseLotada(baseAtual.base) && <Badge variant="destructive" className="text-xs">Lotada</Badge>}
                </div>
                <Progress value={getOcupacaoPercent(baseAtual.base)} className="w-24 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleOpenBaseModal}>
          <Plus className="w-4 h-4 mr-2" />
          {baseAtual ? 'Trocar Base' : 'Vincular à Base'}
        </Button>
      </div>

      {/* ══════════════════════════════════════════
          TABS
      ══════════════════════════════════════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="familia">Família</TabsTrigger>
          <TabsTrigger value="ministerial">Ministerial</TabsTrigger>
          <TabsTrigger value="batismo">Batismo</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        {/* ── TAB: PESSOAL ── */}
        <TabsContent value="pessoal" className="mt-6">
          {isLinkedToProfile && profileData ? (
            <div className="space-y-6">
              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-1">Membro vinculado a uma conta de usuário</p>
                    <p className="text-sm text-blue-700 mb-3">
                      Os dados pessoais são gerenciados pelo próprio usuário em seu perfil.
                      Aqui você pode editar apenas as informações administrativas e ministeriais.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/usuarios')}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Abrir perfil do usuário
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Photo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Foto de Perfil
                      <Badge variant="secondary" className="text-xs font-normal">perfil</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-3">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profileData.foto_url || undefined} alt={profileData.nome} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {getInitials(profileData.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground text-center">Gerenciada pelo usuário</p>
                  </CardContent>
                </Card>

                {/* Personal data (read-only) */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4" />
                      Dados Pessoais
                      <Badge variant="secondary" className="text-xs font-normal">perfil</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Nome Completo</Label>
                        <p className="font-medium">{profileData.nome || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">E-mail</Label>
                        <p className="font-medium">{profileData.email || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Telefone</Label>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{formatPhoneBR(profileData.telefone) || '–'}</p>
                          {hasValidPhone(profileData.telefone) && (
                            <button
                              onClick={() => window.open(getWhatsAppUrl(profileData.telefone), '_blank')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">CPF</Label>
                        <p className="font-medium">{profileData.cpf || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Data de Nascimento</Label>
                        <p className="font-medium">
                          {profileData.data_nascimento ? formatDate(profileData.data_nascimento) : '–'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Sexo</Label>
                        <p className="font-medium">
                          {profileData.sexo ? (sexoLabels[profileData.sexo] || profileData.sexo) : '–'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Naturalidade</Label>
                        <p className="font-medium">{profileData.naturalidade || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Estado Civil (perfil)</Label>
                        <p className="font-medium">
                          {profileData.estado_civil
                            ? (estadoCivilLabels[profileData.estado_civil] || profileData.estado_civil)
                            : '–'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estado Civil editable by admin */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    Estado Civil
                    <Badge variant="default" className="text-xs font-normal">editável pelo admin</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-w-xs">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Estado Civil (registro ministerial)
                    </Label>
                    <Select
                      value={ministerialData.estado_civil || 'none'}
                      onValueChange={(v) => setMin('estado_civil', v === 'none' ? '' : v)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não informado</SelectItem>
                        {estadoCivilOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Unlinked member: fully editable */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Foto</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={fotoPreview || undefined} alt={formData.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {getInitials(formData.nome)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <Label htmlFor="foto" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4" />
                          Trocar foto
                        </div>
                        <Input id="foto" type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                      </Label>
                      <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Editable fields */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formatPhoneBR(formData.telefone)}
                        onChange={(e) => setFormData({ ...formData, telefone: formatPhoneBR(e.target.value) })}
                        disabled={!isEditing}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado Civil</Label>
                      <Select
                        value={ministerialData.estado_civil || 'none'}
                        onValueChange={(v) => setMin('estado_civil', v === 'none' ? '' : v)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não informado</SelectItem>
                          {estadoCivilOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_batismo">Data do Batismo</Label>
                      <Input
                        id="data_batismo"
                        type="date"
                        value={formData.data_batismo}
                        onChange={(e) => setFormData({ ...formData, data_batismo: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: ENDEREÇO ── */}
        <TabsContent value="endereco" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4" />
                Endereço
                {isLinkedToProfile && (
                  <Badge variant="secondary" className="text-xs font-normal">perfil</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLinkedToProfile && profileData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {!profileData.logradouro && !profileData.cidade && (
                    <p className="text-sm text-muted-foreground md:col-span-3">
                      Endereço não informado pelo usuário
                    </p>
                  )}
                  {(profileData.logradouro || profileData.cidade) && (
                    <>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-muted-foreground text-xs">Logradouro</Label>
                        <p className="font-medium">
                          {profileData.logradouro || '–'}
                          {profileData.numero && `, ${profileData.numero}`}
                          {profileData.complemento && ` - ${profileData.complemento}`}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">CEP</Label>
                        <p className="font-medium">{profileData.cep || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Bairro</Label>
                        <p className="font-medium">{profileData.bairro || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Cidade</Label>
                        <p className="font-medium">{profileData.cidade || '–'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Estado</Label>
                        <p className="font-medium">{profileData.uf || '–'}</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">País</Label>
                    <p className="font-medium">{ministerialData.pais || '–'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Rua, número, bairro, cidade, estado"
                    />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <Label>País</Label>
                    <Input
                      value={ministerialData.pais}
                      onChange={(e) => setMin('pais', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: FAMÍLIA ── */}
        <TabsContent value="familia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" />
                Dados da Família
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Mãe</Label>
                  <Input
                    value={ministerialData.nome_mae}
                    onChange={(e) => setMin('nome_mae', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Nome completo da mãe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Pai</Label>
                  <Input
                    value={ministerialData.nome_pai}
                    onChange={(e) => setMin('nome_pai', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Nome completo do pai"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Switch
                      checked={ministerialData.pai_mae_promessista}
                      onCheckedChange={(v) => setMin('pai_mae_promessista', v)}
                      disabled={!isEditing}
                    />
                    <div>
                      <Label className="cursor-pointer font-medium">Pai ou Mãe é Promessista</Label>
                      <p className="text-xs text-muted-foreground">
                        Pelo menos um dos pais é membro da Igreja da Promessa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: MINISTERIAL ── */}
        <TabsContent value="ministerial" className="mt-6 space-y-6">
          {/* Situação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="w-4 h-4 text-primary" />
                Situação Ministerial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Select
                    value={ministerialData.situacao_ministerial}
                    onValueChange={(v) => setMin('situacao_ministerial', v)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SITUACAO_MIN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={ministerialData.data_situacao_inicio}
                    onChange={(e) => setMin('data_situacao_inicio', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={ministerialData.data_situacao_fim}
                    onChange={(e) => setMin('data_situacao_fim', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observação</Label>
                  <Textarea
                    value={ministerialData.situacao_observacao}
                    onChange={(e) => setMin('situacao_observacao', e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="Observações sobre a situação ministerial..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Origem e Ingresso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Origem e Ingresso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Como chegou à Igreja</Label>
                  <Select
                    value={ministerialData.origem_membro || 'none'}
                    onValueChange={(v) => setMin('origem_membro', v === 'none' ? '' : v)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não informado</SelectItem>
                      {ORIGEM_MIN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {ministerialData.origem_membro && ministerialData.origem_membro !== 'promessista_nato' && (
                  <div className="space-y-2">
                    <Label>Igreja Anterior</Label>
                    <Input
                      value={ministerialData.igreja_anterior}
                      onChange={(e) => setMin('igreja_anterior', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Nome da igreja anterior"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Data de Recebimento</Label>
                  <Input
                    type="date"
                    value={ministerialData.data_recebimento}
                    onChange={(e) => setMin('data_recebimento', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Curso</Label>
                  <Input
                    value={ministerialData.curso}
                    onChange={(e) => setMin('curso', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Curso de graduação ou técnico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ordenação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordenação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select
                    value={ministerialData.ordenacao_funcao}
                    onValueChange={(v) => setMin('ordenacao_funcao', v)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDENACAO_MIN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={ministerialData.data_ordenacao_inicio}
                    onChange={(e) => setMin('data_ordenacao_inicio', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término (opcional)</Label>
                  <Input
                    type="date"
                    value={ministerialData.data_ordenacao_fim}
                    onChange={(e) => setMin('data_ordenacao_fim', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observação</Label>
                  <Textarea
                    value={ministerialData.ordenacao_observacao}
                    onChange={(e) => setMin('ordenacao_observacao', e.target.value)}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="Observações sobre a ordenação..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formação (linked profiles only) */}
          {isLinkedToProfile && profileData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Formação e Profissão
                  <Badge variant="secondary" className="text-xs font-normal">perfil</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Escolaridade</Label>
                    <p className="font-medium">
                      {profileData.grau_instrucao
                        ? (grauInstrucaoLabels[profileData.grau_instrucao] || profileData.grau_instrucao)
                        : '–'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Formação</Label>
                    <p className="font-medium">{profileData.formacao || '–'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Profissão</Label>
                    <p className="font-medium">{profileData.profissao || '–'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações Pastorais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações Pastorais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={ministerialData.observacoes_pastorais}
                onChange={(e) => setMin('observacoes_pastorais', e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Informações confidenciais de acompanhamento pastoral..."
              />
            </CardContent>
          </Card>

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
                  {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
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
                            <p className="text-sm text-muted-foreground">Líder: {item.base.lider.nome}</p>
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
                            <p className="text-sm mt-1 italic text-muted-foreground">"{item.observacao}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
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
        </TabsContent>

        {/* ── TAB: BATISMO ── */}
        <TabsContent value="batismo" className="mt-6 space-y-6">
          {/* Batismo nas Águas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-blue-600" />
                Batismo nas Águas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Switch
                  checked={ministerialData.batismo_nas_aguas}
                  onCheckedChange={(v) => {
                    setMin('batismo_nas_aguas', v);
                    if (!v) {
                      setMin('data_batismo_agua', '');
                      setMin('local_batismo', '');
                      setMin('pastor_oficiante', '');
                    }
                  }}
                  disabled={!isEditing}
                />
                <Label className="cursor-pointer font-medium">Batizado(a) nas Águas</Label>
              </div>
              {ministerialData.batismo_nas_aguas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Data do Batismo</Label>
                    <Input
                      type="date"
                      value={ministerialData.data_batismo_agua}
                      onChange={(e) => setMin('data_batismo_agua', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local do Batismo</Label>
                    <Input
                      value={ministerialData.local_batismo}
                      onChange={(e) => setMin('local_batismo', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Local onde foi batizado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pastor Oficiante</Label>
                    <Input
                      value={ministerialData.pastor_oficiante}
                      onChange={(e) => setMin('pastor_oficiante', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Nome do pastor"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batismo no Espírito Santo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="w-4 h-4 text-purple-600" />
                Batismo no Espírito Santo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Switch
                  checked={ministerialData.batismo_espirito_santo}
                  onCheckedChange={(v) => {
                    setMin('batismo_espirito_santo', v);
                    if (!v) setMin('data_batismo_espirito', '');
                  }}
                  disabled={!isEditing}
                />
                <Label className="cursor-pointer font-medium">Recebeu o Batismo no Espírito Santo</Label>
              </div>
              {ministerialData.batismo_espirito_santo && (
                <div className="max-w-xs pt-2">
                  <div className="space-y-2">
                    <Label>Data do Batismo no Espírito Santo</Label>
                    <Input
                      type="date"
                      value={ministerialData.data_batismo_espirito}
                      onChange={(e) => setMin('data_batismo_espirito', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: CONTA ── */}
        <TabsContent value="conta" className="mt-6 space-y-6">
          {/* Status Administrativo */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-4 h-4" />
                Dados Administrativos
                <Badge variant="default" className="text-xs font-normal">editável</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status do Membro</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="desligado">Desligado</SelectItem>
                      <SelectItem value="transferido">Transferido</SelectItem>
                      <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Membro desde</Label>
                  <p className="font-medium pt-2">{formatDate(membro.data_registro || membro.created_at)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações Administrativas</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Observações internas sobre o membro..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Linked profile info */}
          {isLinkedToProfile && profileData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="w-4 h-4" />
                  Conta de Usuário Vinculada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">E-mail da conta</Label>
                    <p className="font-medium">{profileData.email || '–'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Data de Cadastro</Label>
                    <p className="font-medium">
                      {profileData.data_cadastro ? formatDate(profileData.data_cadastro) : '–'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Conta criada em</Label>
                    <p className="font-medium">
                      {profileData.created_at ? formatDate(profileData.created_at) : '–'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/usuarios')}
                >
                  <User className="w-3 h-3 mr-1" />
                  Gerenciar usuário
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modal Vincular Base ── */}
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
            <Button variant="outline" onClick={() => setShowBaseModal(false)}>Cancelar</Button>
            <Button onClick={handleVincularBase} disabled={!selectedBaseId || savingBase}>
              {savingBase ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
