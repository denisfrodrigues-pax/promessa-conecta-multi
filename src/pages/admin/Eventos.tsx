import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Calendar, MapPin, Users, Edit, Trash2, MoreHorizontal, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  vagas: number | null;
  imagem_url: string | null;
  created_at: string;
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    local: '',
    vagas: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventosRes, inscricoesRes] = await Promise.all([
        supabase.from('eventos').select('*').order('data_inicio', { ascending: true }),
        supabase.from('eventos_inscricoes').select('evento_id'),
      ]);

      if (eventosRes.error) throw eventosRes.error;
      setEventos(eventosRes.data || []);

      // Count inscricoes per evento
      const counts: Record<string, number> = {};
      (inscricoesRes.data || []).forEach((i) => {
        counts[i.evento_id] = (counts[i.evento_id] || 0) + 1;
      });
      setInscricoes(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evento?: Evento) => {
    if (evento) {
      setEditingEvento(evento);
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao || '',
        data_inicio: evento.data_inicio.slice(0, 16),
        data_fim: evento.data_fim?.slice(0, 16) || '',
        local: evento.local || '',
        vagas: evento.vagas?.toString() || '',
      });
    } else {
      setEditingEvento(null);
      setFormData({
        titulo: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        local: '',
        vagas: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim() || !formData.data_inicio) {
      toast.error('Título e data são obrigatórios');
      return;
    }

    try {
      const data = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null,
        local: formData.local || null,
        vagas: formData.vagas ? parseInt(formData.vagas) : null,
      };

      if (editingEvento) {
        const { error } = await supabase.from('eventos').update(data).eq('id', editingEvento.id);
        if (error) throw error;
        toast.success('Evento atualizado com sucesso');
      } else {
        const { error } = await supabase.from('eventos').insert(data);
        if (error) throw error;
        toast.success('Evento criado com sucesso');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving evento:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Evento excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error deleting evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const exportInscricoes = async (eventoId: string, eventoTitulo: string) => {
    try {
      const { data, error } = await supabase
        .from('eventos_inscricoes')
        .select('profiles(nome, email, telefone)')
        .eq('evento_id', eventoId);

      if (error) throw error;

      const headers = ['Nome', 'Email', 'Telefone'];
      const rows = (data || []).map((i: any) => [
        i.profiles?.nome || '',
        i.profiles?.email || '',
        i.profiles?.telefone || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `inscricoes_${eventoTitulo.replace(/\s+/g, '_')}.csv`;
      link.click();
      toast.success('Lista exportada');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erro ao exportar lista');
    }
  };

  const isEventoPast = (dataInicio: string) => new Date(dataInicio) < new Date();

  const filteredEventos = eventos.filter((evento) =>
    evento.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Eventos</h1>
          <p className="text-muted-foreground">Gerenciamento de eventos e inscrições</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEventos.map((evento) => (
          <Card 
            key={evento.id} 
            className={`shadow-card hover:shadow-elevated transition-all duration-300 group ${isEventoPast(evento.data_inicio) ? 'opacity-60' : ''}`}
          >
            <div className="aspect-video bg-gradient-hero rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-primary-foreground/30" />
              </div>
              {isEventoPast(evento.data_inicio) && (
                <Badge className="absolute top-2 left-2 bg-muted text-muted-foreground">Encerrado</Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-card"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenDialog(evento)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportInscricoes(evento.id, evento.titulo)}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Inscritos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(evento.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-display font-semibold text-lg">{evento.titulo}</h3>
              {evento.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">{evento.descricao}</p>
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(evento.data_inicio), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {evento.local && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{evento.local}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {inscricoes[evento.id] || 0} inscritos
                    {evento.vagas && ` / ${evento.vagas} vagas`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredEventos.length === 0 && !loading && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum evento encontrado
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvento ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>
              {editingEvento ? 'Atualize as informações do evento' : 'Preencha os dados para criar um novo evento'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do evento"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do evento"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Local do evento"
              />
            </div>
            <div className="space-y-2">
              <Label>Vagas</Label>
              <Input
                type="number"
                value={formData.vagas}
                onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
                placeholder="Número de vagas (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingEvento ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
