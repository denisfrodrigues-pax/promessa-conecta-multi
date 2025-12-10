import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  MapPin, 
  Edit,
  Trash2,
  Users,
  Baby
} from 'lucide-react';

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  observacao: string | null;
  status: string;
  presentes_count?: number;
}

const statusLabels: Record<string, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
};

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-800 border-green-200',
  inativa: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function KidsSalas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    capacidade: '20',
    observacao: '',
    status: 'ativa'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salas_kids')
        .select('*')
        .order('nome');

      if (error) throw error;

      // Get count of presentes for each sala
      const salasWithCount = await Promise.all(
        (data || []).map(async (sala) => {
          const { count } = await supabase
            .from('checkins_kids')
            .select('*', { count: 'exact', head: true })
            .eq('sala_id', sala.id)
            .eq('status', 'presente');
          return { ...sala, presentes_count: count || 0 };
        })
      );

      setSalas(salasWithCount);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingSala(null);
    setFormData({ nome: '', capacidade: '20', observacao: '', status: 'ativa' });
    setShowModal(true);
  };

  const openEditModal = (sala: Sala) => {
    setEditingSala(sala);
    setFormData({
      nome: sala.nome,
      capacidade: sala.capacidade.toString(),
      observacao: sala.observacao || '',
      status: sala.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingSala) {
        const { error } = await supabase
          .from('salas_kids')
          .update({
            nome: formData.nome,
            capacidade: parseInt(formData.capacidade) || 20,
            observacao: formData.observacao || null,
            status: formData.status
          })
          .eq('id', editingSala.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('salas_kids')
          .insert({
            nome: formData.nome,
            capacidade: parseInt(formData.capacidade) || 20,
            observacao: formData.observacao || null,
            status: formData.status
          });

        if (error) throw error;
      }

      toast({ title: editingSala ? 'Sala atualizada!' : 'Sala cadastrada!' });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sala: Sala) => {
    if (!confirm(`Tem certeza que deseja excluir a sala ${sala.nome}?`)) return;

    try {
      const { error } = await supabase
        .from('salas_kids')
        .delete()
        .eq('id', sala.id);

      if (error) throw error;

      toast({ title: 'Sala excluída!' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Erro ao excluir. A sala pode estar vinculada a check-ins.', variant: 'destructive' });
    }
  };

  const getOcupacaoPercent = (sala: Sala): number => {
    if (!sala.capacidade) return 0;
    return Math.min(100, ((sala.presentes_count || 0) / sala.capacidade) * 100);
  };

  const isLotada = (sala: Sala): boolean => {
    return (sala.presentes_count || 0) >= sala.capacidade;
  };

  const filtered = salas.filter(s => 
    search === '' || s.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salas</h1>
          <p className="text-muted-foreground">Gerencie as salas do ministério Kids</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Sala
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma sala encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(sala => (
            <Card key={sala.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{sala.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[sala.status]}>
                      {statusLabels[sala.status]}
                    </Badge>
                    {isLotada(sala) && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Lotada
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Baby className="w-4 h-4" />
                      Ocupação
                    </span>
                    <span className="font-medium">
                      {sala.presentes_count || 0} / {sala.capacidade}
                    </span>
                  </div>
                  <Progress value={getOcupacaoPercent(sala)} className="h-2" />
                </div>

                {sala.observacao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sala.observacao}
                  </p>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(sala)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sala)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSala ? 'Editar Sala' : 'Nova Sala'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Berçário, 3-5 anos"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                type="number"
                value={formData.capacidade}
                onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={formData.observacao}
                onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                placeholder="Observações sobre a sala"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}