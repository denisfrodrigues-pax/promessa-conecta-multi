import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Building2, Search, Pencil, X, Tag } from 'lucide-react';

interface LeaderMinisterioContext {
  ministerioId: string;
  ministerioNome: string;
}

interface Funcao {
  id: string;
  nome: string;
  ativo: boolean;
  descricao: string | null;
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
  const { ministerioId, ministerioNome } = useOutletContext<LeaderMinisterioContext>();
  const { profile } = useAuth();
  const [voluntarios, setVoluntarios] = useState<MinisterioVoluntario[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Volunteer dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditFuncoesDialogOpen, setIsEditFuncoesDialogOpen] = useState(false);
  const [deletingVoluntario, setDeletingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [editingVoluntario, setEditingVoluntario] = useState<MinisterioVoluntario | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedFuncaoIds, setSelectedFuncaoIds] = useState<string[]>([]);

  // Function management state
  const [funcaoModalOpen, setFuncaoModalOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null);
  const [funcaoForm, setFuncaoForm] = useState({ nome: '', descricao: '' });
  const [funcaoDeleteConfirm, setFuncaoDeleteConfirm] = useState<Funcao | null>(null);
  const [savingFuncao, setSavingFuncao] = useState(false);

  useEffect(() => {
    if (ministerioId) {
      fetchVoluntarios();
      fetchFuncoes();
      setLoading(false);
    }
  }, [ministerioId]);

  const fetchVoluntarios = async () => {
    if (!ministerioId) return;

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
    if (!ministerioId) return;

    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, nome, ativo, descricao')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
    }
  };

  // ── Function management handlers ─────────────────────────────────────────

  const handleOpenCreateFuncao = () => {
    setEditingFuncao(null);
    setFuncaoForm({ nome: '', descricao: '' });
    setFuncaoModalOpen(true);
  };

  const handleOpenEditFuncao = (funcao: Funcao) => {
    setEditingFuncao(funcao);
    setFuncaoForm({ nome: funcao.nome, descricao: funcao.descricao ?? '' });
    setFuncaoModalOpen(true);
  };

  const handleSaveFuncao = async () => {
    if (!funcaoForm.nome.trim()) return toast.error('Nome é obrigatório');
    setSavingFuncao(true);
    try {
      if (editingFuncao) {
        const { error } = await supabase
          .from('ministerio_funcoes')
          .update({ nome: funcaoForm.nome.trim(), descricao: funcaoForm.descricao || null })
          .eq('id', editingFuncao.id);
        if (error) throw error;
        toast.success('Função atualizada');
      } else {
        const { error } = await supabase
          .from('ministerio_funcoes')
          .insert({ ministerio_id: ministerioId, nome: funcaoForm.nome.trim(), descricao: funcaoForm.descricao || null, ativo: true });
        if (error) throw error;
        toast.success('Função criada');
      }
      setFuncaoModalOpen(false);
      fetchFuncoes();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar função');
    } finally {
      setSavingFuncao(false);
    }
  };

  const handleDeleteFuncao = async () => {
    if (!funcaoDeleteConfirm) return;
    try {
      const { error } = await supabase
        .from('ministerio_funcoes')
        .update({ ativo: false })
        .eq('id', funcaoDeleteConfirm.id);
      if (error) throw error;
      toast.success('Função removida');
      setFuncaoDeleteConfirm(null);
      fetchFuncoes();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover função');
    }
  };

  // ── Volunteer handlers ────────────────────────────────────────────────────

  const fetchAvailableProfiles = async (search: string = '') => {
    if (!ministerioId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_eligible_volunteers_for_ministry', {
          p_ministerio_id: ministerioId,
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

    if (ministerioId) {
      setIsSearching(true);
      await fetchAvailableProfiles('');
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!isAddDialogOpen || !ministerioId) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      await fetchAvailableProfiles(profileSearchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [profileSearchTerm, isAddDialogOpen, ministerioId]);

  const handleAddVoluntario = async () => {
    if (!ministerioId || !selectedProfileId) {
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
      const { data: newVol, error } = await supabase
        .from('ministerio_usuarios')
        .upsert({
          ministerio_id: ministerioId,
          user_id: profileToAdd.user_id,
          ativo: true,
          funcao_principal_id: selectedFuncaoIds[0] || null,
        }, { onConflict: 'ministerio_id,user_id' })
        .select('id')
        .single();

      if (error) throw error;

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
      await supabase
        .from('ministerio_voluntarios_funcoes')
        .delete()
        .eq('ministerio_voluntario_id', editingVoluntario.id);

      const funcoesInsert = selectedFuncaoIds.map(funcaoId => ({
        ministerio_voluntario_id: editingVoluntario.id,
        funcao_id: funcaoId,
      }));

      const { error: funcError } = await supabase
        .from('ministerio_voluntarios_funcoes')
        .insert(funcoesInsert);

      if (funcError) throw funcError;

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

  if (!ministerioId) {
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
        <p className="text-muted-foreground mt-1">Gerencie os voluntários do ministério {ministerioNome}</p>
      </div>

      {/* ── Funções do Ministério ─────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              Funções do Ministério
            </CardTitle>
            <Button onClick={handleOpenCreateFuncao} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Função
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {funcoes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma função cadastrada. Crie a primeira função para começar a escalar voluntários.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenCreateFuncao}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Função
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {funcoes.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1 bg-secondary rounded-full pl-3 pr-1 py-1 text-sm font-medium"
                >
                  <span
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleOpenEditFuncao(f)}
                    title={f.descricao ?? undefined}
                  >
                    {f.nome}
                  </span>
                  <button
                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors ml-1"
                    onClick={() => setFuncaoDeleteConfirm(f)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Voluntários ──────────────────────────────────────────────────── */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Voluntários — {ministerioNome}
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
            <div className="overflow-x-auto">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Function create/edit Modal ──────────────────────────────────── */}
      <Dialog open={funcaoModalOpen} onOpenChange={setFuncaoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFuncao ? 'Editar Função' : 'Nova Função'}</DialogTitle>
            <DialogDescription>
              {editingFuncao ? 'Atualize os dados desta função.' : 'Crie uma nova função para o ministério.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="funcao-nome">Nome</Label>
              <Input
                id="funcao-nome"
                value={funcaoForm.nome}
                onChange={(e) => setFuncaoForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Guitarrista, Recepcionista, Professor..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcao-descricao">Descrição (opcional)</Label>
              <Textarea
                id="funcao-descricao"
                value={funcaoForm.descricao}
                onChange={(e) => setFuncaoForm(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Descreva as responsabilidades desta função..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFuncaoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFuncao} disabled={savingFuncao || !funcaoForm.nome.trim()}>
              {editingFuncao ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Function delete confirmation ────────────────────────────────── */}
      <AlertDialog open={!!funcaoDeleteConfirm} onOpenChange={(open) => { if (!open) setFuncaoDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover função</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a função "{funcaoDeleteConfirm?.nome}"? Voluntários com esta função não serão afetados, mas ela deixará de aparecer nas opções.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFuncao} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Volunteer Dialog ─────────────────────────────────────────── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário</DialogTitle>
            <DialogDescription>
              Busque e selecione um usuário para adicionar ao ministério {ministerioNome}
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
                  availableProfiles.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                        selectedProfileId === p.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedProfileId(p.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedProfileId === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedProfileId === p.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
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

      {/* ── Edit Volunteer Functions Dialog ──────────────────────────────── */}
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

      {/* ── Delete Volunteer Confirmation ────────────────────────────────── */}
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
