import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Users, CheckCircle, Clock, XCircle, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Ministerio {
  id: string;
  nome: string;
}

interface Funcao {
  id: string;
  ministerio_id: string;
  nome: string;
  ativo: boolean;
}

interface Profile {
  id: string;
  nome: string;
  user_id: string;
  email?: string;
  funcao_principal_id?: string | null;
}

interface Escala {
  id: string;
  data: string;
  horario: string | null;
  turno: string | null;
  funcao: string;
  status: string;
  status_geral: string | null;
  ministerio_id: string | null;
  voluntario_id: string | null;
  responsavel_id: string | null;
  justificativa: string | null;
  created_at: string;
  ministerios: { nome: string } | null;
  voluntario: { nome: string } | null;
  responsavel: { nome: string } | null;
}

interface EscalaGroup {
  key: string;
  ministerio_id: string | null;
  data: string;
  horario: string | null;
  funcao: string;
  turno: string | null;
  responsavel_id: string | null;
  status_geral: string | null;
  ministerio_nome: string | null;
  responsavel_nome: string | null;
  voluntarios: Array<{
    id: string;
    voluntario_id: string;
    nome: string;
    status: string;
    justificativa: string | null;
  }>;
}

interface EscalaFormData {
  ministerio_id: string;
  data: Date;
  horario: string;
  funcao: string;
  turno: string;
  responsavel_id: string;
  voluntarios_ids: string[];
  status_geral: string;
}

const initialFormData: EscalaFormData = {
  ministerio_id: '',
  data: new Date(),
  horario: '',
  funcao: '',
  turno: '',
  responsavel_id: '',
  voluntarios_ids: [],
  status_geral: 'planejada',
};

export default function AdminEscalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [escalaGroups, setEscalaGroups] = useState<EscalaGroup[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [voluntarios, setVoluntarios] = useState<Profile[]>([]);
  const [lideres, setLideres] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EscalaGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<EscalaGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<EscalaGroup | null>(null);
  const [formData, setFormData] = useState<EscalaFormData>(initialFormData);
  
  // Filters
  const [filterMinisterio, setFilterMinisterio] = useState<string>('all');
  const [filterData, setFilterData] = useState<Date | undefined>();
  const [filterVoluntario, setFilterVoluntario] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEscalas(),
      fetchMinisterios(),
      fetchVoluntarios(),
      fetchLideres(),
    ]);
    setLoading(false);
  };

  const fetchEscalas = async () => {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          *,
          ministerios(nome),
          voluntario:profiles!escalas_voluntario_id_fkey(nome),
          responsavel:profiles!escalas_responsavel_id_fkey(nome)
        `)
        .order('data', { ascending: false });

      if (error) throw error;
      setEscalas(data || []);
      
      // Group escalas by (ministerio_id, data, funcao, turno)
      const groups = groupEscalas(data || []);
      setEscalaGroups(groups);
    } catch (error) {
      console.error('Error fetching escalas:', error);
      toast.error('Erro ao carregar escalas');
    }
  };

  const groupEscalas = (escalas: Escala[]): EscalaGroup[] => {
    const groupMap = new Map<string, EscalaGroup>();
    
    escalas.forEach((escala) => {
      const key = `${escala.ministerio_id}-${escala.data}-${escala.funcao}-${escala.turno || ''}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          ministerio_id: escala.ministerio_id,
          data: escala.data,
          horario: escala.horario,
          funcao: escala.funcao,
          turno: escala.turno,
          responsavel_id: escala.responsavel_id,
          status_geral: escala.status_geral,
          ministerio_nome: escala.ministerios?.nome || null,
          responsavel_nome: escala.responsavel?.nome || null,
          voluntarios: [],
        });
      }
      
      const group = groupMap.get(key)!;
      if (escala.voluntario_id && escala.voluntario) {
        group.voluntarios.push({
          id: escala.id,
          voluntario_id: escala.voluntario_id,
          nome: escala.voluntario.nome,
          status: escala.status,
          justificativa: escala.justificativa,
        });
      }
    });
    
    return Array.from(groupMap.values());
  };

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setMinisterios(data || []);
    } catch (error) {
      console.error('Error fetching ministerios:', error);
    }
  };

  const fetchVoluntarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, user_id')
        .order('nome');

      if (error) throw error;
      setVoluntarios(data || []);
    } catch (error) {
      console.error('Error fetching voluntarios:', error);
    }
  };

  const fetchVoluntariosByMinisterio = async (ministerioId: string) => {
    if (!ministerioId) {
      setVoluntarios([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          user_id,
          ativo,
          funcao_principal_id,
          profile:profiles!ministerio_voluntarios_user_id_fkey(id, nome, email, user_id)
        `)
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true);

      if (error) throw error;
      
      // Map to Profile format with funcao_principal_id
      const profiles = (data || [])
        .filter(item => item.profile)
        .map(item => ({
          id: item.profile!.id,
          nome: item.profile!.nome,
          email: item.profile!.email,
          user_id: item.profile!.user_id,
          funcao_principal_id: item.funcao_principal_id,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      setVoluntarios(profiles);
    } catch (error) {
      console.error('Error fetching voluntarios by ministerio:', error);
      // Fallback to all profiles
      fetchVoluntarios();
    }
  };

  const fetchFuncoesByMinisterio = async (ministerioId: string) => {
    if (!ministerioId) {
      setFuncoes([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, ministerio_id, nome, ativo')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
      setFuncoes([]);
    }
  };

  const fetchLideres = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'lider']);

      if (error) throw error;

      const userIds = data?.map((r) => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome, user_id')
          .in('user_id', userIds)
          .order('nome');

        if (profilesError) throw profilesError;
        setLideres(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching lideres:', error);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData(initialFormData);
    setVoluntarios([]); // Clear volunteers until ministry is selected
    setFuncoes([]); // Clear functions until ministry is selected
    setIsDialogOpen(true);
  };

  const handleEdit = (group: EscalaGroup) => {
    setEditingGroup(group);
    setFormData({
      ministerio_id: group.ministerio_id || '',
      data: new Date(group.data),
      horario: group.horario || '',
      funcao: group.funcao,
      turno: group.turno || '',
      responsavel_id: group.responsavel_id || '',
      voluntarios_ids: group.voluntarios.map((v) => v.voluntario_id),
      status_geral: group.status_geral || 'planejada',
    });
    // Load volunteers and functions for the ministry
    if (group.ministerio_id) {
      fetchVoluntariosByMinisterio(group.ministerio_id);
      fetchFuncoesByMinisterio(group.ministerio_id);
    }
    setIsDialogOpen(true);
  };

  const handleView = (group: EscalaGroup) => {
    setViewingGroup(group);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;

    try {
      // Delete all escalas in this group
      const ids = deletingGroup.voluntarios.map((v) => v.id);
      
      const { error } = await supabase
        .from('escalas')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success('Escala excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
      fetchEscalas();
    } catch (error) {
      console.error('Error deleting escala:', error);
      toast.error('Erro ao excluir escala');
    }
  };

  const handleSubmit = async () => {
    if (!formData.ministerio_id) {
      toast.error('Selecione um ministério');
      return;
    }
    if (!formData.funcao) {
      toast.error('Selecione uma função');
      return;
    }
    if (formData.voluntarios_ids.length === 0) {
      toast.error('Selecione pelo menos um voluntário');
      return;
    }

    try {
      if (editingGroup) {
        // When editing, delete old entries and create new ones with updated volunteers
        const oldIds = editingGroup.voluntarios.map((v) => v.id);
        
        // Delete old entries
        if (oldIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('escalas')
            .delete()
            .in('id', oldIds);

          if (deleteError) throw deleteError;
        }

        // Create new entries for selected volunteers
        const escalasToInsert = formData.voluntarios_ids.map((voluntarioId) => ({
          ministerio_id: formData.ministerio_id,
          data: format(formData.data, 'yyyy-MM-dd'),
          horario: formData.horario || null,
          funcao: formData.funcao,
          turno: formData.turno || null,
          responsavel_id: formData.responsavel_id || null,
          voluntario_id: voluntarioId,
          status_geral: formData.status_geral as 'planejada' | 'ativa' | 'concluida',
          status: 'pendente' as const,
        }));

        const { error } = await supabase
          .from('escalas')
          .insert(escalasToInsert);

        if (error) throw error;
        toast.success('Escala atualizada com sucesso');
      } else {
        // Create new escalas for each volunteer
        const escalasToInsert = formData.voluntarios_ids.map((voluntarioId) => ({
          ministerio_id: formData.ministerio_id,
          data: format(formData.data, 'yyyy-MM-dd'),
          horario: formData.horario || null,
          funcao: formData.funcao,
          turno: formData.turno || null,
          responsavel_id: formData.responsavel_id || null,
          voluntario_id: voluntarioId,
          status_geral: formData.status_geral as 'planejada' | 'ativa' | 'concluida',
          status: 'pendente' as const,
        }));

        const { error } = await supabase
          .from('escalas')
          .insert(escalasToInsert);

        if (error) throw error;
        toast.success(`${escalasToInsert.length} escala(s) criada(s) com sucesso`);
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingGroup(null);
      fetchEscalas();
    } catch (error) {
      console.error('Error saving escala:', error);
      toast.error('Erro ao salvar escala');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'ausente':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getStatusGeralBadge = (status: string | null) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-blue-100 text-blue-700">Ativa</Badge>;
      case 'concluida':
        return <Badge className="bg-gray-100 text-gray-700">Concluída</Badge>;
      default:
        return <Badge className="bg-purple-100 text-purple-700">Planejada</Badge>;
    }
  };

  const getVoluntariosStatusSummary = (voluntarios: EscalaGroup['voluntarios']) => {
    const confirmados = voluntarios.filter((v) => v.status === 'confirmado').length;
    const pendentes = voluntarios.filter((v) => v.status === 'pendente').length;
    const ausentes = voluntarios.filter((v) => v.status === 'ausente').length;
    
    return { confirmados, pendentes, ausentes, total: voluntarios.length };
  };

  const toggleVoluntario = (voluntarioId: string) => {
    setFormData((prev) => ({
      ...prev,
      voluntarios_ids: prev.voluntarios_ids.includes(voluntarioId)
        ? prev.voluntarios_ids.filter((id) => id !== voluntarioId)
        : [...prev.voluntarios_ids, voluntarioId],
    }));
  };

  // Filtered groups
  const filteredGroups = escalaGroups.filter((group) => {
    if (filterMinisterio !== 'all' && group.ministerio_id !== filterMinisterio) return false;
    if (filterVoluntario !== 'all' && !group.voluntarios.some((v) => v.voluntario_id === filterVoluntario)) return false;
    if (filterData && format(new Date(group.data), 'yyyy-MM-dd') !== format(filterData, 'yyyy-MM-dd')) return false;
    if (searchTerm && !group.funcao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Group escalas by date for calendar view
  const groupsByDate = filteredGroups.reduce((acc, group) => {
    const date = group.data;
    if (!acc[date]) acc[date] = [];
    acc[date].push(group);
    return acc;
  }, {} as Record<string, EscalaGroup[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Escalas</h1>
          <p className="text-muted-foreground">Gerencie as escalas de ministérios e voluntários</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterMinisterio} onValueChange={setFilterMinisterio}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ministério" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ministérios</SelectItem>
                {ministerios.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVoluntario} onValueChange={setFilterVoluntario}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Voluntário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Voluntários</SelectItem>
                {voluntarios.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !filterData && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterData ? format(filterData, 'dd/MM/yyyy') : 'Filtrar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterData}
                  onSelect={setFilterData}
                  locale={ptBR}
                />
                {filterData && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setFilterData(undefined)}>
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Ministério</TableHead>
                    <TableHead>Voluntários</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma escala encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group) => {
                      const summary = getVoluntariosStatusSummary(group.voluntarios);
                      return (
                        <TableRow key={group.key}>
                          <TableCell>
                            <div className="font-medium">
                              {format(new Date(group.data), 'dd/MM/yyyy')}
                            </div>
                            {group.horario && (
                              <div className="text-sm text-muted-foreground">{group.horario}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{group.funcao}</div>
                            {group.turno && (
                              <div className="text-sm text-muted-foreground capitalize">{group.turno}</div>
                            )}
                          </TableCell>
                          <TableCell>{group.ministerio_nome || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{summary.total}</span>
                              <div className="flex gap-1">
                                {summary.confirmados > 0 && (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                                    {summary.confirmados} ✓
                                  </Badge>
                                )}
                                {summary.pendentes > 0 && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
                                    {summary.pendentes} ⏳
                                  </Badge>
                                )}
                                {summary.ausentes > 0 && (
                                  <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                    {summary.ausentes} ✗
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusGeralBadge(group.status_geral)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleView(group)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingGroup(group);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Calendar
                  mode="single"
                  selected={filterData}
                  onSelect={setFilterData}
                  locale={ptBR}
                  className="rounded-md border"
                  modifiers={{
                    hasEscala: Object.keys(groupsByDate).map((d) => new Date(d)),
                  }}
                  modifiersStyles={{
                    hasEscala: { backgroundColor: 'hsl(var(--primary) / 0.1)', fontWeight: 'bold' },
                  }}
                />
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {filterData
                      ? `Escalas em ${format(filterData, "dd 'de' MMMM", { locale: ptBR })}`
                      : 'Selecione uma data'}
                  </h3>
                  {filterData && groupsByDate[format(filterData, 'yyyy-MM-dd')] ? (
                    <div className="space-y-2">
                      {groupsByDate[format(filterData, 'yyyy-MM-dd')].map((group) => {
                        const summary = getVoluntariosStatusSummary(group.voluntarios);
                        return (
                          <div 
                            key={group.key} 
                            className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleView(group)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{group.funcao}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group.ministerio_nome} • {summary.total} voluntário(s)
                                </p>
                              </div>
                              {getStatusGeralBadge(group.status_geral)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : filterData ? (
                    <p className="text-muted-foreground">Nenhuma escala nesta data</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog - Show all volunteers and their status */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Escala</DialogTitle>
            <DialogDescription>
              Status de cada voluntário nesta escala
            </DialogDescription>
          </DialogHeader>
          
          {viewingGroup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="font-medium">{format(new Date(viewingGroup.data), 'dd/MM/yyyy')}</span>
                </div>
                {viewingGroup.horario && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Horário:</span>
                    <span className="font-medium">{viewingGroup.horario}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <span className="font-medium">{viewingGroup.funcao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ministério:</span>
                  <span className="font-medium">{viewingGroup.ministerio_nome || '-'}</span>
                </div>
                {viewingGroup.responsavel_nome && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Responsável:</span>
                    <span className="font-medium">{viewingGroup.responsavel_nome}</span>
                  </div>
                )}
              </div>

              {/* Status Counters */}
              {(() => {
                const summary = getVoluntariosStatusSummary(viewingGroup.voluntarios);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{summary.confirmados}</p>
                      <p className="text-xs text-emerald-600 font-medium">Confirmados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{summary.pendentes}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pendentes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-center">
                      <p className="text-2xl font-bold text-red-600">{summary.ausentes}</p>
                      <p className="text-xs text-red-600 font-medium">Recusados</p>
                    </div>
                  </div>
                );
              })()}

              {/* Grouped Volunteers by Status */}
              <div className="space-y-4">
                {/* Confirmados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <p className="font-medium">{vol.nome}</p>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pendentes */}
                {viewingGroup.voluntarios.filter(v => v.status === 'pendente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pendentes
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'pendente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                          <p className="font-medium">{vol.nome}</p>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recusados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'ausente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-700 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Recusados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'ausente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                          <div>
                            <p className="font-medium">{vol.nome}</p>
                            {vol.justificativa && (
                              <p className="text-sm text-red-600/80 mt-1">
                                Justificativa: {vol.justificativa}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            {viewingGroup && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEdit(viewingGroup);
              }}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Atualize os dados da escala. Ao alterar voluntários, o status de confirmação será resetado.'
                : 'Crie uma nova escala para o ministério'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ministério *</Label>
                <Select
                  value={formData.ministerio_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, ministerio_id: value, voluntarios_ids: [], funcao: '' });
                    fetchVoluntariosByMinisterio(value);
                    fetchFuncoesByMinisterio(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerios.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={formData.responsavel_id}
                  onValueChange={(value) => setFormData({ ...formData, responsavel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lideres.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.data, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => date && setFormData({ ...formData, data: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  placeholder="Ex: 09:00 - 12:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função *</Label>
                {formData.ministerio_id && funcoes.length === 0 ? (
                  <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-700">
                    <p className="text-sm font-medium">Nenhuma função ativa</p>
                    <p className="text-xs mt-0.5">Cadastre funções em "Funções de Ministério"</p>
                  </div>
                ) : (
                  <Select
                    value={formData.funcao}
                    onValueChange={(value) => setFormData({ ...formData, funcao: value })}
                    disabled={!formData.ministerio_id || funcoes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.ministerio_id ? "Selecione uma função..." : "Selecione um ministério primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) => setFormData({ ...formData, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Geral</Label>
              <Select
                value={formData.status_geral}
                onValueChange={(value) => setFormData({ ...formData, status_geral: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejada">Planejada</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voluntários * {editingGroup && <span className="text-muted-foreground font-normal">(alterar irá resetar confirmações)</span>}</Label>
              <Card>
                <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
                  {!formData.ministerio_id ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Selecione um ministério primeiro
                      </p>
                    </div>
                  ) : voluntarios.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-amber-600 font-medium">
                        Nenhum voluntário ativo neste ministério
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastre voluntários primeiro em "Voluntários por Ministério"
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {voluntarios.map((v) => {
                        const selectedFuncao = funcoes.find(f => f.nome === formData.funcao);
                        const isMainFunction = selectedFuncao && v.funcao_principal_id === selectedFuncao.id;
                        return (
                          <div 
                            key={v.id} 
                            className={cn(
                              "flex items-center space-x-2 p-1.5 rounded-md transition-colors",
                              isMainFunction && "bg-primary/10 border border-primary/20"
                            )}
                          >
                            <Checkbox
                              id={v.id}
                              checked={formData.voluntarios_ids.includes(v.id)}
                              onCheckedChange={() => toggleVoluntario(v.id)}
                            />
                            <label
                              htmlFor={v.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              <span>{v.nome}</span>
                              {isMainFunction && (
                                <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5 bg-primary/5">
                                  Função Principal
                                </Badge>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              {formData.voluntarios_ids.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.voluntarios_ids.length} voluntário(s) selecionado(s)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingGroup ? 'Salvar' : 'Criar Escala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Escala</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta escala? Isso removerá todos os {deletingGroup?.voluntarios.length || 0} voluntários atribuídos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
