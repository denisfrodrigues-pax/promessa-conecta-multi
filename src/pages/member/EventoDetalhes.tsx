import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowLeft,
  CalendarPlus,
  Share2
} from 'lucide-react';
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
}

export default function MemberEventoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [totalInscritos, setTotalInscritos] = useState(0);
  const [inscrevendo, setInscrevendo] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvento();
    }
  }, [id, profile]);

  const fetchEvento = async () => {
    try {
      const [eventoRes, inscricoesRes, userInscricaoRes] = await Promise.all([
        supabase.from('eventos').select('*').eq('id', id).maybeSingle(),
        supabase.from('eventos_inscricoes').select('id', { count: 'exact', head: true }).eq('evento_id', id),
        profile 
          ? supabase.from('eventos_inscricoes').select('id').eq('evento_id', id).eq('usuario_id', profile.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (eventoRes.error) throw eventoRes.error;
      
      setEvento(eventoRes.data);
      setTotalInscritos(inscricoesRes.count || 0);
      setInscrito(!!userInscricaoRes.data);
    } catch (error) {
      console.error('Error fetching evento:', error);
      toast.error('Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleInscrever = async () => {
    if (!profile) {
      toast.error('Faça login para se inscrever');
      return;
    }

    setInscrevendo(true);
    try {
      const { error } = await supabase.from('eventos_inscricoes').insert({
        evento_id: id,
        usuario_id: profile.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já está inscrito neste evento');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Inscrição realizada com sucesso!');
      setInscrito(true);
      setTotalInscritos(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao realizar inscrição');
    } finally {
      setInscrevendo(false);
    }
  };

  const handleCancelarInscricao = async () => {
    if (!profile) return;

    setInscrevendo(true);
    try {
      const { error } = await supabase
        .from('eventos_inscricoes')
        .delete()
        .eq('evento_id', id)
        .eq('usuario_id', profile.id);

      if (error) throw error;

      toast.success('Inscrição cancelada');
      setInscrito(false);
      setTotalInscritos(prev => prev - 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cancelar inscrição');
    } finally {
      setInscrevendo(false);
    }
  };

  const generateCalendarUrl = () => {
    if (!evento) return '';
    
    const startDate = new Date(evento.data_inicio);
    const endDate = evento.data_fim ? new Date(evento.data_fim) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: evento.titulo,
      dates: `${formatForCalendar(startDate)}/${formatForCalendar(endDate)}`,
      details: evento.descricao || '',
      location: evento.local || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-display font-semibold mb-2">Evento não encontrado</h2>
            <p className="text-muted-foreground mb-6">Este evento pode ter sido removido ou o link está incorreto.</p>
            <Button asChild>
              <Link to="/eventos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Eventos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vagasDisponiveis = evento.vagas ? evento.vagas - totalInscritos : null;
  const esgotado = vagasDisponiveis !== null && vagasDisponiveis <= 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Back button */}
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link to="/eventos">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero image/banner */}
          {evento.imagem_url ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img 
                src={evento.imagem_url} 
                alt={evento.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h1 className="text-3xl font-display font-bold">{evento.titulo}</h1>
              </div>
            </div>
          ) : (
            <Card className="bg-gradient-hero text-primary-foreground">
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h1 className="text-3xl font-display font-bold">{evento.titulo}</h1>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Sobre o Evento</CardTitle>
            </CardHeader>
            <CardContent>
              {evento.descricao ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{evento.descricao}</p>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma descrição disponível.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event info card */}
          <Card className="shadow-card sticky top-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {format(new Date(evento.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(evento.data_inicio), 'EEEE', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {format(new Date(evento.data_inicio), 'HH:mm')}
                    {evento.data_fim && ` - ${format(new Date(evento.data_fim), 'HH:mm')}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Horário</p>
                </div>
              </div>

              {/* Location */}
              {evento.local && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{evento.local}</p>
                    <p className="text-sm text-muted-foreground">Local</p>
                  </div>
                </div>
              )}

              {/* Inscritos */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {totalInscritos} inscrito{totalInscritos !== 1 ? 's' : ''}
                    {evento.vagas && ` / ${evento.vagas} vagas`}
                  </p>
                  <p className="text-sm text-muted-foreground">Participantes</p>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-border" />

              {/* Status badge */}
              {inscrito && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">Você está inscrito!</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {inscrito ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleCancelarInscricao}
                    disabled={inscrevendo}
                  >
                    {inscrevendo ? 'Cancelando...' : 'Cancelar Inscrição'}
                  </Button>
                ) : esgotado ? (
                  <Badge variant="secondary" className="w-full justify-center py-3">
                    Vagas Esgotadas
                  </Badge>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={handleInscrever}
                    disabled={inscrevendo}
                  >
                    {inscrevendo ? 'Inscrevendo...' : 'Inscrever-se'}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <a href={generateCalendarUrl()} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Adicionar ao Calendário
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}