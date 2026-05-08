import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, MessageCircle, Phone, Search, Clock, MapPin, Users, CalendarDays,
  User, Download, Info, UserCheck, Building2, Pencil, Loader2, Save,
  ClipboardCheck, UserPlus, Trash2, Network,
} from 'lucide-react';
import { BaseFotoUpload } from '@/components/base/BaseFotoUpload';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Grupo {
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

interface Membro {
  bases_membros_id: string;
  profile_id: string | null;
  membro_id: string | null;
  nome: string;
  telefone: string | null;
  foto_url: string | null;
  data_entrada: string;
  origem: 'profile' | 'membro' | 'ambos';
}

interface Visitante {
  id: string;
  visitante_id: string;
  status: string;
  observacao: string | null;
  visitante: { id: string; nome: string; telefone: string | null };
  statusAcompanhamento?: string;
}

interface Presenca {
  id: string;
  usuario_id: string;
  data: string;
  presente: boolean;
  usuario?: { nome: string };
}

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
  ativo: 'Ativo',
};

const cleanPhone = (p: string | null) => (p ?? '').replace(/\D/g, '');
const hasPhone = (p: string | null) => cleanPhone(p).length >= 10;
const whatsUrl = (p: string | null) => `https://wa.me/55${cleanPhone(p)}?text=${encodeURIComponent('Olá! Sou da Igreja da Promessa.')}`;
const initials = (nome: string) => nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

export default function GrupoDetalhe() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchMembro, setSearchMembro] = useState('');
  const [searchVisitante, setSearchVisitante] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [editAberto, setEditAberto] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '', descricao: '', dia_semana: '', horario: '', foto_url: '',
    anfitrioes: '', whatsapp_lider: '', observacoes: '',
  });

  const [addMembroAberto, setAddMembroAberto] = useState(false);
  const [addBusca, setAddBusca] = useState('');
  const [elegiveis, setElegiveis] = useState<{ id: string; nome: string; email: string }[]>([]);
  const [buscandoElegiveis, setBuscandoElegiveis] = useState(false);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const [excluindoGrupo, setExcluindoGrupo] = useState(false);

  // Fetch grupo
  const { data: grupo, isLoading: loadingGrupo } = useQuery({
    queryKey: ['pg_grupo', grupoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bases')
        .select('*, lider:profiles!bases_lider_id_fkey(nome, telefone)')
        .eq('id', grupoId)
        .maybeSingle();
      if (error) throw error;
      const lider = Array.isArray(data?.lider) ? data.lider[0] : data?.lider;
      return { ...data, lider } as Grupo;
    },
    enabled: !!grupoId,
  });

  // Fetch membros
  const { data: membros = [], refetch: refetchMembros } = useQuery({
    queryKey: ['pg_membros', grupoId, searchMembro],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_base_members_for_leader', {
        p_base_id: grupoId!,
        p_search: searchMembro || null,
      });
      if (error) throw error;
      return (data as Membro[]) ?? [];
    },
    enabled: !!grupoId,
  });

  // Fetch visitantes
  const { data: visitantes = [], refetch: refetchVisitantes } = useQuery({
    queryKey: ['pg_visitantes', grupoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bases_membros')
        .select('id, visitante_id, status, observacao, visitante:visitantes(id, nome, telefone)')
        .eq('base_id', grupoId)
        .not('visitante_id', 'is', null)
        .neq('status', 'desligado');
      if (error) throw error;

      const ids = (data ?? []).map((d: any) => d.visitante_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: acomp } = await (supabase as any)
          .from('acompanhamentos')
          .select('visitante_id, status, created_at')
          .eq('base_id', grupoId)
          .in('visitante_id', ids)
          .order('created_at', { ascending: false });
        const latest: Record<string, string> = {};
        for (const a of acomp ?? []) {
          if (!latest[a.visitante_id]) latest[a.visitante_id] = a.status;
        }
        return (data as Visitante[]).map((v) => ({ ...v, statusAcompanhamento: latest[v.visitante_id] || v.status }));
      }
      return data as Visitante[];
    },
    enabled: !!grupoId,
  });

  // Fetch presenças
  const { data: presencasDados } = useQuery({
    queryKey: ['pg_presencas', grupoId],
    queryFn: async () => {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const [{ data: hojeData }, { data: historico }] = await Promise.all([
        (supabase as any)
          .from('presencas')
          .select('id, usuario_id, data, presente, usuario:profiles!presencas_usuario_id_fkey(nome)')
          .eq('referencia_tipo', 'base').eq('referencia_id', grupoId).eq('data', hoje),
        (supabase as any)
          .from('presencas')
          .select('id, usuario_id, data, presente, usuario:profiles!presencas_usuario_id_fkey(nome)')
          .eq('referencia_tipo', 'base').eq('referencia_id', grupoId)
          .order('data', { ascending: false }).limit(20),
      ]);
      const norm = (arr: any[]) => (arr ?? []).map((p: any) => ({
        ...p, usuario: Array.isArray(p.usuario) ? p.usuario[0] : p.usuario,
      }));
      return { hoje: norm(hojeData ?? []) as Presenca[], historico: norm(historico ?? []) as Presenca[] };
    },
    enabled: !!grupoId,
  });

  // Buscar elegíveis com debounce
  useEffect(() => {
    if (!addMembroAberto || !grupoId) return;
    const t = setTimeout(async () => {
      setBuscandoElegiveis(true);
      try {
        const { data, error } = await supabase.rpc('get_eligible_people_for_base', {
          p_base_id: grupoId,
          p_search: addBusca || null,
        });
        if (error) throw error;
        setElegiveis((data as any[]) ?? []);
      } catch {
        toast.error('Erro ao buscar pessoas');
      } finally {
        setBuscandoElegiveis(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addBusca, addMembroAberto, grupoId]);

  // Mutations
  const salvarMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('bases').update({
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim() || null,
        dia_semana: editForm.dia_semana || null,
        horario: editForm.horario || null,
        foto_url: editForm.foto_url || null,
        anfitrioes: editForm.anfitrioes.trim() || null,
        whatsapp_lider: editForm.whatsapp_lider.trim() || null,
        observacoes: editForm.observacoes.trim() || null,
      }).eq('id', grupoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg_grupo', grupoId] });
      queryClient.invalidateQueries({ queryKey: ['pg_grupos'] });
      toast.success('Grupo atualizado!');
      setEditAberto(false);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const excluirMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('bases').delete().eq('id', grupoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg_grupos'] });
      toast.success('Grupo excluído.');
      navigate(-1);
    },
    onError: () => toast.error('Erro ao excluir grupo'),
  });

  async function adicionarMembro(profileId: string) {
    setAdicionandoId(profileId);
    try {
      const { error } = await supabase.rpc('leader_add_member_to_base', {
        p_base_id: grupoId!,
        p_profile_id: profileId,
      });
      if (error) throw error;
      setElegiveis((prev) => prev.filter((p) => p.id !== profileId));
      refetchMembros();
      toast.success('Membro adicionado!');
    } catch {
      toast.error('Erro ao adicionar membro');
    } finally {
      setAdicionandoId(null);
    }
  }

  async function removerMembro(basesMembrosId: string) {
    setRemovendoId(basesMembrosId);
    try {
      const { error } = await supabase.rpc('leader_remove_member_from_base', {
        p_bases_membros_id: basesMembrosId,
      });
      if (error) throw error;
      refetchMembros();
      toast.success('Membro removido.');
    } catch {
      toast.error('Erro ao remover membro');
    } finally {
      setRemovendoId(null);
    }
  }

  function abrirEdicao() {
    if (!grupo) return;
    setEditForm({
      nome: grupo.nome,
      descricao: grupo.descricao ?? '',
      dia_semana: grupo.dia_semana ?? '',
      horario: grupo.horario ?? '',
      foto_url: grupo.foto_url ?? '',
      anfitrioes: grupo.anfitrioes ?? '',
      whatsapp_lider: grupo.whatsapp_lider ?? '',
      observacoes: grupo.observacoes ?? '',
    });
    setEditAberto(true);
  }

  function exportCSV(dados: any[], colunas: string[], nomeArquivo: string) {
    const csv = [colunas.join(','), ...dados].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  }

  const membrosFiltrados = membros.filter((m) =>
    !searchMembro || m.nome?.toLowerCase().includes(searchMembro.toLowerCase())
  );

  const visitantesFiltrados = visitantes
    .filter((v) => filtroStatus === 'todos' || (v.statusAcompanhamento ?? v.status) === filtroStatus)
    .filter((v) => !searchVisitante || v.visitante?.nome?.toLowerCase().includes(searchVisitante.toLowerCase()));

  const totalOcupantes = membros.length + visitantes.length;
  const capacidade = grupo?.capacidade ?? 20;
  const ocupacaoPercent = Math.min(100, (totalOcupantes / capacidade) * 100);

  if (loadingGrupo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Network className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Grupo não encontrado.</p>
        <Button variant="link" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{grupo.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {grupo.dia_semana && grupo.horario ? `${grupo.dia_semana} · ${grupo.horario}` : 'Horário não definido'}
              {grupo.local && ` · ${grupo.local}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={abrirEdicao}>
            <Pencil className="w-4 h-4 mr-1" />Editar
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setExcluindoGrupo(true)}>
            <Trash2 className="w-4 h-4 mr-1" />Excluir
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{membros.length}</p>
              <p className="text-xs text-muted-foreground">Membros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{visitantes.length}</p>
              <p className="text-xs text-muted-foreground">Visitantes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ocupação</span>
              <span className="font-medium">{Math.round(ocupacaoPercent)}%</span>
            </div>
            <Progress value={ocupacaoPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{totalOcupantes}/{capacidade}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="membros">
        <TabsList className="grid grid-cols-4 max-w-lg">
          <TabsTrigger value="membros"><Users className="w-4 h-4 mr-1.5" />Membros</TabsTrigger>
          <TabsTrigger value="visitantes"><UserCheck className="w-4 h-4 mr-1.5" />Visitantes</TabsTrigger>
          <TabsTrigger value="presencas"><ClipboardCheck className="w-4 h-4 mr-1.5" />Presenças</TabsTrigger>
          <TabsTrigger value="info"><Info className="w-4 h-4 mr-1.5" />Info</TabsTrigger>
        </TabsList>

        {/* Tab: Membros */}
        <TabsContent value="membros" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">Membros ({membros.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-52">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Buscar…" value={searchMembro} onChange={(e) => setSearchMembro(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => { setAddBusca(''); setElegiveis([]); setAddMembroAberto(true); }}>
                    <UserPlus className="w-4 h-4 mr-1" />Adicionar
                  </Button>
                  {membros.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() =>
                      exportCSV(membros.map((m) => [m.nome, m.telefone ?? '']), ['Nome', 'Telefone'], `membros-${grupo.nome}.csv`)
                    }>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {membrosFiltrados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Nenhum membro encontrado.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membrosFiltrados.map((m) => (
                      <TableRow key={m.bases_membros_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={m.foto_url ?? undefined} />
                              <AvatarFallback className="text-xs">{initials(m.nome ?? 'M')}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">{m.nome}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{m.telefone ?? '–'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasPhone(m.telefone) && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(whatsUrl(m.telefone), '_blank')}>
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => window.open(`tel:${cleanPhone(m.telefone)}`)}>
                                  <Phone className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              disabled={removendoId === m.bases_membros_id}
                              onClick={() => removerMembro(m.bases_membros_id)}
                            >
                              {removendoId === m.bases_membros_id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modal: Adicionar Membro */}
          <Dialog open={addMembroAberto} onOpenChange={setAddMembroAberto}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
                <DialogDescription>Busque pelo nome ou e-mail da pessoa.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input autoFocus className="pl-9" placeholder="Buscar…" value={addBusca} onChange={(e) => setAddBusca(e.target.value)} />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {buscandoElegiveis ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  ) : elegiveis.length === 0 && addBusca ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pessoa encontrada.</p>
                  ) : elegiveis.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                      <Button size="sm" variant="outline" disabled={adicionandoId === p.id} onClick={() => adicionarMembro(p.id)}>
                        {adicionandoId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab: Visitantes */}
        <TabsContent value="visitantes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">Visitantes ({visitantes.length})</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Buscar…" value={searchVisitante} onChange={(e) => setSearchVisitante(e.target.value)} />
                  </div>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="todos">Todos</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visitantesFiltrados.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Nenhum visitante vinculado.</div>
              ) : (
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
                    {visitantesFiltrados.map((v) => {
                      const st = v.statusAcompanhamento ?? v.status;
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-secondary">{initials(v.visitante?.nome ?? 'V')}</AvatarFallback>
                              </Avatar>
                              <p className="font-medium text-sm">{v.visitante?.nome}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{v.visitante?.telefone ?? '–'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{STATUS_LABELS[st] ?? st}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasPhone(v.visitante?.telefone) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(whatsUrl(v.visitante?.telefone), '_blank')}>
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Presenças */}
        <TabsContent value="presencas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Presenças de Hoje</CardTitle>
              <CardDescription>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardDescription>
            </CardHeader>
            <CardContent>
              {!presencasDados?.hoje.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma presença registrada hoje.</div>
              ) : (
                <div className="space-y-2">
                  {presencasDados.hoje.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{p.usuario?.nome ?? 'Membro'}</span>
                      <Badge variant={p.presente ? 'default' : 'secondary'} className="text-xs">
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
              <CardTitle className="text-base">Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {!presencasDados?.historico.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma presença registrada ainda.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presencasDados.historico.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">{p.usuario?.nome ?? 'Membro'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(p.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.presente ? 'default' : 'secondary'} className="text-xs">
                            {p.presente ? 'Presente' : 'Ausente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Info */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Grupo</CardTitle>
              {grupo.descricao && <CardDescription>{grupo.descricao}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: CalendarDays, label: 'Dia da Semana', value: grupo.dia_semana },
                  { icon: Clock, label: 'Horário', value: grupo.horario },
                  { icon: MapPin, label: 'Local', value: grupo.local },
                  { icon: Users, label: 'Capacidade', value: grupo.capacidade ? `${grupo.capacidade} pessoas` : null },
                  { icon: User, label: 'Líder', value: grupo.lider?.nome ?? '–' },
                  { icon: Building2, label: 'Visibilidade', value: grupo.visibilidade === 'publico' ? 'Pública' : 'Privada' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium text-sm">{value ?? 'Não definido'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {grupo.observacoes && (
                <div className="mt-5 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{grupo.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Editar Grupo */}
      <Dialog open={editAberto} onOpenChange={setEditAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={editForm.descricao} onChange={(e) => setEditForm((p) => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dia da Semana</Label>
                <Select value={editForm.dia_semana} onValueChange={(v) => setEditForm((p) => ({ ...p, dia_semana: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={editForm.horario} onChange={(e) => setEditForm((p) => ({ ...p, horario: e.target.value }))} />
              </div>
            </div>
            <BaseFotoUpload
              currentUrl={editForm.foto_url || null}
              baseId={grupoId ?? 'new'}
              onUploadComplete={(url) => setEditForm((p) => ({ ...p, foto_url: url }))}
              disabled={salvarMutation.isPending}
            />
            <div>
              <Label>Anfitriões</Label>
              <Input value={editForm.anfitrioes} onChange={(e) => setEditForm((p) => ({ ...p, anfitrioes: e.target.value }))} placeholder="Ex: João e Maria" />
            </div>
            <div>
              <Label>WhatsApp do Líder</Label>
              <Input value={editForm.whatsapp_lider} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp_lider: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={editForm.observacoes} onChange={(e) => setEditForm((p) => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAberto(false)}>Cancelar</Button>
            <Button disabled={!editForm.nome.trim() || salvarMutation.isPending} onClick={() => salvarMutation.mutate()}>
              {salvarMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação: Excluir Grupo */}
      <AlertDialog open={excluindoGrupo} onOpenChange={setExcluindoGrupo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir permanentemente "{grupo.nome}"? Todos os dados de membros vinculados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={excluirMutation.isPending}
              onClick={() => excluirMutation.mutate()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
