import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks, Search } from 'lucide-react';

interface Ministerio {
  id: string;
  nome: string;
}

interface Funcao {
  id: string;
  ministerio_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

interface FuncaoFormData {
  nome: string;
  descricao: string;
  ativo: boolean;
}

const initialFormData: FuncaoFormData = {
  nome: '',
  descricao: '',
  ativo: true,
};

export default function AdminFuncoesMinisterio() {
  const { churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState<Funcao | null>(null);
  const [deletingFuncao, setDeletingFuncao] = useState<Funcao | null>(null);
  const [formData, setFormData] = useState<FuncaoFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMinisterios();
  }, [churchId]);

  useEffect(() => {
    if (selectedMinisterio) {
      fetchFuncoes(selectedMinisterio);
    }
  }, [selectedMinisterio]);

  const fetchMinisterios = async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome')
        .eq('church_id', churchId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setMinisterios(data || []);
      if (data && data.length > 0 && !selectedMinisterio) {
        setSelectedMinisterio(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching ministerios:', error);
      toast.error('Erro ao carregar ministérios');
    } finally {
      setLoading(false);
    }
  };

  const fetchFuncoes = async (ministerioId: string) => {
    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('*')
        .eq('ministerio_id', ministerioId)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
      toast.error('Erro ao carregar funções');
    }
  };

  const handleCreate = () => {
    setEditingFuncao(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (funcao: Funcao) => {
    setEditingFuncao(funcao);
    setFormData({
      nome: funcao.nome,
      descricao: funcao.descricao || '',
      ativo: funcao.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFuncao) return;

    try {
      const { error } = await supabase
        .from('ministerio_funcoes')
        .delete()
        .eq('id', deletingFuncao.id);

      if (error) throw error;

      toast.success('Função excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setDeletingFuncao(null);
      if (selectedMinisterio) fetchFuncoes(selectedMinisterio);
    } catch (error) {
      console.error('Error deleting funcao:', error);
      toast.error('Erro ao excluir função');
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !selectedMinisterio) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingFuncao) {
        const { error } = await supabase
          .from('ministerio_funcoes')
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            ativo: formData.ativo,
          })
          .eq('id', editingFuncao.id);

        if (error) throw error;
        toast.success('Função atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('ministerio_funcoes')
          .insert({
            ministerio_id: selectedMinisterio,
            nome: formData.nome,
            descricao: formData.descricao || null,
            ativo: formData.ativo,
          });

        if (error) throw error;
        toast.success('Função criada com sucesso');
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingFuncao(null);
      if (selectedMinisterio) fetchFuncoes(selectedMinisterio);
    } catch (error: any) {
      console.error('Error saving funcao:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma função com este nome neste ministério');
      } else {
        toast.error('Erro ao salvar função');
      }
    }
  };

  const toggleAtivo = async (funcao: Funcao) => {
    try {
      const { error } = await supabase
        .from('ministerio_funcoes')
        .update({ ativo: !funcao.ativo })
        .eq('id', funcao.id);

      if (error) throw error;
      toast.success(`Função ${!funcao.ativo ? 'ativada' : 'desativada'}`);
      if (selectedMinisterio) fetchFuncoes(selectedMinisterio);
    } catch (error) {
      console.error('Error toggling funcao:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredFuncoes = funcoes.filter((f) =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMinisterioNome = ministerios.find((m) => m.id === selectedMinisterio)?.nome;

  return (
    <div className="space-y-8 bg-stone-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">Funções de Ministério</h1>
          <p className="text-stone-500">Gerencie as funções disponíveis em cada ministério</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Ministérios */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-stone-900">Ministérios</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {ministerios.map((ministerio) => (
                <button
                  key={ministerio.id}
                  onClick={() => setSelectedMinisterio(ministerio.id)}
                  className={`w-full text-left px-3 py-2 min-h-[44px] rounded-xl transition-colors ${
                    selectedMinisterio === ministerio.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-stone-100'
                  }`}
                >
                  {ministerio.nome}
                </button>
              ))}
              {ministerios.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-4">
                  Nenhum ministério encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Funções */}
        <div className="lg:col-span-3 space-y-4">
          {selectedMinisterio ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-stone-900">Funções - {selectedMinisterioNome}</CardTitle>
                    <p className="text-sm text-stone-500 mt-1">
                      {funcoes.length} função(ões) cadastrada(s)
                    </p>
                  </div>
                  <Button className="min-h-[44px]" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Função
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Buscar função..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFuncoes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-12">
                            <div className="flex flex-col items-center justify-center text-center">
                              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                                <ListChecks className="w-7 h-7 text-stone-400" />
                              </div>
                              <p className="text-stone-500 leading-relaxed">Nenhuma função cadastrada</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFuncoes.map((funcao) => (
                          <TableRow key={funcao.id}>
                            <TableCell className="font-medium text-stone-900">{funcao.nome}</TableCell>
                            <TableCell className="text-stone-500">
                              {funcao.descricao || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={funcao.ativo ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleAtivo(funcao)}
                              >
                                {funcao.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleEdit(funcao)} aria-label="Editar função">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-11 w-11 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setDeletingFuncao(funcao);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  aria-label="Excluir função"
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
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Selecione um ministério para gerenciar suas funções
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFuncao ? 'Editar Função' : 'Nova Função'}</DialogTitle>
            <DialogDescription>
              {editingFuncao
                ? 'Atualize os dados da função'
                : `Adicione uma nova função ao ministério ${selectedMinisterioNome}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Recepção, Louvor, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição das responsabilidades..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Função ativa</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingFuncao ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Função</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a função "{deletingFuncao?.nome}"? Esta ação não pode ser desfeita.
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
