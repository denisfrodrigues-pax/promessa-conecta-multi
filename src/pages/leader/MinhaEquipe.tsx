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
import { Checkbox } from '@/components/ui/checkbox';
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
  funcoes: { id: string; nome: string }[];
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
  const [isEditFuncoesDialogOpen, setIsEditFuncoesDialogOpen] = useState(false);
  
  const [deletingVoluntario, setDeletingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [editingVoluntario, setEditingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedFuncaoIds, setSelectedFuncaoIds] = useState<string[]>([]);

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
    } catch (error: any) {
      console.error('Error fetching ministerio:', error);
      toast.error(error.message || 'Erro ao carregar ministério');
      setLoading(false);
    }
  };

  const fetchVoluntarios = async () => {
    if (!ministerio) return;

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
        .eq('ministerio_id', ministerio.id)
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

  const fetchAvailableProfiles = async (search: string = '') => {
    if (!ministerio) return;

    try {
      // Use secure RPC function to fetch eligible volunteers
      const { data, error } = await supabase
        .rpc('get_eligible_volunteers_for_ministry', {
          p_ministerio_id: ministerio.id,
          p_search_term: search
        });

      if (error) throw error;

      setAvailableProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching available profiles:', error);
      toast.error(error.message || 'Erro ao carregar usuários disponíveis');
    }
  };

  const [profileSearchTerm, setProfileSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleOpenAddDialog = async () => {
    setSelectedProfileId('');
    setSelectedFuncaoIds([]);
    setProfileSearchTerm('');
    setAvailableProfiles([]);
    setIsAddDialogOpen(true);
    
    // Load initial list immediately when opening dialog
    if (ministerio) {
      setIsSearching(true);
      await fetchAvailableProfiles('');
      setIsSearching(false);
    }
  };

  // Debounced search for profiles
  useEffect(() => {
    if (!isAddDialogOpen || !ministerio) return;
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      await fetchAvailableProfiles(profileSearchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [profileSearchTerm, isAddDialogOpen, ministerio]);

  const handleAddVoluntario = async () => {
    if (!ministerio || !selectedProfileId) {
      toast.error('Selecione um voluntário');
      return;
    }

    if (selectedFuncaoIds.length === 0) {
      toast.error('Selecione ao menos uma função');
      return;
    }

    const profileToAdd = availableProfiles.find((p) => p.id === selectedProfileId);
    if (!profileToAdd) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      // Insert voluntario
      const { data: newVol, error } = await supabase
        .from('ministerio_usuarios')
        .insert({
          ministerio_id: ministerio.id,
          user_id: profileToAdd.user_id,
          ativo: true,
          funcao_principal_id: selectedFuncaoIds[0] || null,
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
      fetchVoluntarios();
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
    if (!editingVoluntario) return;

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
      fetchVoluntarios();
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
      fetchVoluntarios();
    } catch (error: any) {
      console.error('Error toggling voluntario:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const handleDeleteVoluntario = async () => {
    if (!deletingVoluntario) return;

    try {
      const { error } = await supabase
        .from('ministerio_usuarios')
        .delete()
        .eq('id', deletingVoluntario.id);

      if (error) throw error;

      toast.success('Voluntário removido do ministério');
      setIsDeleteDialogOpen(false);
      setDeletingVoluntario(null);
      fetchVoluntarios();
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

      {/* Add Voluntario Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário</DialogTitle>
            <DialogDescription>
              Busque e selecione um usuário para adicionar ao ministério {ministerio.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar Voluntário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou email..."
                  value={profileSearchTerm}
                  onChange={(e) => setProfileSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Search Results */}
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm mt-2">Buscando...</p>
                  </div>
                ) : availableProfiles.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {profileSearchTerm 
                      ? 'Nenhum voluntário encontrado' 
                      : 'Todos os usuários já estão neste ministério'}
                  </div>
                ) : (
                  availableProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                        selectedProfileId === profile.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedProfileId(profile.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedProfileId === profile.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedProfileId === profile.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{profile.nome}</p>
                          <p className="text-xs text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
