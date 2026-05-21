import { useNavigate } from 'react-router-dom';
import { useAuth, MyMinistry } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ChevronRight, CalendarDays, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getMinisterioIconConfig } from '@/utils/ministerioIcons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

export default function VoluntarioDashboard() {
  const { profile, myMinistries, myMinistriesLoading } = useAuth();
  const navigate = useNavigate();

  const ministerioIds = myMinistries.map((m) => m.ministerio_id);
  const { data: tiposData = [] } = useQuery({
    queryKey: ['ministerios-tipos', ministerioIds.join(',')],
    queryFn: async () => {
      const { data } = await supabase.from('ministerios').select('id, tipo').in('id', ministerioIds);
      return (data ?? []) as { id: string; tipo: string | null }[];
    },
    enabled: ministerioIds.length > 0,
    staleTime: Infinity,
  });
  const tipoMap: Record<string, string | null> = Object.fromEntries(tiposData.map((m) => [m.id, m.tipo]));

  // Próximas 5 escalas do voluntário
  const { data: proximasEscalas = [], isLoading: loadingProximas } = useQuery({
    queryKey: ['voluntario-proximas-escalas', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('escalas')
        .select('id, data, funcao, status, ministerio_id, eventos_escala(titulo)')
        .eq('voluntario_id', profile.id)
        .gte('data', today)
        .order('data', { ascending: true })
        .limit(5);
      return (data ?? []) as Array<{
        id: string;
        data: string;
        funcao: string;
        status: string;
        ministerio_id: string;
        eventos_escala: { titulo: string } | null;
      }>;
    },
    enabled: !!profile?.id,
  });

  const ministerioNomeMap: Record<string, string> = Object.fromEntries(
    myMinistries.map((m) => [m.ministerio_id, m.nome])
  );

  const statusIcon = (status: string) => {
    if (status === 'confirmado') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    if (status === 'ausente') return <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
  };

  const statusLabel: Record<string, string> = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    ausente: 'Ausente',
  };

  const handleMinistryClick = (ministry: MyMinistry) => {
    if (ministry.slug) {
      navigate(`/volunteer/${ministry.slug}`);
    } else {
      toast.info(`Módulo "${ministry.nome}"`, { description: 'Em breve! Este módulo está sendo preparado.' });
    }
  };

  if (myMinistriesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel do Voluntário</h1>
        <p className="text-muted-foreground">
          Olá, {profile?.nome?.split(' ')[0]}! Acesse os módulos dos seus ministérios.
        </p>
      </div>

      {myMinistries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ministério vinculado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não está vinculado a um ministério ativo.
              Fale com a administração da igreja para ser adicionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myMinistries.map(ministry => {
            const config = getMinisterioIconConfig(tipoMap[ministry.ministerio_id]);
            const Icon = config.icon;
            return (
              <Card
                key={ministry.ministerio_id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleMinistryClick(ministry)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{ministry.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {ministry.slug ? 'Clique para acessar' : 'Em breve'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Próximas escalas */}
      {(loadingProximas || proximasEscalas.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-promessa-600" />
              Próximas Escalas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingProximas ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {proximasEscalas.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-10 text-center shrink-0">
                      <p className="text-sm font-bold text-promessa-700 leading-none">
                        {format(parseLocalDate(e.data), 'dd')}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {format(parseLocalDate(e.data), 'MMM', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.eventos_escala?.titulo ?? ministerioNomeMap[e.ministerio_id] ?? 'Escala'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{ministerioNomeMap[e.ministerio_id]}</span>
                        <span>·</span>
                        <span className="truncate">{e.funcao}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {statusIcon(e.status)}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {statusLabel[e.status] ?? e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
