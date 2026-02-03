import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, MessageCircle, Phone, Search, Clock, MapPin, Users, 
  CalendarDays, User, Download, Info, UserCheck, Building2, Pencil, Loader2, Save, ClipboardCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { BaseFotoUpload } from '@/components/base/BaseFotoUpload';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== INTERFACES =====
interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  status: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  visibilidade: string | null;
  data_criacao: string;
  foto_url: string | null;
  anfitrioes: string | null;
  whatsapp_lider: string | null;
  observacoes: string | null;
  lider?: { nome: string; telefone: string | null } | null;
}

interface EditFormData {
  nome: string;
  descricao: string;
  dia_semana: string;
  horario: string;
  foto_url: string;
  anfitrioes: string;
  whatsapp_lider: string;
  observacoes: string;
}

interface Presenca {
  id: string;
  usuario_id: string;
  data: string;
  presente: boolean;
  usuario?: { nome: string };
}

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  foto_perfil: string | null;
}

interface BaseMembro {
  id: string;
  membro_id: string;
  data_entrada: string;
  membro: Membro;
}

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
}

interface BaseVisitante {
  id: string;
  visitante_id: string;
  status: string;
  observacao: string | null;
  visitante: Visitante;
  statusAcompanhamento?: string;
}

// ===== CONFIG =====
const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
  ativo: 'Ativo',
};

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'info'> = {
  novo: 'warning',
  contato_iniciado: 'info',
  em_acompanhamento: 'secondary',
  concluido: 'success',
  ativo: 'success',
};

// ===== HELPERS =====
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null, message?: string): string => {
  const digits = cleanPhone(phone);
  const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const msg = encodeURIComponent(message || 'Olá! Sou da Igreja da Promessa.');
  return `https://wa.me/${phoneWithCountry}?text=${msg}`;
};

const getInitials = (nome: string): string => {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
};

const getOcupacaoPercent = (count: number, capacidade: number | null): number => {
  return Math.min(100, (count / (capacidade || 20)) * 100);
};

// ===== SKELETON COMPONENT =====
function LeaderBaseDetalhesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-5 w-48" />
      
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// ===== EMPTY STATES =====
function EmptyMembros() {
  return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground font-medium">Nenhum membro nesta base</p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        Os membros serão listados aqui quando adicionados pelo administrador.
      </p>
    </div>
  );
}

function EmptyVisitantes() {
  return (
    <div className="text-center py-12">
      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground font-medium">Nenhum visitante nesta base</p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        Os visitantes serão listados aqui quando vinculados pelo administrador.
      </p>
    </div>
  );
}

// ===== KPI CARD =====
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  progress?: number;
}

function KPICard({ title, value, subtitle, icon, progress }: KPICardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-2" />
        )}
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====
export default function LeaderBaseDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLider, loading: authLoading } = useAuth();

  const [base, setBase] = useState<Base | null>(null);
  const [membrosBase, setMembrosBase] = useState<BaseMembro[]>([]);
  const [visitantesBase, setVisitantesBase] = useState<BaseVisitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMembro, setSearchMembro] = useState('');
  const [searchVisitante, setSearchVisitante] = useState('');
  const [filtroStatusVisitante, setFiltroStatusVisitante] = useState('todos');
  
  // Estados de edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nome: '',
    descricao: '',
    dia_semana: '',
    horario: '',
    foto_url: '',
    anfitrioes: '',
    whatsapp_lider: '',
    observacoes: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Estado para presenças
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [presencasHoje, setPresencasHoje] = useState<Presenca[]>([]);

  const diasSemana = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];

  // Redirect if not leader
  useEffect(() => {
    if (!authLoading && !isLider) {
      navigate('/member');
    }
  }, [authLoading, isLider, navigate]);

  useEffect(() => {
    if (id && profile?.id) fetchData();
  }, [id, profile?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBase(),
        fetchMembrosBase(),
        fetchVisitantesBase(),
        fetchPresencas(),
      ]);
    } catch (error) {
      toast.error('Não foi possível carregar os dados da base');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresencas = async () => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    
    // Buscar presenças do dia
    const { data: presencasHojeData } = await supabase
      .from('presencas')
      .select('id, usuario_id, data, presente, usuario:profiles!presencas_usuario_id_fkey(nome)')
      .eq('referencia_tipo', 'base')
      .eq('referencia_id', id)
      .eq('data', hoje);

    if (presencasHojeData) {
      setPresencasHoje(presencasHojeData.map(p => ({
        ...p,
        usuario: Array.isArray(p.usuario) ? p.usuario[0] : p.usuario
      })) as Presenca[]);
    }

    // Buscar últimas 10 presenças
    const { data: presencasData } = await supabase
      .from('presencas')
      .select('id, usuario_id, data, presente, usuario:profiles!presencas_usuario_id_fkey(nome)')
      .eq('referencia_tipo', 'base')
      .eq('referencia_id', id)
      .order('data', { ascending: false })
      .limit(10);

    if (presencasData) {
      setPresencas(presencasData.map(p => ({
        ...p,
        usuario: Array.isArray(p.usuario) ? p.usuario[0] : p.usuario
      })) as Presenca[]);
    }
  };

  const fetchBase = async () => {
    const { data, error } = await supabase
      .from('bases')
      .select(`
        id, nome, descricao, lider_id, status, dia_semana, horario, 
        local, capacidade, visibilidade, data_criacao, foto_url, anfitrioes, whatsapp_lider, observacoes,
        lider:profiles!bases_lider_id_fkey(nome, telefone)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    
    // Verify the leader owns this base
    if (data && data.lider_id !== profile?.id) {
      toast.error('Você não tem permissão para acessar esta base');
      navigate('/leader/bases');
      return;
    }

    // Handle lider being array or object from join
    if (data) {
      const liderData = Array.isArray(data.lider) ? data.lider[0] : data.lider;
      setBase({ ...data, lider: liderData });
    }
  };

  const fetchMembrosBase = async () => {
    const { data, error } = await supabase
      .from('bases_membros')
      .select('id, membro_id, data_entrada, membro:membros(id, nome, telefone, foto_perfil)')
      .eq('base_id', id)
      .eq('status', 'ativo')
      .not('membro_id', 'is', null);

    if (error) throw error;
    if (data) setMembrosBase(data as unknown as BaseMembro[]);
  };

  const fetchVisitantesBase = async () => {
    const { data, error } = await supabase
      .from('bases_membros')
      .select('id, visitante_id, status, observacao, visitante:visitantes(id, nome, telefone)')
      .eq('base_id', id)
      .not('visitante_id', 'is', null)
      .neq('status', 'desligado');

    if (error) throw error;

    if (data) {
      const visitanteIds = data.map((d) => d.visitante_id).filter(Boolean);
      
      if (visitanteIds.length > 0) {
        const { data: acompData } = await supabase
          .from('acompanhamentos')
          .select('visitante_id, status, created_at')
          .eq('base_id', id!)
          .in('visitante_id', visitanteIds)
          .order('created_at', { ascending: false });

        const latestStatus: Record<string, string> = {};
        for (const acomp of acompData || []) {
          if (!latestStatus[acomp.visitante_id]) {
            latestStatus[acomp.visitante_id] = acomp.status;
          }
        }

        const enriched = (data as unknown as BaseVisitante[]).map((bv) => ({
          ...bv,
          statusAcompanhamento: latestStatus[bv.visitante_id] || bv.status,
        }));
        setVisitantesBase(enriched);
      } else {
        setVisitantesBase(data as unknown as BaseVisitante[]);
      }
    }
  };

  // ===== FILTERS =====
  const membrosFiltrados = membrosBase.filter((m) =>
    m.membro?.nome?.toLowerCase().includes(searchMembro.toLowerCase())
  );

  const visitantesFiltrados = visitantesBase
    .filter((v) => filtroStatusVisitante === 'todos' || (v.statusAcompanhamento || v.status) === filtroStatusVisitante)
    .filter((v) => v.visitante?.nome?.toLowerCase().includes(searchVisitante.toLowerCase()));

  const visitantesAtivos = visitantesBase.filter(
    (v) => ['novo', 'contato_iniciado', 'em_acompanhamento', 'ativo'].includes(v.statusAcompanhamento || v.status)
  ).length;

  // ===== EXPORT CSV =====
  const exportMembrosCSV = () => {
    const headers = ['Nome', 'Telefone'];
    const rows = membrosBase.map((m) => [
      m.membro?.nome || '',
      m.membro?.telefone || '',
    ]);
    
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `membros-${base?.nome || 'base'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  const exportVisitantesCSV = () => {
    const headers = ['Nome', 'Telefone', 'Status'];
    const rows = visitantesBase.map((v) => [
      v.visitante?.nome || '',
      v.visitante?.telefone || '',
      statusLabels[v.statusAcompanhamento || v.status] || v.status,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitantes-${base?.nome || 'base'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  // ===== EDIT BASE FUNCTIONS =====
  const handleOpenEditDialog = () => {
    if (!base) return;
    setEditFormData({
      nome: base.nome || '',
      descricao: base.descricao || '',
      dia_semana: base.dia_semana || '',
      horario: base.horario || '',
      foto_url: base.foto_url || '',
      anfitrioes: base.anfitrioes || '',
      whatsapp_lider: base.whatsapp_lider || '',
      observacoes: base.observacoes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveBase = async () => {
    if (!base || !id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('bases')
        .update({
          nome: editFormData.nome.trim(),
          descricao: editFormData.descricao.trim() || null,
          dia_semana: editFormData.dia_semana || null,
          horario: editFormData.horario.trim() || null,
          foto_url: editFormData.foto_url.trim() || null,
          anfitrioes: editFormData.anfitrioes.trim() || null,
          whatsapp_lider: editFormData.whatsapp_lider.trim() || null,
          observacoes: editFormData.observacoes.trim() || null
        })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao salvar: ' + error.message);
        throw error;
      }

      toast.success('Base atualizada com sucesso!');
      setIsEditDialogOpen(false);
      fetchData(); // Reload data
    } catch (error) {
      console.error('Erro ao salvar base:', error);
    } finally {
      setSaving(false);
    }
  };

  // ===== RENDER =====
  if (authLoading || loading) {
    return <LeaderBaseDetalhesSkeleton />;
  }

  if (!base) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">Base não encontrada</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          A base pode ter sido removida ou você não tem permissão para acessá-la.
        </p>
        <Button variant="link" onClick={() => navigate('/leader/bases')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Minhas Bases
        </Button>
      </div>
    );
  }

  const totalOcupantes = membrosBase.length + visitantesBase.length;
  const ocupacaoPercent = getOcupacaoPercent(totalOcupantes, base.capacidade);
  const vagasDisponiveis = Math.max(0, (base.capacidade || 20) - totalOcupantes);

  return (
    <div className="space-y-6">
      {/* ===== BREADCRUMB ===== */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/lider">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/leader/bases">Minhas Bases</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{base.nome}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leader/bases')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold">{base.nome}</h1>
              <Badge variant={base.status === 'ativo' ? 'success' : 'secondary'}>
                {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Detalhes da base que você lidera</p>
          </div>
        </div>
        
        {/* Botão Editar */}
        <Button variant="outline" onClick={handleOpenEditDialog}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar Base
        </Button>
      </div>

      {/* ===== DIALOG DE EDIÇÃO ===== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Base</DialogTitle>
            <DialogDescription>
              Atualize as informações da base. O endereço só pode ser alterado por um administrador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome da Base *</Label>
              <Input
                id="edit-nome"
                value={editFormData.nome}
                onChange={(e) => setEditFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editFormData.descricao}
                onChange={(e) => setEditFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da base"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dia">Dia da Semana</Label>
                <Select 
                  value={editFormData.dia_semana} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, dia_semana: value }))}
                >
                  <SelectTrigger id="edit-dia">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => (
                      <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-horario">Horário</Label>
                <Input
                  id="edit-horario"
                  type="time"
                  value={editFormData.horario}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, horario: e.target.value }))}
                />
              </div>
            </div>
            
            <BaseFotoUpload
              currentUrl={editFormData.foto_url || null}
              baseId={id || 'new'}
              onUploadComplete={(url) => setEditFormData(prev => ({ ...prev, foto_url: url }))}
              disabled={saving}
            />
            
            <div className="space-y-2">
              <Label htmlFor="edit-anfitrioes">Anfitriões</Label>
              <Input
                id="edit-anfitrioes"
                value={editFormData.anfitrioes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, anfitrioes: e.target.value }))}
                placeholder="Ex: João e Maria, Família Silva"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-whatsapp">WhatsApp do Líder</Label>
              <Input
                id="edit-whatsapp"
                value={editFormData.whatsapp_lider}
                onChange={(e) => setEditFormData(prev => ({ ...prev, whatsapp_lider: e.target.value }))}
                placeholder="(99) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={editFormData.observacoes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Informações importantes, orientações internas..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBase} disabled={saving || !editFormData.nome.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total de Membros"
          value={membrosBase.length}
          subtitle={`${vagasDisponiveis} vagas disponíveis`}
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Visitantes Ativos"
          value={visitantesAtivos}
          subtitle={`${visitantesBase.length} no total`}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Ocupação"
          value={`${Math.round(ocupacaoPercent)}%`}
          subtitle={`${totalOcupantes} de ${base.capacidade || 20}`}
          icon={<Building2 className="h-5 w-5" />}
          progress={ocupacaoPercent}
        />
      </div>

      {/* ===== TABS ===== */}
      <Tabs defaultValue="membros" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="membros">
            <Users className="h-4 w-4 mr-2" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="visitantes">
            <UserCheck className="h-4 w-4 mr-2" />
            Visitantes
          </TabsTrigger>
          <TabsTrigger value="presencas">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Presenças
          </TabsTrigger>
          <TabsTrigger value="info">
            <Info className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB: MEMBROS ===== */}
        <TabsContent value="membros" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Membros da Base</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar membro..."
                      value={searchMembro}
                      onChange={(e) => setSearchMembro(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {membrosBase.length > 0 && (
                    <Button variant="outline" size="sm" onClick={exportMembrosCSV}>
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {membrosFiltrados.length === 0 ? (
                <EmptyMembros />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membrosFiltrados.map((bm) => (
                        <TableRow key={bm.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={bm.membro?.foto_perfil || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(bm.membro?.nome || 'M')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{bm.membro?.nome}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {bm.membro?.telefone || 'Sem telefone'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {bm.membro?.telefone || '–'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasValidPhone(bm.membro?.telefone) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => window.open(getWhatsAppUrl(bm.membro?.telefone), '_blank')}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => window.open(`tel:${cleanPhone(bm.membro?.telefone)}`, '_blank')}
                                    title="Ligar"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: VISITANTES ===== */}
        <TabsContent value="visitantes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Visitantes da Base</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar visitante..."
                      value={searchVisitante}
                      onChange={(e) => setSearchVisitante(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={filtroStatusVisitante}
                    onChange={(e) => setFiltroStatusVisitante(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="novo">Novos</option>
                    <option value="contato_iniciado">Contato Iniciado</option>
                    <option value="em_acompanhamento">Em Acompanhamento</option>
                    <option value="concluido">Concluídos</option>
                  </select>
                  {visitantesBase.length > 0 && (
                    <Button variant="outline" size="sm" onClick={exportVisitantesCSV}>
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visitantesFiltrados.length === 0 ? (
                <EmptyVisitantes />
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitantesFiltrados.map((bv) => (
                        <TableRow key={bv.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs bg-secondary">
                                  {getInitials(bv.visitante?.nome || 'V')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{bv.visitante?.nome}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">
                                  {bv.visitante?.telefone || 'Sem telefone'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {bv.visitante?.telefone || '–'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant[bv.statusAcompanhamento || bv.status] || 'secondary'}>
                              {statusLabels[bv.statusAcompanhamento || bv.status] || bv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasValidPhone(bv.visitante?.telefone) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => window.open(getWhatsAppUrl(bv.visitante?.telefone), '_blank')}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => window.open(`tel:${cleanPhone(bv.visitante?.telefone)}`, '_blank')}
                                    title="Ligar"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: PRESENÇAS ===== */}
        <TabsContent value="presencas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Presenças de Hoje</CardTitle>
              <CardDescription>
                {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {presencasHoje.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma presença registrada hoje</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {presencasHoje.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{p.usuario?.nome || 'Membro'}</span>
                      <Badge variant={p.presente ? 'success' : 'secondary'}>
                        {p.presente ? 'Presente' : 'Ausente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimas Presenças</CardTitle>
              <CardDescription>Histórico recente de presenças na base</CardDescription>
            </CardHeader>
            <CardContent>
              {presencas.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma presença registrada ainda</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presencas.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-sm">
                            {p.usuario?.nome || 'Membro'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(p.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={p.presente ? 'success' : 'secondary'} className="text-xs">
                              {p.presente ? 'Presente' : 'Ausente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: INFORMAÇÕES ===== */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Base</CardTitle>
              <CardDescription>Dados gerais sobre esta base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              {base.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{base.descricao}</p>
                </div>
              )}

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dia da Semana</p>
                    <p className="font-medium">{base.dia_semana || 'Não definido'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{base.horario || 'Não definido'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium">{base.local || 'Não definido'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">{base.capacidade || 20} pessoas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Líder</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{base.lider?.nome || 'Você'}</p>
                      {base.lider && hasValidPhone(base.lider.telefone) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600"
                          onClick={() => window.open(getWhatsAppUrl(base.lider?.telefone), '_blank')}
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visibilidade</p>
                    <Badge variant={base.visibilidade === 'publico' ? 'default' : 'secondary'}>
                      {base.visibilidade === 'publico' ? 'Pública' : 'Privada'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
