import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Bell, Edit, Trash2, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  publico: boolean;
  data_publicacao: string;
  criado_por: string | null;
  created_at: string;
}

export default function Avisos() {
  const { profile, churchId: authChurchId } = useAuth();
  const { church } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    publico: true,
  });

  useEffect(() => {
    fetchAvisos();
  }, [churchId]);

  const fetchAvisos = async () => {
    if (!churchId) return;
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('church_id', churchId ?? '')
        .order('data_publicacao', { ascending: false });

      if (error) throw error;
      setAvisos(data || []);
    } catch (error) {
      console.error('Error fetching avisos:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (aviso?: Aviso) => {
    if (aviso) {
      setEditingAviso(aviso);
      setFormData({
        titulo: aviso.titulo,
        conteudo: aviso.conteudo,
        publico: aviso.publico,
      });
    } else {
      setEditingAviso(null);
      setFormData({
        titulo: '',
        conteudo: '',
        publico: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }

    try {
      const data = {
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        publico: formData.publico,
        criado_por: profile?.id || null,
        church_id: churchId,
      };

      if (editingAviso) {
        const { error } = await supabase.from('avisos').update(data).eq('id', editingAviso.id);
        if (error) throw error;
        toast.success('Aviso atualizado com sucesso');
      } else {
        const { error } = await supabase.from('avisos').insert(data);
        if (error) throw error;
        toast.success('Aviso publicado com sucesso');
      }

      setIsDialogOpen(false);
      fetchAvisos();
    } catch (error) {
      console.error('Error saving aviso:', error);
      toast.error('Erro ao salvar aviso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      const { error } = await supabase.from('avisos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Aviso excluído com sucesso');
      fetchAvisos();
    } catch (error) {
      console.error('Error deleting aviso:', error);
      toast.error('Erro ao excluir aviso');
    }
  };

  const togglePublico = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase.from('avisos').update({ publico: !currentValue }).eq('id', id);
      if (error) throw error;
      toast.success(currentValue ? 'Aviso ocultado' : 'Aviso publicado');
      fetchAvisos();
    } catch (error) {
      console.error('Error toggling aviso:', error);
      toast.error('Erro ao atualizar aviso');
    }
  };

  const filteredAvisos = avisos.filter((aviso) =>
    aviso.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Avisos</h1>
          <p className="text-muted-foreground">Gerenciamento de comunicados e avisos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Aviso
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar avisos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredAvisos.map((aviso) => (
          <Card key={aviso.id} className="shadow-card hover:shadow-elevated transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-semibold text-lg">{aviso.titulo}</h3>
                    <Badge variant={aviso.publico ? 'default' : 'secondary'}>
                      {aviso.publico ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Público
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Oculto
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{aviso.conteudo}</p>
                  <p className="text-sm text-muted-foreground">
                    Publicado em {format(new Date(aviso.data_publicacao), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(aviso)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => togglePublico(aviso.id, aviso.publico)}>
                      {aviso.publico ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Publicar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(aviso.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredAvisos.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum aviso encontrado
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAviso ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
            <DialogDescription>
              {editingAviso ? 'Atualize as informações do aviso' : 'Preencha os dados para publicar um novo aviso'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do aviso"
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Conteúdo do aviso"
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Publicar imediatamente</Label>
              <Switch
                checked={formData.publico}
                onCheckedChange={(checked) => setFormData({ ...formData, publico: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingAviso ? 'Salvar' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
