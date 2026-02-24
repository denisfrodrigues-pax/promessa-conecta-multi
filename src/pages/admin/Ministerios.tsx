import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Music, User } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  ativo: boolean;
  contato: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  nome: string;
  email: string;
}

export default function AdminMinisterios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [ministerioToDelete, setMinisterioToDelete] = useState<Ministerio | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    ativo: true,
    tipo_ministerio: '',
  });

  // Fetch ministérios
  const { data: ministerios = [], isLoading } = useQuery({
    queryKey: ['ministerios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerios')
        .select('*')
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

  // Helper: sync ministerio_usuarios leader for a given ministry
  const syncMinisterioLider = async (ministerioId: string, newLiderProfileId: string | null) => {
    // Step 1: Deactivate ALL current leaders for this ministry
    const { error: deactivateError } = await supabase
      .from('ministerio_usuarios')
      .update({ ativo: false })
      .eq('ministerio_id', ministerioId)
      .eq('papel', 'lider');

    if (deactivateError) throw deactivateError;

    // Step 2: If a new leader is set, upsert them as active leader
    if (newLiderProfileId) {
      const leader = leaders.find(l => l.id === newLiderProfileId);
      if (!leader) return;

      // Check if a record already exists for this user+ministry
      const { data: existing } = await supabase
        .from('ministerio_usuarios')
        .select('id')
        .eq('ministerio_id', ministerioId)
        .eq('user_id', leader.user_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ministerio_usuarios')
          .update({ papel: 'lider', ativo: true })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ministerio_usuarios')
          .insert({
            ministerio_id: ministerioId,
            user_id: leader.user_id,
            papel: 'lider',
            ativo: true,
          });
      }
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: created, error } = await supabase.from('ministerios').insert({
        nome: data.nome,
        descricao: data.descricao || null,
        lider_id: data.lider_id || null,
        ativo: data.ativo,
        tipo_ministerio: data.tipo_ministerio,
      }).select('id').single();
      if (error) throw error;

      // Sync ministerio_usuarios
      await syncMinisterioLider(created.id, data.lider_id || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast({ title: 'Ministério criado com sucesso!' });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar ministério', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('ministerios')
        .update({
          nome: data.nome,
          descricao: data.descricao || null,
          lider_id: data.lider_id || null,
          ativo: data.ativo,
        })
        .eq('id', id);
      if (error) throw error;

      // Sync ministerio_usuarios
      await syncMinisterioLider(id, data.lider_id || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast({ title: 'Ministério atualizado com sucesso!' });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar ministério', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ministerios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerios'] });
      toast({ title: 'Ministério excluído com sucesso!' });
      setIsDeleteDialogOpen(false);
      setMinisterioToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir ministério', description: error.message, variant: 'destructive' });
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
      tipo_ministerio: (ministerio as any).tipo_ministerio || '',
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
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!selectedMinisterio && !formData.tipo_ministerio) {
      toast({ title: 'Tipo de Ministério é obrigatório', variant: 'destructive' });
      return;
    }
    
    if (selectedMinisterio) {
      updateMutation.mutate({ id: selectedMinisterio.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (ministerio: Ministerio) => {
    setMinisterioToDelete(ministerio);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ministerioToDelete) {
      deleteMutation.mutate(ministerioToDelete.id);
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
            <Card key={ministerio.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{ministerio.nome}</CardTitle>
                      <Badge variant={ministerio.ativo ? 'default' : 'secondary'} className="mt-1">
                        {ministerio.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
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
                  <User className="w-4 h-4" />
                  <span>{getLeaderName(ministerio.lider_id)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(ministerio)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(ministerio)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
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
            {!selectedMinisterio && (
              <div className="space-y-2">
                <Label htmlFor="tipo_ministerio">Tipo de Ministério *</Label>
                <Select
                  value={formData.tipo_ministerio || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, tipo_ministerio: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled>Selecione...</SelectItem>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="midia">Mídia</SelectItem>
                    <SelectItem value="ensino">Ensino</SelectItem>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="lider">Líder</Label>
              <Select
                value={formData.lider_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, lider_id: value === '__none__' ? '' : value })}
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
              Tem certeza que deseja excluir o ministério "{ministerioToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
