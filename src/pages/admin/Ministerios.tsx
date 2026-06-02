import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Music, User, ShieldCheck, PowerOff, Power } from 'lucide-react';
import { getMinisterioIconConfig } from '@/utils/ministerioIcons';

interface Ministerio {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  ativo: boolean;
  contato: string | null;
  is_core: boolean;
  slug: string | null;
  tipo: string | null;
  created_at: string;
  updated_at: string;
}

const generateSlug = (nome: string) =>
  nome.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

interface Profile {
  id: string;
  nome: string;
  email: string;
}

export default function AdminMinisterios() {
  const queryClient = useQueryClient();
  const { churchId } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [ministerioToDelete, setMinisterioToDelete] = useState<Ministerio | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    ativo: true,
    tipo_ministerio: '',
  });

  // Fetch ministérios
  const { data: ministerios = [], isLoading } = useQuery({
    queryKey: ['ministerios', churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerios')
        .select('*')
        .eq('church_id', churchId!)
        .order('nome');
      if (error) throw error;
      return data as Ministerio[];
    },
  });

  // Fetch leaders for dropdown
  const { data: leaders = [] } = useQuery({
    queryKey: ['leaders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'lider');
      if (error) throw error;
      if (data.length === 0) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, user_id')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;
      return profiles as (Profile & { user_id: string })[];
    },
  });

  const syncMinisterioLider = async (ministerioId: string, newLiderProfileId: string | null) => {
    const { error: deactivateError } = await supabase
      .from('ministerio_usuarios')
      .update({ ativo: false })
      .eq('ministerio_id', ministerioId)
      .eq('papel', 'lider');
    if (deactivateError) throw deactivateError;

    if (newLiderProfileId) {
      const leader = leaders.find(l => l.id === newLiderProfileId);
      if (!leader) return;
      await supabase
        .from('ministerio_usuarios')
        .upsert({
          ministerio_id: ministerioId,
          user_id: leader.user_id,
          papel: 'lider',
          ativo: true,
        }, { onConflict: 'ministerio_id,user_id' });
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: created, error } = await (supabase as any)
        .from('ministerios')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          lider_id: data.lider_id || null,
          ativo: data.ativo,
          slug: generateSlug(data.nome),
          tipo: data.tipo_ministerio,
        })
        .select('id')
        .single();
      if (error) throw error;
      await syncMinisterioLider(created.id, data.lider_id || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast.success('Ministério criado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar ministério', { description: error.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await (supabase as any)
        .from('ministerios')
        .update({
          nome: data.nome,
          descricao: data.descricao || null,
          lider_id: data.lider_id || null,
          ativo: data.ativo,
          tipo: data.tipo_ministerio || null,
        })
        .eq('id', id);
      if (error) throw error;
      await syncMinisterioLider(id, data.lider_id || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast.success('Ministério atualizado com sucesso!');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar ministério', { description: error.message });
    },
  });

  // Toggle ativo mutation
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('ministerios')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast.success(ativo ? 'Ministério ativado!' : 'Ministério inativado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar status', { description: error.message });
    },
  });

  // Delete mutation — guarda frontend contra is_core
  const deleteMutation = useMutation({
    mutationFn: async (ministerio: Ministerio) => {
      if (ministerio.is_core) {
        throw new Error('Ministérios core não podem ser excluídos. Use "Inativar" para desativá-lo.');
      }
      const { error } = await supabase.from('ministerios').delete().eq('id', ministerio.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast.success('Ministério excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setMinisterioToDelete(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir ministério', { description: error.message });
      setIsDeleteDialogOpen(false);
      setMinisterioToDelete(null);
    },
  });

  const handleOpenCreate = () => {
    setSelectedMinisterio(null);
    setFormData({ nome: '', descricao: '', lider_id: '', ativo: true, tipo_ministerio: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ministerio: Ministerio) => {
    setSelectedMinisterio(ministerio);
    setFormData({
      nome: ministerio.nome,
      descricao: ministerio.descricao || '',
      lider_id: ministerio.lider_id || '',
      ativo: ministerio.ativo ?? true,
      tipo_ministerio: ministerio.tipo || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMinisterio(null);
    setFormData({ nome: '', descricao: '', lider_id: '', ativo: true, tipo_ministerio: '' });
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!selectedMinisterio && !formData.tipo_ministerio) {
      toast.error('Tipo de Ministério é obrigatório');
      return;
    }
    if (selectedMinisterio) {
      updateMutation.mutate({ id: selectedMinisterio.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (ministerio: Ministerio) => {
    if (ministerio.is_core) {
      toast.error('Ministérios core não podem ser excluídos', {
        description: 'Use o botão "Inativar" para desativá-lo.',
      });
      return;
    }
    setMinisterioToDelete(ministerio);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ministerioToDelete) {
      deleteMutation.mutate(ministerioToDelete);
    }
  };

  const getLeaderName = (liderId: string | null) => {
    if (!liderId) return 'Sem líder';
    const leader = leaders.find(l => l.id === liderId);
    return leader?.nome || 'Líder não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Ministérios</h1>
          <p className="text-muted-foreground">Gerencie os ministérios da igreja</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Ministério
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : ministerios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum ministério cadastrado</p>
            <Button className="mt-4" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro ministério
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ministerios.map((ministerio) => (
            <Card
              key={ministerio.id}
              className={ministerio.is_core ? 'relative border-primary/30 bg-primary/5' : 'relative'}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      if (ministerio.is_core) {
                        return (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                          </div>
                        );
                      }
                      const ic = getMinisterioIconConfig(ministerio.tipo);
                      const Icon = ic.icon;
                      return (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ic.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight">{ministerio.nome}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant={ministerio.ativo ? 'default' : 'secondary'} className="text-xs">
                          {ministerio.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {ministerio.is_core ? (
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/5">
                            Core
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Geral
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ministerio.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ministerio.descricao}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">{getLeaderName(ministerio.lider_id)}</span>
                </div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(ministerio)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>

                  {/* Inativar / Ativar — disponível para todos */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAtivoMutation.mutate({ id: ministerio.id, ativo: !ministerio.ativo })}
                    disabled={toggleAtivoMutation.isPending}
                  >
                    {ministerio.ativo
                      ? <><PowerOff className="w-4 h-4 mr-1" />Inativar</>
                      : <><Power className="w-4 h-4 mr-1" />Ativar</>
                    }
                  </Button>

                  {/* Excluir — somente para ministérios não-core */}
                  {!ministerio.is_core && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(ministerio)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMinisterio ? 'Editar Ministério' : 'Criar Ministério'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMinisterio?.is_core && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Ministério core — não pode ser excluído.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Ministério *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Louvor, Mídia, Recepção..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o ministério..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_ministerio">Tipo de Ministério {!selectedMinisterio && '*'}</Label>
              <Select
                value={formData.tipo_ministerio || '__none__'}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_ministerio: value === '__none__' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Selecione...</SelectItem>
                  <SelectItem value="padrao">Padrão</SelectItem>
                  <SelectItem value="mca">MCA - Ministério de Crianças e Adolescentes</SelectItem>
                  <SelectItem value="musica">Música</SelectItem>
                  <SelectItem value="celebracao">Celebração</SelectItem>
                  <SelectItem value="recepcao">Recepção</SelectItem>
                  <SelectItem value="ensino">Ensino</SelectItem>
                  <SelectItem value="pequenos-grupos">Pequenos Grupos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lider">Líder</Label>
              <Select
                value={formData.lider_id || '__none__'}
                onValueChange={(value) =>
                  setFormData({ ...formData, lider_id: value === '__none__' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem líder</SelectItem>
                  {leaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked as boolean })}
              />
              <Label htmlFor="ativo" className="cursor-pointer">Ministério ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedMinisterio ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ministério?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ministério{' '}
              <strong>"{ministerioToDelete?.nome}"</strong>?{' '}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
