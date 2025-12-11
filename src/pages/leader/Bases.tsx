import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Network, 
  Users, 
  Target, 
  Clock, 
  MapPin, 
  Eye, 
  ChevronRight,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

// ===== INTERFACES =====
interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  lider_nome?: string;
  membros_count: number;
}

// ===== SKELETON COMPONENT =====
function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      {/* List Skeletons */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ===== EMPTY STATE COMPONENT =====
function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <Network className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Você ainda não lidera nenhuma base 😊
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Quando uma base for atribuída a você, ela aparecerá aqui com todas as informações 
          sobre membros, horários e local de encontro.
        </p>
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====
export default function LeaderBases() {
  const navigate = useNavigate();
  const { profile, isLider, loading: authLoading } = useAuth();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not leader
  useEffect(() => {
    if (!authLoading && !isLider) {
      navigate('/member');
    }
  }, [authLoading, isLider, navigate]);

  // Fetch data
  useEffect(() => {
    if (profile?.id) {
      fetchBases();
    }
  }, [profile?.id]);

  const fetchBases = async () => {
    setLoading(true);
    try {
      // Fetch bases where current user is leader
      const { data: basesData, error: basesError } = await supabase
        .from('bases')
        .select(`
          id,
          nome,
          descricao,
          dia_semana,
          horario,
          local,
          capacidade,
          lider:profiles!bases_lider_id_fkey (
            nome
          )
        `)
        .eq('lider_id', profile?.id)
        .eq('status', 'ativo')
        .order('nome');

      if (basesError) throw basesError;

      if (!basesData || basesData.length === 0) {
        setBases([]);
        setLoading(false);
        return;
      }

      // Fetch member counts for all bases in parallel
      const basesWithCounts = await Promise.all(
        basesData.map(async (base) => {
          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');

          // Handle lider field which could be an array or object
          const liderData = Array.isArray(base.lider) ? base.lider[0] : base.lider;

          return {
            id: base.id,
            nome: base.nome,
            descricao: base.descricao,
            dia_semana: base.dia_semana,
            horario: base.horario,
            local: base.local,
            capacidade: base.capacidade,
            lider_nome: liderData?.nome,
            membros_count: count || 0,
          };
        })
      );

      setBases(basesWithCounts);
    } catch (error: any) {
      console.error('Error fetching bases:', error);
      toast.error('Não foi possível carregar suas bases');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const totalBases = bases.length;
  const totalMembros = bases.reduce((sum, base) => sum + base.membros_count, 0);
  const totalCapacidade = bases.reduce((sum, base) => sum + (base.capacidade || 20), 0);

  // Auth loading
  if (authLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/lider" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Início
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Minhas Bases</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <Network className="h-7 w-7 text-primary" />
          Minhas Bases
        </h1>
        <p className="text-muted-foreground mt-1">Bases que você lidera</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : bases.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total de Bases */}
            <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shadow-sm">
                    <Network className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-display text-primary">{totalBases}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total de Bases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Membros */}
            <Card className="shadow-card border-0 bg-gradient-to-br from-promessa/5 to-promessa/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-promessa/15 flex items-center justify-center shadow-sm">
                    <Users className="w-7 h-7 text-promessa" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-display text-promessa">{totalMembros}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total de Membros</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capacidade Total */}
            <Card className="shadow-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center shadow-sm">
                    <Target className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-display text-amber-700 dark:text-amber-500">{totalCapacidade}</p>
                    <p className="text-sm text-muted-foreground font-medium">Capacidade Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bases List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Suas Bases ({totalBases})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bases.map((base) => {
                const ocupacao = Math.round((base.membros_count / (base.capacidade || 20)) * 100);
                const isLotada = ocupacao >= 100;

                return (
                  <Card 
                    key={base.id} 
                    className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                            {base.nome}
                          </CardTitle>
                          {base.descricao && (
                            <CardDescription className="line-clamp-1 mt-1">
                              {base.descricao}
                            </CardDescription>
                          )}
                        </div>
                        {isLotada && (
                          <Badge variant="destructive" className="shrink-0">Lotada</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {/* Membros */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>
                            <span className="font-medium text-foreground">{base.membros_count}</span>
                            /{base.capacidade || 20} membros
                          </span>
                        </div>

                        {/* Dia/Horário */}
                        {base.dia_semana && base.horario && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{base.dia_semana} • {base.horario}</span>
                          </div>
                        )}

                        {/* Local */}
                        {base.local && (
                          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{base.local}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Ocupação</span>
                          <span className={isLotada ? 'text-destructive font-medium' : ''}>
                            {ocupacao}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLotada 
                                ? 'bg-destructive' 
                                : ocupacao >= 80 
                                  ? 'bg-amber-500' 
                                  : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={() => navigate(`/admin/bases/${base.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
