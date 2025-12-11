import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Calendar, MapPin, Users, Edit, Trash2, MoreHorizontal, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

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

const StatCardSkeleton = () => (
  <Card className="shadow-card border-0">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const EventCardSkeleton = () => (
  <Card className="shadow-card border-0 overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </CardContent>
  </Card>
);

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
  const isEventoToday = (dataInicio: string) => {
    const today = new Date();
    const eventDate = new Date(dataInicio);
    return eventDate.toDateString() === today.toDateString();
  };

  const filteredEventos = eventos.filter((evento) =>
    evento.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: eventos.length,
    futuros: eventos.filter(e => !isEventoPast(e.data_inicio)).length,
    passados: eventos.filter(e => isEventoPast(e.data_inicio)).length,
    totalInscritos: Object.values(inscricoes).reduce((a, b) => a + b, 0),
  };

  const statCards = [
    {
      title: 'Total de Eventos',
      value: stats.total,
      icon: Calendar,
      gradient: 'from-promessa-500 to-promessa-700',
    },
    {
      title: 'Eventos Futuros',
      value: stats.futuros,
      icon: Clock,
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      title: 'Eventos Passados',
      value: stats.passados,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-700',
    },
    {
      title: 'Total de Inscritos',
      value: stats.totalInscritos,
      icon: Users,
      gradient: 'from-amber-500 to-amber-700',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Gerenciamento de eventos e inscrições</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          size="lg"
          className="bg-gradient-to-r from-promessa-500 to-promessa-700 hover:from-promessa-600 hover:to-promessa-800 shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          className="pl-12 h-12 rounded-xl border-border/50 bg-card shadow-sm focus:shadow-md transition-shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
        ) : (
          filteredEventos.map((evento, index) => {
            const isPast = isEventoPast(evento.data_inicio);
            const isToday = isEventoToday(evento.data_inicio);
            
            return (
              <Card 
                key={evento.id} 
                className={`shadow-card border-0 hover:shadow-elevated transition-all duration-300 group overflow-hidden animate-fade-in ${isPast ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="aspect-video bg-gradient-to-br from-promessa-500 to-promessa-700 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white/20" />
                  </div>
                  
                  {/* Status Badge */}
                  {isPast ? (
                    <Badge className="absolute top-3 left-3 bg-muted/90 text-muted-foreground backdrop-blur-sm">
                      <XCircle className="w-3 h-3 mr-1" />
                      Encerrado
                    </Badge>
                  ) : isToday ? (
                    <Badge className="absolute top-3 left-3 bg-promessa-500/90 text-white backdrop-blur-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Hoje
                    </Badge>
                  ) : (
                    <Badge className="absolute top-3 left-3 bg-blue-500/90 text-white backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Em breve
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleOpenDialog(evento)} className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportInscricoes(evento.id, evento.titulo)} className="cursor-pointer">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Inscritos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(evento.id)} className="text-destructive cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">{evento.titulo}</h3>
                  {evento.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{evento.descricao}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-promessa-500" />
                      <span>
                        {format(new Date(evento.data_inicio), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {evento.local && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-promessa-500" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Users className="w-4 h-4 text-promessa-500" />
                      <span>
                        {inscricoes[evento.id] || 0} inscritos
                        {evento.vagas && ` / ${evento.vagas} vagas`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        
        {/* Empty State */}
        {filteredEventos.length === 0 && !loading && (
          <Card className="col-span-full shadow-card border-0">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground mb-6">Crie seu primeiro evento para começar</p>
              <Button onClick={() => handleOpenDialog()} variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Criar Evento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingEvento ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>
              {editingEvento ? 'Atualize as informações do evento' : 'Preencha os dados para criar um novo evento'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do evento"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do evento"
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Fim</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Local do evento"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vagas</Label>
              <Input
                type="number"
                value={formData.vagas}
                onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
                placeholder="Número de vagas (opcional)"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-promessa-500 to-promessa-700">
              {editingEvento ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
