import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpenCheck, BookOpen } from 'lucide-react';

const MES_ATUAL = new Date().getMonth() + 1;

const MES_NOMES: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
  8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro',
};

type Status = 'Concluída' | 'Parcial' | 'Ausente' | 'Atual' | 'Próxima';

interface DiscRow {
  id: string; mes: number; titulo: string; eixo_tematico: string; subtitulo: string;
  aulaCount: number; presentCount: number; status: Status;
}

interface EBData {
  cicloNome: string; cicloSub: string;
  discs: DiscRow[];
  currentDisc: DiscRow | undefined;
  currentAulas: any[];
  currentPresences: any[];
}

export default function MeuEnsino() {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery<EBData | null>({
    queryKey: ['meu_ensino_eb', profile?.id],
    queryFn: async () => {
      const { data: mats, error: mErr } = await supabase.from('eb_matriculas')
        .select('ciclo_id, eb_ciclos(nome, subtitulo)')
        .eq('perfil_id', profile!.id).eq('ativo', true).limit(1);
      if (mErr) throw mErr;
      if (!mats || mats.length === 0) return null;

      const mat = mats[0] as any;
      const ciclo = mat.eb_ciclos as any;

      const { data: discs, error: dErr } = await supabase.from('eb_disciplinas')
        .select('id, mes, titulo, eixo_tematico, subtitulo')
        .eq('ciclo_id', mat.ciclo_id).order('mes');
      if (dErr) throw dErr;

      const discIds = (discs || []).map((d: any) => d.id);
      if (discIds.length === 0) return { cicloNome: ciclo?.nome || '', cicloSub: ciclo?.subtitulo || '', discs: [], currentDisc: undefined, currentAulas: [], currentPresences: [] };

      const { data: aulasList, error: aErr } = await supabase.from('eb_aulas')
        .select('id, disciplina_id, numero, titulo').in('disciplina_id', discIds).order('numero');
      if (aErr) throw aErr;

      const aulaIds = (aulasList || []).map((a: any) => a.id);
      const { data: presencas, error: pErr } = aulaIds.length > 0
        ? await supabase.from('eb_presencas').select('aula_id, presente').eq('perfil_id', profile!.id).in('aula_id', aulaIds)
        : { data: [], error: null };
      if (pErr) throw pErr;

      const discRows: DiscRow[] = (discs || []).map((d: any) => {
        const da = (aulasList || []).filter((a: any) => a.disciplina_id === d.id);
        const presentCount = da.filter((a: any) =>
          (presencas || []).some((p: any) => p.aula_id === a.id && p.presente)
        ).length;
        let status: Status;
        if (d.mes === MES_ATUAL) status = 'Atual';
        else if (d.mes > MES_ATUAL) status = 'Próxima';
        else if (presentCount >= 3) status = 'Concluída';
        else if (presentCount >= 1) status = 'Parcial';
        else status = 'Ausente';
        return { id: d.id, mes: d.mes, titulo: d.titulo, eixo_tematico: d.eixo_tematico, subtitulo: d.subtitulo, aulaCount: da.length, presentCount, status };
      });

      const currentDisc = discRows.find(d => d.status === 'Atual');
      const currentAulas = currentDisc
        ? (aulasList || []).filter((a: any) => a.disciplina_id === currentDisc.id)
        : [];
      const currentPresences = currentDisc
        ? (presencas || []).filter((p: any) => currentAulas.some((a: any) => a.id === p.aula_id))
        : [];

      return { cicloNome: ciclo?.nome || '', cicloSub: ciclo?.subtitulo || '', discs: discRows, currentDisc, currentAulas, currentPresences };
    },
    enabled: !!profile?.id,
  });

  const statusStyle: Record<Status, { label: string; badge: string; row: string }> = {
    'Concluída': { label: '✅ Concluída', badge: 'bg-green-100 text-green-800', row: 'bg-green-50 border-green-200' },
    'Parcial':   { label: '⚠️ Parcial',   badge: 'bg-amber-100 text-amber-800', row: 'bg-amber-50 border-amber-200' },
    'Ausente':   { label: '❌ Ausente',   badge: 'bg-red-100 text-red-800',     row: 'bg-red-50 border-red-200 opacity-80' },
    'Atual':     { label: '📍 Atual',     badge: 'bg-blue-100 text-blue-800',   row: 'bg-blue-50 border-blue-200' },
    'Próxima':   { label: '🔵 Próxima',   badge: 'bg-gray-100 text-gray-600',   row: 'bg-gray-50 border-gray-200' },
  };

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
      <div className="h-24 bg-neutral-100 rounded animate-pulse" />
      <div className="h-48 bg-neutral-100 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-promessa-900 flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-promessa-600" />
          Meu Ensino
        </h1>
        {data && <p className="text-muted-foreground text-sm mt-1">{data.cicloNome} — {data.cicloSub}</p>}
      </div>

      {!data ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">Você ainda não está matriculado na Escola Bíblica</p>
            <p className="text-sm text-muted-foreground mt-1">Fale com o líder de ensino para se matricular</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress */}
          {(() => {
            const concluded = data.discs.filter(d => d.status === 'Concluída').length;
            const total = data.discs.length;
            const pct = total > 0 ? Math.round((concluded / total) * 100) : 0;
            return (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso do Ciclo</span>
                    <span className="text-sm text-muted-foreground">{concluded}/{total} concluídas</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{pct}% completo</p>
                </CardContent>
              </Card>
            );
          })()}

          {/* Current discipline */}
          {data.currentDisc && (
            <Card className="ring-2 ring-promessa-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {data.currentDisc.eixo_tematico}
                    </p>
                    <p className="font-semibold mt-0.5">{data.currentDisc.titulo}</p>
                    {data.currentDisc.subtitulo && (
                      <p className="text-sm text-muted-foreground">{data.currentDisc.subtitulo}</p>
                    )}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 shrink-0">
                    {MES_NOMES[data.currentDisc.mes] || `Mês ${data.currentDisc.mes}`}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {data.currentAulas.map((aula: any) => {
                    const present = data.currentPresences.some((p: any) => p.aula_id === aula.id && p.presente);
                    const recorded = data.currentPresences.some((p: any) => p.aula_id === aula.id);
                    return (
                      <div
                        key={aula.id}
                        title={aula.titulo}
                        className={`flex-1 h-8 rounded text-xs font-semibold inline-flex items-center justify-center ${
                          !recorded ? 'bg-gray-100 text-gray-400' :
                          present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        A{aula.numero}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data.currentPresences.filter((p: any) => p.presente).length} de {data.currentAulas.length} aulas presentes
                </p>
              </CardContent>
            </Card>
          )}

          {/* History */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Todas as Disciplinas
            </h2>
            {data.discs.map(d => {
              const s = statusStyle[d.status];
              return (
                <div key={d.id} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${s.row}`}>
                  <div>
                    <p className="text-sm font-medium">{d.titulo}</p>
                    <p className="text-xs text-muted-foreground">{MES_NOMES[d.mes] || `Mês ${d.mes}`}</p>
                  </div>
                  <Badge className={`${s.badge} text-xs shrink-0`}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
