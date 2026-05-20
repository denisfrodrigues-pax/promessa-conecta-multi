import { useNavigate } from 'react-router-dom';
import { useAuth, MyMinistry } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getMinisterioIconConfig } from '@/utils/ministerioIcons';

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
    </div>
  );
}
