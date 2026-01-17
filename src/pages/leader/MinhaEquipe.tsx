import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Building2, Search, Pencil } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
}

interface Funcao {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Profile {
  id: string;
  nome: string;
  email: string;
  user_id: string;
}

interface MinisterioVoluntario {
  id: string;
  ministerio_id: string;
  user_id: string;
  ativo: boolean;
  funcao_principal_id: string | null;
  profile?: { nome: string; email: string };
  funcao_principal?: { nome: string } | null;
}

export default function LeaderMinhaEquipe() {
  const { profile } = useAuth();
  const [ministerio, setMinisterio] = useState<Ministerio | null>(null);
  const [voluntarios, setVoluntarios] = useState<MinisterioVoluntario[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditFuncaoDialogOpen, setIsEditFuncaoDialogOpen] = useState(false);
  
  const [deletingVoluntario, setDeletingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [editingVoluntario, setEditingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedFuncaoId, setSelectedFuncaoId] = useState<string>('');

  useEffect(() => {
    if (profile?.id) {
      fetchMinisterio();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (ministerio) {
      fetchVoluntarios();
      fetchFuncoes();
    }
  }, [ministerio]);

  const fetchMinisterio = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome')
        .eq('lider_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setMinisterio(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ministerio:', error);
      toast.error('Erro ao carregar ministério');
      setLoading(false);
    }
  };

  const fetchVoluntarios = async () => {
    if (!ministerio) return;

    try {
      const { data, error } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          id,
          ministerio_id,
          user_id,
          ativo,
          funcao_principal_id,
          profile:profiles!ministerio_voluntarios_user_id_fkey(nome, email),
          funcao_principal:ministerio_funcoes(nome)
        `)
        .eq('ministerio_id', ministerio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort alphabetically by name
      const sorted = (data || []).sort((a, b) => 
        (a.profile?.nome || '').localeCompare(b.profile?.nome || '')
      );
      setVoluntarios(sorted);
    } catch (error) {
      console.error('Error fetching voluntarios:', error);
      toast.error('Erro ao carregar voluntários');
    }
  };

  const fetchFuncoes = async () => {
    if (!ministerio) return;

    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, nome, ativo')
        .eq('ministerio_id', ministerio.id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
    }
  };

  const fetchAvailableProfiles = async () => {
    if (!ministerio) return;

    try {
      // Fetch users with schedulable roles (admin, financeiro, lider, voluntario)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'financeiro', 'lider', 'voluntario']);

      if (rolesError) throw rolesError;

      const schedulableUserIds = [...new Set((rolesData || []).map((r) => r.user_id))];

      if (schedulableUserIds.length === 0) {
        setAvailableProfiles([]);
        return;
      }

      // Fetch profiles for schedulable users
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, user_id')
        .in('user_id', schedulableUserIds)
        .order('nome');

      if (profilesError) throw profilesError;

      // Fetch existing volunteers in this ministry
      const { data: existingVoluntarios, error: existingError } = await supabase
        .from('ministerio_voluntarios')
        .select('user_id')
        .eq('ministerio_id', ministerio.id);

      if (existingError) throw existingError;

      const existingUserIds = new Set(existingVoluntarios?.map((v) => v.user_id) || []);
      
      // Filter out already added users
      const available = (allProfiles || []).filter(
        (profile) => !existingUserIds.has(profile.user_id)
      );

      setAvailableProfiles(available);
    } catch (error) {
      console.error('Error fetching available profiles:', error);
      toast.error('Erro ao carregar usuários disponíveis');
    }
  };

  const handleOpenAddDialog = () => {
    setSelectedProfileId('');
    setSelectedFuncaoId('');
    fetchAvailableProfiles();
    setIsAddDialogOpen(true);
  };

  const handleAddVoluntario = async () => {
    if (!ministerio || !selectedProfileId) {
      toast.error('Selecione um voluntário');
      return;
    }

    const profileToAdd = availableProfiles.find((p) => p.id === selectedProfileId);
    if (!profileToAdd) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .insert({
          ministerio_id: ministerio.id,
          user_id: profileToAdd.user_id,
          ativo: true,
          funcao_principal_id: selectedFuncaoId || null,
        });

      if (error) throw error;

      toast.success('Voluntário adicionado com sucesso');
      setIsAddDialogOpen(false);
      fetchVoluntarios();
    } catch (error: any) {
      console.error('Error adding voluntario:', error);
      if (error.code === '23505') {
        toast.error('Este voluntário já está neste ministério');
      } else {
        toast.error('Erro ao adicionar voluntário');
      }
    }
  };

  const handleOpenEditFuncaoDialog = (voluntario: MinisterioVoluntario) => {
    setEditingVoluntario(voluntario);
    setSelectedFuncaoId(voluntario.funcao_principal_id || '');
    setIsEditFuncaoDialogOpen(true);
  };

  const handleUpdateFuncao = async () => {
    if (!editingVoluntario) return;

    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .update({ funcao_principal_id: selectedFuncaoId || null })
        .eq('id', editingVoluntario.id);

      if (error) throw error;

      toast.success('Função principal atualizada');
      setIsEditFuncaoDialogOpen(false);
      setEditingVoluntario(null);
      fetchVoluntarios();
    } catch (error) {
      console.error('Error updating funcao:', error);
      toast.error('Erro ao atualizar função');
    }
  };

  const handleToggleAtivo = async (voluntario: MinisterioVoluntario) => {
    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .update({ ativo: !voluntario.ativo })
        .eq('id', voluntario.id);

      if (error) throw error;

      toast.success(voluntario.ativo ? 'Voluntário desativado' : 'Voluntário ativado');
      fetchVoluntarios();
    } catch (error) {
      console.error('Error toggling voluntario:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteVoluntario = async () => {
    if (!deletingVoluntario) return;

    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .delete()
        .eq('id', deletingVoluntario.id);

      if (error) throw error;

      toast.success('Voluntário removido do ministério');
      setIsDeleteDialogOpen(false);
      setDeletingVoluntario(null);
      fetchVoluntarios();
    } catch (error) {
      console.error('Error deleting voluntario:', error);
      toast.error('Erro ao remover voluntário');
    }
  };

  // Filter voluntarios by search term
  const filteredVoluntarios = voluntarios.filter((v) =>
    v.profile?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ministerio) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Nenhum Ministério Atribuído</h2>
            <p className="text-muted-foreground">
              Você ainda não é líder de nenhum ministério. Entre em contato com a administração.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Minha Equipe</h1>
        <p className="text-muted-foreground mt-1">Gerencie os voluntários do ministério {ministerio.nome}</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Voluntários - {ministerio.nome}
            </CardTitle>
            <Button onClick={handleOpenAddDialog} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Voluntário
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar voluntário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredVoluntarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Nenhum voluntário encontrado' : 'Nenhum voluntário neste ministério'}</p>
              {!searchTerm && (
                <Button variant="outline" className="mt-4" onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Voluntário
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Email</TableHead>
                  <TableHead>Função Principal</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVoluntarios.map((voluntario) => (
                  <TableRow key={voluntario.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{voluntario.profile?.nome || 'Nome não disponível'}</p>
                        <p className="text-sm text-muted-foreground">{voluntario.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {voluntario.funcao_principal?.nome || 'Não definida'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleOpenEditFuncaoDialog(voluntario)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={voluntario.ativo}
                          onCheckedChange={() => handleToggleAtivo(voluntario)}
                        />
                        <Badge variant={voluntario.ativo ? 'default' : 'secondary'}>
                          {voluntario.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingVoluntario(voluntario);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Voluntario Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário</DialogTitle>
            <DialogDescription>
              Selecione um usuário para adicionar ao ministério {ministerio.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Voluntário</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um voluntário" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      Todos os usuários já estão neste ministério
                    </div>
                  ) : (
                    availableProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div>
                          <span>{profile.nome}</span>
                          <span className="text-muted-foreground ml-2 text-sm">({profile.email})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Função Principal (opcional)</Label>
              <Select value={selectedFuncaoId} onValueChange={setSelectedFuncaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {funcoes.map((funcao) => (
                    <SelectItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVoluntario} disabled={!selectedProfileId}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Funcao Dialog */}
      <Dialog open={isEditFuncaoDialogOpen} onOpenChange={setIsEditFuncaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função Principal</DialogTitle>
            <DialogDescription>
              Defina a função principal de {editingVoluntario?.profile?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Função Principal</Label>
            <Select value={selectedFuncaoId} onValueChange={setSelectedFuncaoId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {funcoes.map((funcao) => (
                  <SelectItem key={funcao.id} value={funcao.id}>
                    {funcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFuncaoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateFuncao}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Voluntário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {deletingVoluntario?.profile?.nome} do ministério?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteVoluntario}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
