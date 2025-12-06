import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Users, MapPin, Clock, Edit, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number;
  visibilidade: string;
  lider_id: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  nome: string;
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function Grupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dia_semana: '',
    horario: '',
    local: '',
    capacidade: 20,
    visibilidade: 'publica',
    lider_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gruposRes, profilesRes] = await Promise.all([
        supabase.from('grupos').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, nome'),
      ]);

      if (gruposRes.error) throw gruposRes.error;
      setGrupos(gruposRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grupo?: Grupo) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nome: grupo.nome,
        descricao: grupo.descricao || '',
        dia_semana: grupo.dia_semana || '',
        horario: grupo.horario || '',
        local: grupo.local || '',
        capacidade: grupo.capacidade,
        visibilidade: grupo.visibilidade,
        lider_id: grupo.lider_id || '',
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nome: '',
        descricao: '',
        dia_semana: '',
        horario: '',
        local: '',
        capacidade: 20,
        visibilidade: 'publica',
        lider_id: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        dia_semana: formData.dia_semana || null,
        horario: formData.horario || null,
        local: formData.local || null,
        capacidade: formData.capacidade,
        visibilidade: formData.visibilidade as 'publica' | 'privada',
        lider_id: formData.lider_id || null,
      };

      if (editingGrupo) {
        const { error } = await supabase.from('grupos').update(data).eq('id', editingGrupo.id);
        if (error) throw error;
        toast.success('Grupo atualizado com sucesso');
      } else {
        const { error } = await supabase.from('grupos').insert(data);
        if (error) throw error;
        toast.success('Grupo criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving grupo:', error);
      toast.error('Erro ao salvar grupo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      const { error } = await supabase.from('grupos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Grupo excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting grupo:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  const getLiderNome = (liderId: string | null) => {
    if (!liderId) return 'Sem líder';
    const profile = profiles.find((p) => p.id === liderId);
    return profile?.nome || 'Desconhecido';
  };

  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Grupos</h1>
          <p className="text-muted-foreground">Gerenciamento de pequenos grupos e células</p>
        </div>
        <Button variant="gold" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar grupos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGrupos.map((grupo) => (
          <Card key={grupo.id} className="shadow-card hover:shadow-elevated transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-display">{grupo.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Líder: {getLiderNome(grupo.lider_id)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(grupo)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(grupo.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {grupo.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">{grupo.descricao}</p>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {grupo.dia_semana && grupo.horario && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {grupo.dia_semana} às {grupo.horario}
                  </div>
                )}
                {grupo.local && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {grupo.local}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Capacidade: {grupo.capacidade}</span>
                </div>
                <Badge variant={grupo.visibilidade === 'publica' ? 'default' : 'secondary'}>
                  {grupo.visibilidade === 'publica' ? 'Público' : 'Privado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredGrupos.length === 0 && !loading && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum grupo encontrado
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
            <DialogDescription>
              {editingGrupo ? 'Atualize as informações do grupo' : 'Preencha os dados para criar um novo grupo'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do grupo"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do grupo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select value={formData.dia_semana} onValueChange={(v) => setFormData({ ...formData, dia_semana: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Endereço ou local do encontro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  value={formData.capacidade}
                  onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 20 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select value={formData.visibilidade} onValueChange={(v) => setFormData({ ...formData, visibilidade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publica">Público</SelectItem>
                    <SelectItem value="privada">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Líder</Label>
              <Select value={formData.lider_id} onValueChange={(v) => setFormData({ ...formData, lider_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>{profile.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSave}>
              {editingGrupo ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
