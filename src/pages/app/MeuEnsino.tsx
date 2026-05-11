import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpenCheck, CheckCircle2, XCircle, TrendingUp, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistroEnsino {
  turma_id: string;
  turma_nome: string;
  data_aula: string;
  presente: boolean;
}

interface EstatisticaTurma {
  turma_id: string;
  turma_nome: string;
  total: number;
  presentes: number;
  percentual: number;
  ultimo: string;
}

export default function MeuEnsino() {
  const { profile } = useAuth();

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['meu_ensino', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_meu_ensino' as any);
      if (error) throw error;
      return (data ?? []) as RegistroEnsino[];
    },
    enabled: !!profile?.id,
  });

  const estatisticas: EstatisticaTurma[] = Object.values(
    registros.reduce((acc, r) => {
      if (!acc[r.turma_id]) {
        acc[r.turma_id] = { turma_id: r.turma_id, turma_nome: r.turma_nome, total: 0, presentes: 0, ultimo: r.data_aula };
      }
      acc[r.turma_id].total++;
      if (r.presente) acc[r.turma_id].presentes++;
      if (r.data_aula > acc[r.turma_id].ultimo) acc[r.turma_id].ultimo = r.data_aula;
      return acc;
    }, {} as Record<string, Omit<EstatisticaTurma, 'percentual'>>)
  ).map(e => ({ ...e, percentual: e.total > 0 ? Math.round((e.presentes / e.total) * 100) : 0 }));

  const totalPresencas = registros.filter(r => r.presente).length;
  const totalAulas = registros.length;
  const percentualGeral = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-promessa-900 flex items-center gap-2">
          <BookOpenCheck className="w-6 h-6 text-promessa-600" />
          Meu Ensino
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe sua frequência nas turmas</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : totalAulas === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpenCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma aula registrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sua presença aparecerá aqui assim que for marcada em uma chamada
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-promessa-700">{totalAulas}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />Aulas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-green-600">{totalPresencas}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Presenças
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${percentualGeral >= 75 ? 'text-green-600' : percentualGeral >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {percentualGeral}%
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />Frequência
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Por turma */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4" />Por Turma
            </h2>
            {estatisticas.map(est => (
              <Card key={est.turma_id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{est.turma_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Última aula: {format(new Date(est.ultimo + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={est.percentual >= 75 ? 'default' : est.percentual >= 50 ? 'secondary' : 'destructive'}>
                      {est.percentual}%
                    </Badge>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${est.percentual >= 75 ? 'bg-green-500' : est.percentual >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${est.percentual}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{est.presentes} de {est.total} aulas</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Histórico recente */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4" />Histórico Recente
            </h2>
            {registros.slice(0, 20).map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${r.presente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-75'}`}>
                <div>
                  <p className="text-sm font-medium">{r.turma_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.data_aula + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                {r.presente
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
