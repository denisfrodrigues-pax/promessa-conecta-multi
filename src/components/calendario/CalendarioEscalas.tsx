import { useState, useMemo } from 'react';
import { format, startOfMonth, getDay, getDaysInMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EscalaCalendario } from '@/hooks/useMinhasEscalas';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Gera cor consistente a partir do slug do ministério
function slugParaCor(slug: string): string {
  const cores = [
    { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' },
    { bg: 'bg-teal-500', text: 'text-teal-700', light: 'bg-teal-100' },
    { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-100' },
    { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-100' },
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffff;
  }
  return cores[hash % cores.length].bg;
}

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

interface Props {
  mes: number;
  ano: number;
  escalas: EscalaCalendario[];
  onMesAnterior: () => void;
  onProximoMes: () => void;
  loading?: boolean;
}

export function CalendarioEscalas({ mes, ano, escalas, onMesAnterior, onProximoMes, loading }: Props) {
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const { diasGrid, escalasPorDia } = useMemo(() => {
    const primeiroDia = startOfMonth(new Date(ano, mes - 1, 1));
    const totalDias = getDaysInMonth(primeiroDia);
    const iniciaSemana = getDay(primeiroDia); // 0 = Dom

    const grid: (Date | null)[] = [
      ...Array(iniciaSemana).fill(null),
      ...Array.from({ length: totalDias }, (_, i) => new Date(ano, mes - 1, i + 1)),
    ];

    // Preencher até múltiplo de 7
    while (grid.length % 7 !== 0) grid.push(null);

    const map: Record<string, EscalaCalendario[]> = {};
    escalas.forEach(e => {
      const key = format(e.data, 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });

    return { diasGrid: grid, escalasPorDia: map };
  }, [mes, ano, escalas]);

  const escalasDodia = diaSelecionado
    ? escalasPorDia[format(diaSelecionado, 'yyyy-MM-dd')] ?? []
    : [];

  return (
    <div className="space-y-4">
      {/* Header do calendário */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={onMesAnterior}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onProximoMes}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grade */}
      <div className="rounded-xl border overflow-hidden">
        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 bg-muted/50">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7 divide-x divide-y border-t">
          {loading
            ? Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/20 animate-pulse" />
              ))
            : diasGrid.map((dia, i) => {
                if (!dia) return <div key={i} className="h-14 bg-muted/10" />;

                const key = format(dia, 'yyyy-MM-dd');
                const escalasDia = escalasPorDia[key] ?? [];
                const selecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
                const hoje = isToday(dia);

                return (
                  <button
                    key={i}
                    onClick={() => setDiaSelecionado(selecionado ? null : dia)}
                    className={cn(
                      'h-14 p-1 flex flex-col items-center gap-0.5 transition-colors hover:bg-muted/40',
                      selecionado && 'bg-promessa-50 ring-1 ring-inset ring-promessa-300',
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      hoje && 'bg-promessa-600 text-white',
                      !hoje && selecionado && 'text-promessa-700',
                      !hoje && !selecionado && 'text-foreground',
                    )}>
                      {format(dia, 'd')}
                    </span>
                    {/* Dots por ministério */}
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {escalasDia.slice(0, 3).map((e, j) => (
                        <span
                          key={j}
                          className={cn('w-1.5 h-1.5 rounded-full', slugParaCor(e.ministerio_slug))}
                        />
                      ))}
                      {escalasDia.length > 3 && (
                        <span className="text-[9px] text-muted-foreground leading-none">+{escalasDia.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Painel do dia selecionado */}
      {diaSelecionado && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-promessa-600" />
            {format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          {escalasDodia.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma escala neste dia.</p>
          ) : (
            <div className="space-y-2">
              {escalasDodia.map(e => {
                const cor = slugParaCorLight(e.ministerio_slug);
                return (
                  <div key={e.id} className={cn('flex items-start gap-3 p-2.5 rounded-lg', cor.bg)}>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', cor.text)}>{e.titulo_evento}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.ministerio_nome} · {e.funcao}
                      </p>
                    </div>
                    <Badge
                      variant={e.status === 'confirmado' ? 'success' : e.status === 'ausente' ? 'destructive' : 'warning'}
                      className="text-xs shrink-0"
                    >
                      {e.status === 'confirmado' ? 'Confirmado' : e.status === 'ausente' ? 'Recusado' : 'Pendente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
