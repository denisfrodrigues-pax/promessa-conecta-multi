import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  User, 
  MessageCircle,
  Edit,
  Trash2,
  Phone,
  Baby
} from 'lucide-react';

interface Responsavel {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  criancas_count?: number;
}

const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  return `https://wa.me/55${cleaned}`;
};

export default function KidsResponsaveis() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState<Responsavel | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    observacoes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .order('nome');

      if (error) throw error;

      // Get count of criancas for each responsavel
      const responsaveisWithCount = await Promise.all(
        (data || []).map(async (resp) => {
          const { count } = await supabase
            .from('criancas_responsaveis')
            .select('*', { count: 'exact', head: true })
            .eq('responsavel_id', resp.id);
          return { ...resp, criancas_count: count || 0 };
        })
      );

      setResponsaveis(responsaveisWithCount);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingResponsavel(null);
    setFormData({ nome: '', telefone: '', observacoes: '' });
    setShowModal(true);
  };

  const openEditModal = (responsavel: Responsavel) => {
    setEditingResponsavel(responsavel);
    setFormData({
      nome: responsavel.nome,
      telefone: responsavel.telefone || '',
      observacoes: responsavel.observacoes || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingResponsavel) {
        const { error } = await supabase
          .from('responsaveis')
          .update({
            nome: formData.nome,
            telefone: formData.telefone || null,
            observacoes: formData.observacoes || null
          })
          .eq('id', editingResponsavel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('responsaveis')
          .insert({
            nome: formData.nome,
            telefone: formData.telefone || null,
            observacoes: formData.observacoes || null
          });

        if (error) throw error;
      }

      toast.success(editingResponsavel ? 'Responsável atualizado!' : 'Responsável cadastrado!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (responsavel: Responsavel) => {
    if (!confirm(`Tem certeza que deseja excluir ${responsavel.nome}?`)) return;

    try {
      const { error } = await supabase
        .from('responsaveis')
        .delete()
        .eq('id', responsavel.id);

      if (error) throw error;

      toast.success('Responsável excluído!');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir. O responsável pode estar vinculado a crianças ou check-ins.');
    }
  };

  const filtered = responsaveis.filter(r => 
    search === '' || r.nome.toLowerCase().includes(search.toLowerCase())
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
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-2xl font-bold text-foreground">Responsáveis</h1>
          <p className="text-muted-foreground">Gerencie os responsáveis das crianças</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Responsável
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
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum responsável encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(responsavel => (
            <Card key={responsavel.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{responsavel.nome}</p>
                        {hasValidPhone(responsavel.telefone) && (
                          <a
                            href={getWhatsAppUrl(responsavel.telefone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {responsavel.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {responsavel.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Baby className="w-4 h-4" />
                  <span>{responsavel.criancas_count} criança(s) vinculada(s)</span>
                </div>

                {responsavel.observacoes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {responsavel.observacoes}
                  </p>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(responsavel)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(responsavel)}
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
              {editingResponsavel ? 'Editar Responsável' : 'Novo Responsável'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações"
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