import { useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronRight, ChevronDown, Loader2, Inbox, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
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

interface LiturgiaStatus {
  evento_id: string;
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

export default function Cultos() {
  const { ministerioId } = useOutletContext<OutletCtx>();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [periodosAbertos, setPeriodosAbertos] = useState<Set<string>>(new Set());

  const togglePeriodo = (id: string) => {
    setPeriodosAbertos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['celebracao_eventos_convocados', ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_ministerios')
        .select(`
          id,
          evento_id,
          status,
          eventos_escala (
            id, titulo, data_evento, horario_inicio,
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

  const { data: liturgiasExistentes } = useQuery({
    queryKey: ['liturgias_existentes', ministerioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('liturgia_culto')
        .select('evento_id')
        .eq('ministerio_id', ministerioId);
      return (data ?? []) as LiturgiaStatus[];
    },
    enabled: !!ministerioId,
  });

  const liturgiaSet = new Set((liturgiasExistentes ?? []).map((l) => l.evento_id));

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
    return order;
  })();

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
        <h1 className="text-2xl font-bold text-foreground">Cultos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Eventos em que o ministério de celebração foi convocado
        </p>
      </div>

      {(!eventos || eventos.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum evento convocado ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {periodoGroups.map((group) => {
            const mesAno = group.mes && group.ano
              ? format(new Date(group.ano, group.mes - 1, 1), 'MMMM yyyy', { locale: ptBR })
              : null;
            const pendentes = group.eventos.filter((e) => e.status === 'pendente').length;

            return (
              <div key={group.periodoId}>
                {/* Cabeçalho clicável do período */}
                <div
                  className="flex items-center gap-2 mb-1 px-1 py-2 rounded-lg hover:bg-muted/40 cursor-pointer select-none transition-colors"
                  onClick={() => togglePeriodo(group.periodoId)}
                >
                  {periodosAbertos.has(group.periodoId)
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div className="w-7 h-7 rounded-lg bg-promessa-100 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-promessa-600" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{group.nome}</span>
                    {mesAno && (
                      <Badge variant="secondary" className="text-xs capitalize">{mesAno}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {group.eventos.length} evento{group.eventos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {pendentes > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs shrink-0">
                      {pendentes} pendente{pendentes > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Eventos do período */}
                {periodosAbertos.has(group.periodoId) && (
                  <div className="space-y-2 pl-2 border-l-2 border-promessa-100 ml-4 mt-2">
                    {group.eventos.map((ev) => {
                      const evento = ev.eventos_escala;
                      if (!evento) return null;
                      const temLiturgia = liturgiaSet.has(evento.id);
                      return (
                        <Card
                          key={ev.id}
                          className="cursor-pointer hover:border-promessa-300 hover:shadow-md transition-all"
                          onClick={() => navigate(`/leader/${slug}/cultos/${evento.id}`)}
                        >
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-promessa-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{evento.titulo}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>
                                    {format(new Date(evento.data_evento + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    {evento.horario_inicio && ` · ${evento.horario_inicio.slice(0, 5)}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={temLiturgia ? 'default' : 'outline'}>
                                {temLiturgia ? 'Liturgia criada' : 'Sem liturgia'}
                              </Badge>
                              <Badge variant={STATUS_VARIANT[ev.status] ?? 'outline'}>
                                {STATUS_LABEL[ev.status] ?? ev.status}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
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
