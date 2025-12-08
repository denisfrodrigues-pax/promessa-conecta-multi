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
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Users, Filter, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Ministerio {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  nome: string;
  user_id: string;
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
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [voluntarios, setVoluntarios] = useState<Profile[]>([]);
  const [lideres, setLideres] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEscala, setEditingEscala] = useState<Escala | null>(null);
  const [deletingEscalaId, setDeletingEscalaId] = useState<string | null>(null);
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
    } catch (error) {
      console.error('Error fetching escalas:', error);
      toast.error('Erro ao carregar escalas');
    }
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
    setEditingEscala(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (escala: Escala) => {
    setEditingEscala(escala);
    setFormData({
      ministerio_id: escala.ministerio_id || '',
      data: new Date(escala.data),
      horario: escala.horario || '',
      funcao: escala.funcao,
      turno: escala.turno || '',
      responsavel_id: escala.responsavel_id || '',
      voluntarios_ids: escala.voluntario_id ? [escala.voluntario_id] : [],
      status_geral: escala.status_geral || 'planejada',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEscalaId) return;

    try {
      const { error } = await supabase
        .from('escalas')
        .delete()
        .eq('id', deletingEscalaId);

      if (error) throw error;

      toast.success('Escala excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setDeletingEscalaId(null);
      fetchEscalas();
    } catch (error) {
      console.error('Error deleting escala:', error);
      toast.error('Erro ao excluir escala');
    }
  };

  const handleSubmit = async () => {
    if (!formData.ministerio_id || !formData.funcao || formData.voluntarios_ids.length === 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingEscala) {
        // Update existing escala
        const { error } = await supabase
          .from('escalas')
          .update({
            ministerio_id: formData.ministerio_id,
            data: format(formData.data, 'yyyy-MM-dd'),
            horario: formData.horario || null,
            funcao: formData.funcao,
            turno: formData.turno || null,
            responsavel_id: formData.responsavel_id || null,
            voluntario_id: formData.voluntarios_ids[0],
            status_geral: formData.status_geral as 'planejada' | 'ativa' | 'concluida',
          })
          .eq('id', editingEscala.id);

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

  const toggleVoluntario = (voluntarioId: string) => {
    setFormData((prev) => ({
      ...prev,
      voluntarios_ids: prev.voluntarios_ids.includes(voluntarioId)
        ? prev.voluntarios_ids.filter((id) => id !== voluntarioId)
        : [...prev.voluntarios_ids, voluntarioId],
    }));
  };

  // Filtered escalas
  const filteredEscalas = escalas.filter((escala) => {
    if (filterMinisterio !== 'all' && escala.ministerio_id !== filterMinisterio) return false;
    if (filterVoluntario !== 'all' && escala.voluntario_id !== filterVoluntario) return false;
    if (filterData && format(new Date(escala.data), 'yyyy-MM-dd') !== format(filterData, 'yyyy-MM-dd')) return false;
    if (searchTerm && !escala.funcao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Group escalas by date for calendar view
  const escalasByDate = escalas.reduce((acc, escala) => {
    const date = escala.data;
    if (!acc[date]) acc[date] = [];
    acc[date].push(escala);
    return acc;
  }, {} as Record<string, Escala[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Escalas</h1>
          <p className="text-muted-foreground">Gerencie as escalas de ministérios e voluntários</p>
        </div>
        <Button variant="gold" onClick={handleCreate}>
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
                    <TableHead>Voluntário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscalas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma escala encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEscalas.map((escala) => (
                      <TableRow key={escala.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(escala.data), 'dd/MM/yyyy')}
                          </div>
                          {escala.horario && (
                            <div className="text-sm text-muted-foreground">{escala.horario}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{escala.funcao}</div>
                          {escala.turno && (
                            <div className="text-sm text-muted-foreground">{escala.turno}</div>
                          )}
                        </TableCell>
                        <TableCell>{escala.ministerios?.nome || '-'}</TableCell>
                        <TableCell>{escala.voluntario?.nome || '-'}</TableCell>
                        <TableCell>{getStatusBadge(escala.status)}</TableCell>
                        <TableCell>{getStatusGeralBadge(escala.status_geral)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(escala)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingEscalaId(escala.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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
                    hasEscala: Object.keys(escalasByDate).map((d) => new Date(d)),
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
                  {filterData && escalasByDate[format(filterData, 'yyyy-MM-dd')] ? (
                    <div className="space-y-2">
                      {escalasByDate[format(filterData, 'yyyy-MM-dd')].map((escala) => (
                        <div key={escala.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{escala.funcao}</p>
                              <p className="text-sm text-muted-foreground">
                                {escala.ministerios?.nome} • {escala.voluntario?.nome}
                              </p>
                            </div>
                            {getStatusBadge(escala.status)}
                          </div>
                        </div>
                      ))}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEscala ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>
              {editingEscala
                ? 'Atualize os dados da escala'
                : 'Crie uma nova escala para o ministério'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ministério *</Label>
                <Select
                  value={formData.ministerio_id}
                  onValueChange={(value) => setFormData({ ...formData, ministerio_id: value })}
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
                <Input
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  placeholder="Ex: Recepção, Louvor, etc."
                />
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
              <Label>Voluntários *</Label>
              <Card>
                <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {voluntarios.map((v) => (
                      <div key={v.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={v.id}
                          checked={formData.voluntarios_ids.includes(v.id)}
                          onCheckedChange={() => toggleVoluntario(v.id)}
                          disabled={editingEscala !== null}
                        />
                        <label
                          htmlFor={v.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {v.nome}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {!editingEscala && formData.voluntarios_ids.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.voluntarios_ids.length} voluntário(s) selecionado(s)
                </p>
              )}
              {editingEscala && (
                <p className="text-sm text-muted-foreground">
                  Para alterar voluntários, exclua esta escala e crie uma nova
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSubmit}>
              {editingEscala ? 'Salvar' : 'Criar Escala'}
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
              Tem certeza que deseja excluir esta escala? Esta ação não pode ser desfeita.
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
