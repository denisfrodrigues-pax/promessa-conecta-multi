import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronRight, Music, Loader2, Inbox } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
}

interface EventoConvocado {
  id: string;
  evento_id: string;
  status: string;
  eventos_escala: {
    id: string;
    titulo: string;
    data_evento: string;
    horario_inicio: string | null;
    tipo: string;
  } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  escala_criada: 'Escala criada',
  concluido: 'Concluído',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'destructive',
  escala_criada: 'default',
  concluido: 'secondary',
};

export default function EscalaCulto() {
  const { ministerioId } = useOutletContext<OutletCtx>();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['musica_eventos_convocados', ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_ministerios')
        .select(`
          id,
          evento_id,
          status,
          eventos_escala (
            id, titulo, data_evento, horario_inicio, tipo
          )
        `)
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as EventoConvocado[];
    },
    enabled: !!ministerioId,
  });

  const pendentes = eventos?.filter((e) => e.status !== 'concluido') ?? [];
  const concluidos = eventos?.filter((e) => e.status === 'concluido') ?? [];

  const renderCard = (ev: EventoConvocado) => {
    const evento = ev.eventos_escala;
    if (!evento) return null;

    return (
      <Card
        key={ev.id}
        className="cursor-pointer hover:border-promessa-300 hover:shadow-md transition-all"
        onClick={() => navigate(`/leader/${slug}/escala-culto/${evento.id}`)}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center">
              <Music className="w-5 h-5 text-promessa-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{evento.titulo}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {evento.horario_inicio && ` · ${evento.horario_inicio.slice(0, 5)}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={STATUS_VARIANT[ev.status] ?? 'outline'}>
              {STATUS_LABEL[ev.status] ?? ev.status}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-promessa-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Escala de Cultos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Eventos em que o ministério foi convocado
        </p>
      </div>

      {(!eventos || eventos.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum evento convocado ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Os eventos aparecem aqui quando o admin convoca este ministério.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendentes.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Próximos / Em andamento
              </h2>
              <div className="space-y-2">
                {pendentes.map(renderCard)}
              </div>
            </section>
          )}

          {concluidos.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Concluídos
              </h2>
              <div className="space-y-2">
                {concluidos.map(renderCard)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
