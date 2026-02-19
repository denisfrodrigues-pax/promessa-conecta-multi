import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Building2, Search, Pencil } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
  ativo: boolean;
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
  funcoes: { id: string; nome: string }[];
}

export default function AdminVoluntariosMinisterios() {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [voluntarios, setVoluntarios] = useState<MinisterioVoluntario[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditFuncoesDialogOpen, setIsEditFuncoesDialogOpen] = useState(false);
  
  const [deletingVoluntario, setDeletingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [editingVoluntario, setEditingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedFuncaoIds, setSelectedFuncaoIds] = useState<string[]>([]);

  useEffect(() => {
    fetchMinisterios();
  }, []);

  useEffect(() => {
    if (selectedMinisterio) {
      fetchVoluntarios(selectedMinisterio.id);
      fetchFuncoes(selectedMinisterio.id);
    }
  }, [selectedMinisterio]);

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome, ativo')
        .order('nome');

      if (error) throw error;
      setMinisterios(data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching ministerios:', error);
      toast.error(error.message || 'Erro ao carregar ministérios');
      setLoading(false);
    }
  };

  const fetchVoluntarios = async (ministerioId: string) => {
    try {
      const { data, error } = await supabase
        .from('ministerio_usuarios')
        .select(`
          id,
          ministerio_id,
          user_id,
          ativo,
          funcao_principal_id,
          profile:profiles!ministerio_voluntarios_user_id_fkey(nome, email)
        `)
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch functions for each volunteer from the junction table
      const voluntariosWithFuncoes = await Promise.all((data || []).map(async (vol) => {
        const { data: funcoesData } = await supabase
          .from('ministerio_voluntarios_funcoes')
          .select('funcao_id, ministerio_funcoes(id, nome)')
          .eq('ministerio_voluntario_id', vol.id);
        
        const funcoes = (funcoesData || [])
          .filter(f => f.ministerio_funcoes)
          .map(f => ({ id: f.ministerio_funcoes!.id, nome: f.ministerio_funcoes!.nome }));
        
        return { ...vol, funcoes };
      }));
      
      // Sort alphabetically by name
      const sorted = voluntariosWithFuncoes.sort((a, b) => 
        (a.profile?.nome || '').localeCompare(b.profile?.nome || '')
      );
      setVoluntarios(sorted);
    } catch (error: any) {
      console.error('Error fetching voluntarios:', error);
      toast.error(error.message || 'Erro ao carregar voluntários');
    }
  };

  const fetchFuncoes = async (ministerioId: string) => {
    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, nome, ativo')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
    }
  };

  const fetchAvailableProfiles = async () => {
    if (!selectedMinisterio) return;

    try {
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, user_id')
        .order('nome');

      if (profilesError) throw profilesError;

      const { data: existingVoluntarios, error: existingError } = await supabase
        .from('ministerio_usuarios')
        .select('user_id')
        .eq('ministerio_id', selectedMinisterio.id);

      if (existingError) throw existingError;

      const existingUserIds = new Set(existingVoluntarios?.map((v) => v.user_id) || []);
      
      const available = (allProfiles || []).filter(
        (profile) => !existingUserIds.has(profile.user_id)
      );

      setAvailableProfiles(available);
    } catch (error: any) {
      console.error('Error fetching available profiles:', error);
      toast.error(error.message || 'Erro ao carregar usuários disponíveis');
    }
  };

  const handleOpenAddDialog = () => {
    setSelectedProfileId('');
    setSelectedFuncaoIds([]);
    fetchAvailableProfiles();
    setIsAddDialogOpen(true);
  };

  const handleAddVoluntario = async () => {
    if (!selectedMinisterio || !selectedProfileId) {
      toast.error('Selecione um voluntário');
      return;
    }

    if (selectedFuncaoIds.length === 0) {
      toast.error('Selecione ao menos uma função');
      return;
    }

    const profile = availableProfiles.find((p) => p.id === selectedProfileId);
    if (!profile) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      // Insert voluntario
      const { data: newVol, error } = await supabase
        .from('ministerio_usuarios')
        .insert({
          ministerio_id: selectedMinisterio.id,
          user_id: profile.user_id,
          ativo: true,
          funcao_principal_id: selectedFuncaoIds[0] || null, // Keep first as principal for compatibility
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert all functions into junction table
      const funcoesInsert = selectedFuncaoIds.map(funcaoId => ({
        ministerio_voluntario_id: newVol.id,
        funcao_id: funcaoId,
      }));

      const { error: funcError } = await supabase
        .from('ministerio_voluntarios_funcoes')
        .insert(funcoesInsert);

      if (funcError) throw funcError;

      toast.success('Voluntário adicionado com sucesso');
      setIsAddDialogOpen(false);
      fetchVoluntarios(selectedMinisterio.id);
    } catch (error: any) {
      console.error('Error adding voluntario:', error);
      if (error.code === '23505') {
        toast.error('Este voluntário já está neste ministério');
      } else {
        toast.error(error.message || 'Erro ao adicionar voluntário');
      }
    }
  };

  const handleOpenEditFuncoesDialog = (voluntario: MinisterioVoluntario) => {
    setEditingVoluntario(voluntario);
    setSelectedFuncaoIds(voluntario.funcoes.map(f => f.id));
    setIsEditFuncoesDialogOpen(true);
  };

  const handleUpdateFuncoes = async () => {
    if (!editingVoluntario || !selectedMinisterio) return;

    if (selectedFuncaoIds.length === 0) {
      toast.error('Selecione ao menos uma função');
      return;
    }

    try {
      // Delete all existing functions
      await supabase
        .from('ministerio_voluntarios_funcoes')
        .delete()
        .eq('ministerio_voluntario_id', editingVoluntario.id);

      // Insert new functions
      const funcoesInsert = selectedFuncaoIds.map(funcaoId => ({
        ministerio_voluntario_id: editingVoluntario.id,
        funcao_id: funcaoId,
      }));

      const { error: funcError } = await supabase
        .from('ministerio_voluntarios_funcoes')
        .insert(funcoesInsert);

      if (funcError) throw funcError;

      // Update funcao_principal_id for compatibility
      await supabase
        .from('ministerio_usuarios')
        .update({ funcao_principal_id: selectedFuncaoIds[0] || null })
        .eq('id', editingVoluntario.id);

      toast.success('Funções atualizadas');
      setIsEditFuncoesDialogOpen(false);
      setEditingVoluntario(null);
      fetchVoluntarios(selectedMinisterio.id);
    } catch (error: any) {
      console.error('Error updating funcoes:', error);
      toast.error(error.message || 'Erro ao atualizar funções');
    }
  };

  const handleToggleAtivo = async (voluntario: MinisterioVoluntario) => {
    try {
      const { error } = await supabase
        .from('ministerio_usuarios')
        .update({ ativo: !voluntario.ativo })
        .eq('id', voluntario.id);

      if (error) throw error;

      toast.success(voluntario.ativo ? 'Voluntário desativado' : 'Voluntário ativado');
      if (selectedMinisterio) {
        fetchVoluntarios(selectedMinisterio.id);
      }
    } catch (error: any) {
      console.error('Error toggling voluntario:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const handleDeleteVoluntario = async () => {
    if (!deletingVoluntario || !selectedMinisterio) return;

    try {
      const { error } = await supabase
        .from('ministerio_usuarios')
        .delete()
        .eq('id', deletingVoluntario.id);

      if (error) throw error;

      toast.success('Voluntário removido do ministério');
      setIsDeleteDialogOpen(false);
      setDeletingVoluntario(null);
      fetchVoluntarios(selectedMinisterio.id);
    } catch (error: any) {
      console.error('Error deleting voluntario:', error);
      toast.error(error.message || 'Erro ao remover voluntário');
    }
  };

  const toggleFuncaoSelection = (funcaoId: string) => {
    setSelectedFuncaoIds(prev => 
      prev.includes(funcaoId)
        ? prev.filter(id => id !== funcaoId)
        : [...prev, funcaoId]
    );
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Voluntários por Ministério</h1>
        <p className="text-muted-foreground">Gerencie os voluntários de cada ministério</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Lista de Ministérios */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Ministérios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1 p-4">
                {ministerios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum ministério cadastrado</p>
                ) : (
                  ministerios.map((ministerio) => (
                    <button
                      key={ministerio.id}
                      onClick={() => setSelectedMinisterio(ministerio)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedMinisterio?.id === ministerio.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ministerio.nome}</span>
                        {!ministerio.ativo && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Voluntários */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedMinisterio ? `Voluntários - ${selectedMinisterio.nome}` : 'Selecione um Ministério'}
              </CardTitle>
              {selectedMinisterio && (
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Voluntário
                </Button>
              )}
            </div>
            {selectedMinisterio && (
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar voluntário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedMinisterio ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um ministério para ver seus voluntários</p>
              </div>
            ) : filteredVoluntarios.length === 0 ? (
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
                    <TableHead>Funções</TableHead>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {voluntario.funcoes.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Nenhuma</span>
                          ) : (
                            voluntario.funcoes.map(f => (
                              <Badge key={f.id} variant="secondary" className="text-xs">
                                {f.nome}
                              </Badge>
                            ))
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleOpenEditFuncoesDialog(voluntario)}
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
      </div>

      {/* Add Voluntario Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário</DialogTitle>
            <DialogDescription>
              Selecione um usuário para adicionar ao ministério {selectedMinisterio?.nome}
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
              <Label>Funções (selecione ao menos uma)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {funcoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma função cadastrada</p>
                ) : (
                  funcoes.map((funcao) => (
                    <div key={funcao.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`add-funcao-${funcao.id}`}
                        checked={selectedFuncaoIds.includes(funcao.id)}
                        onCheckedChange={() => toggleFuncaoSelection(funcao.id)}
                      />
                      <label
                        htmlFor={`add-funcao-${funcao.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {funcao.nome}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddVoluntario} disabled={!selectedProfileId || selectedFuncaoIds.length === 0}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Funcoes Dialog */}
      <Dialog open={isEditFuncoesDialogOpen} onOpenChange={setIsEditFuncoesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funções</DialogTitle>
            <DialogDescription>
              Defina as funções de {editingVoluntario?.profile?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Funções (selecione ao menos uma)</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto mt-2">
              {funcoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma função cadastrada</p>
              ) : (
                funcoes.map((funcao) => (
                  <div key={funcao.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-funcao-${funcao.id}`}
                      checked={selectedFuncaoIds.includes(funcao.id)}
                      onCheckedChange={() => toggleFuncaoSelection(funcao.id)}
                    />
                    <label
                      htmlFor={`edit-funcao-${funcao.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {funcao.nome}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFuncoesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateFuncoes} disabled={selectedFuncaoIds.length === 0}>
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
              Tem certeza que deseja remover {deletingVoluntario?.profile?.nome} do ministério {selectedMinisterio?.nome}?
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
