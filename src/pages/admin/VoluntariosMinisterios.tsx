import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Building2 } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Profile {
  id: string;
  nome: string;
  user_id: string;
}

interface MinisterioVoluntario {
  id: string;
  ministerio_id: string;
  user_id: string;
  ativo: boolean;
  profile?: { nome: string };
}

export default function AdminVoluntariosMinisterios() {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [voluntarios, setVoluntarios] = useState<MinisterioVoluntario[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVoluntario, setDeletingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  useEffect(() => {
    fetchMinisterios();
  }, []);

  useEffect(() => {
    if (selectedMinisterio) {
      fetchVoluntarios(selectedMinisterio.id);
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
    } catch (error) {
      console.error('Error fetching ministerios:', error);
      toast.error('Erro ao carregar ministérios');
      setLoading(false);
    }
  };

  const fetchVoluntarios = async (ministerioId: string) => {
    try {
      const { data, error } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          id,
          ministerio_id,
          user_id,
          ativo,
          profile:profiles!ministerio_voluntarios_user_id_fkey(nome)
        `)
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoluntarios(data || []);
    } catch (error) {
      console.error('Error fetching voluntarios:', error);
      toast.error('Erro ao carregar voluntários');
    }
  };

  const fetchAvailableProfiles = async () => {
    if (!selectedMinisterio) return;

    try {
      // Get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, user_id')
        .order('nome');

      if (profilesError) throw profilesError;

      // Get profiles already in this ministry
      const { data: existingVoluntarios, error: existingError } = await supabase
        .from('ministerio_voluntarios')
        .select('user_id')
        .eq('ministerio_id', selectedMinisterio.id);

      if (existingError) throw existingError;

      const existingUserIds = new Set(existingVoluntarios?.map((v) => v.user_id) || []);
      
      // Filter out profiles already in this ministry
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
    fetchAvailableProfiles();
    setIsAddDialogOpen(true);
  };

  const handleAddVoluntario = async () => {
    if (!selectedMinisterio || !selectedProfileId) {
      toast.error('Selecione um voluntário');
      return;
    }

    // Find the profile to get the user_id
    const profile = availableProfiles.find((p) => p.id === selectedProfileId);
    if (!profile) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .insert({
          ministerio_id: selectedMinisterio.id,
          user_id: profile.user_id,
          ativo: true,
        });

      if (error) throw error;

      toast.success('Voluntário adicionado com sucesso');
      setIsAddDialogOpen(false);
      fetchVoluntarios(selectedMinisterio.id);
    } catch (error: any) {
      console.error('Error adding voluntario:', error);
      if (error.code === '23505') {
        toast.error('Este voluntário já está neste ministério');
      } else {
        toast.error('Erro ao adicionar voluntário');
      }
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
      if (selectedMinisterio) {
        fetchVoluntarios(selectedMinisterio.id);
      }
    } catch (error) {
      console.error('Error toggling voluntario:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteVoluntario = async () => {
    if (!deletingVoluntario || !selectedMinisterio) return;

    try {
      const { error } = await supabase
        .from('ministerio_voluntarios')
        .delete()
        .eq('id', deletingVoluntario.id);

      if (error) throw error;

      toast.success('Voluntário removido do ministério');
      setIsDeleteDialogOpen(false);
      setDeletingVoluntario(null);
      fetchVoluntarios(selectedMinisterio.id);
    } catch (error) {
      console.error('Error deleting voluntario:', error);
      toast.error('Erro ao remover voluntário');
    }
  };

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
            <div className="flex items-center justify-between">
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
          </CardHeader>
          <CardContent>
            {!selectedMinisterio ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um ministério para ver seus voluntários</p>
              </div>
            ) : voluntarios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum voluntário neste ministério</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Voluntário
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voluntarios.map((voluntario) => (
                    <TableRow key={voluntario.id}>
                      <TableCell className="font-medium">
                        {voluntario.profile?.nome || 'Nome não disponível'}
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
          <div className="py-4">
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
                      {profile.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
