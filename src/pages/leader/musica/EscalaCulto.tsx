import { useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronRight, ChevronDown, Music, Loader2, Inbox } from 'lucide-react';
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
    periodos_escala: {
      id: string;
      nome: string;
      mes: number;
      ano: number;
    } | null;
  } | null;
}

interface PeriodoGroup {
  periodoId: string;
  nome: string;
  mes: number | null;
  ano: number | null;
  eventos: EventoConvocado[];
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
  const [periodosAbertos, setPeriodosAbertos] = useState<Set<string>>(new Set());

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
            id, titulo, data_evento, horario_inicio, tipo,
            periodos_escala (id, nome, mes, ano)
          )
        `)
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as EventoConvocado[];
    },
    enabled: !!ministerioId,
  });

  const periodoGroups: PeriodoGroup[] = (() => {
    if (!eventos?.length) return [];
    const sorted = [...eventos].sort((a, b) =>
      (a.eventos_escala?.data_evento ?? '').localeCompare(b.eventos_escala?.data_evento ?? '')
    );
    const map = new Map<string, PeriodoGroup>();
    const order: PeriodoGroup[] = [];
    for (const em of sorted) {
      const p = em.eventos_escala?.periodos_escala;
      const key = p?.id ?? '__sem_periodo__';
      if (!map.has(key)) {
        const g: PeriodoGroup = {
          periodoId: key,
          nome: p?.nome ?? 'Sem período',
          mes: p?.mes ?? null,
          ano: p?.ano ?? null,
          eventos: [],
        };
        map.set(key, g);
        order.push(g);
      }
      map.get(key)!.eventos.push(em);
    }
    order.sort((a, b) => {
      if (a.ano !== b.ano) return (a.ano ?? 9999) - (b.ano ?? 9999);
      return (a.mes ?? 99) - (b.mes ?? 99);
    });
    return order;
  })();

  const togglePeriodo = (id: string) => {
    setPeriodosAbertos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      {periodoGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum evento convocado ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Os eventos aparecem aqui quando o admin convoca este ministério.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {periodoGroups.map((group) => {
            const isOpen = periodosAbertos.has(group.periodoId);
            return (
              <div key={group.periodoId} className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => togglePeriodo(group.periodoId)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-promessa-600" />
                      : <ChevronRight className="w-4 h-4 text-promessa-600" />
                    }
                    <span className="font-semibold text-sm text-foreground">{group.nome}</span>
                    <Badge variant="outline" className="text-xs ml-1">
                      {group.eventos.length} evento{group.eventos.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {group.mes !== null && group.ano !== null && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(group.ano, group.mes - 1, 1), 'MMMM yyyy', { locale: ptBR })}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="divide-y divide-border">
                    {group.eventos.map((ev) => {
                      const evento = ev.eventos_escala;
                      if (!evento) return null;
                      return (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => navigate(`/leader/${slug}/escala-culto/${evento.id}`)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-promessa-100 flex items-center justify-center">
                              <Music className="w-4 h-4 text-promessa-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{evento.titulo}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  {format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                  {evento.horario_inicio && ` · ${evento.horario_inicio.slice(0, 5)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={STATUS_VARIANT[ev.status] ?? 'outline'} className="text-xs">
                              {STATUS_LABEL[ev.status] ?? ev.status}
                            </Badge>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
