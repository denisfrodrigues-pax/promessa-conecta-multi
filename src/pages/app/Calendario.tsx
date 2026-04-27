import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarioEscalas } from '@/components/calendario/CalendarioEscalas';
import { useMinhasEscalas, useProximasEscalas } from '@/hooks/useMinhasEscalas';
import { Calendar, CalendarDays, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function slugParaCorLight(slug: string): { text: string; bg: string } {
  const cores = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-rose-100', text: 'text-rose-700' },
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffff;
  }
  return cores[hash % cores.length];
}

function statusLabel(s: string) {
  if (s === 'confirmado') return { label: 'Confirmado', variant: 'success' as const };
  if (s === 'ausente') return { label: 'Recusado', variant: 'destructive' as const };
  return { label: 'Pendente', variant: 'warning' as const };
}

export default function Calendario() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const { data: calendarUrl } = useQuery({
    queryKey: ['google_calendar_url'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes_instituicao')
        .select('google_calendar_embed_url')
        .limit(1)
        .maybeSingle();
      return (data as any)?.google_calendar_embed_url as string | null ?? null;
    },
  });

  const { data: escalas = [], isLoading } = useMinhasEscalas(mes, ano);
  const { data: proximas = [] } = useProximasEscalas(30);

  function mesAnterior() {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  }

  function proximoMes() {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-8 max-w-3xl">

      {/* Seção 1 — Agenda da Igreja */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-promessa-600" />
          <h1 className="text-xl font-bold text-foreground">Agenda da Igreja</h1>
        </div>

        {calendarUrl ? (
          <div className="rounded-xl overflow-hidden border shadow-sm">
            <iframe
              src={calendarUrl}
              className="w-full h-[300px] md:h-[400px] block"
              frameBorder="0"
              scrolling="no"
              title="Calendário da Igreja"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Calendário não configurado.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Solicite ao administrador que configure a URL de incorporação do Google Calendar.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Seção 2 — Minhas Escalas */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-promessa-600" />
          <h2 className="text-xl font-bold text-foreground">Minhas Escalas</h2>
        </div>

        <CalendarioEscalas
          mes={mes}
          ano={ano}
          escalas={escalas}
          onMesAnterior={mesAnterior}
          onProximoMes={proximoMes}
          loading={isLoading}
        />

        {/* Próximas escalas — lista */}
        {proximas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Próximos 30 dias</h3>
            <div className="space-y-2">
              {proximas.map(e => {
                const cor = slugParaCorLight(e.ministerio_slug);
                const st = statusLabel(e.status);
                return (
                  <Card key={e.id} className="shadow-sm">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-promessa-50 flex flex-col items-center justify-center shrink-0 border border-promessa-100">
                            <span className="text-sm font-bold text-promessa-700 leading-tight">
                              {format(e.data, 'dd')}
                            </span>
                            <span className="text-[10px] text-promessa-500 uppercase font-medium">
                              {format(e.data, 'MMM', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{e.titulo_evento}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.ministerio_nome} · {e.funcao}
                            </p>
                          </div>
                        </div>
                        <Badge variant={st.variant} className="text-xs shrink-0">
                          {st.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {proximas.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center mt-6 py-6">
            Nenhuma escala nos próximos 30 dias.
          </p>
        )}
      </section>
    </div>
  );
}
