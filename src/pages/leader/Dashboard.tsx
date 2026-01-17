import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/hooks/useChurchConfig';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

interface Base {
  id: string;
  nome: string;
  dia_semana: string | null;
  horario: string | null;
}

interface Escala {
  id: string;
  data: string;
  funcao: string;
  status: string;
  ministerios: { nome: string } | null;
}

export default function LeaderDashboard() {
  const { profile } = useAuth();
  const { config } = useChurchConfig();
  const [bases, setBases] = useState<Base[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [basesRes, escalasRes] = await Promise.all([
        supabase.from('bases').select('*').eq('lider_id', profile?.id),
        supabase
          .from('escalas')
          .select('*, ministerios(nome)')
          .eq('voluntario_id', profile?.id)
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data', { ascending: true })
          .limit(5),
      ]);

      setBases(basesRes.data || []);
      setEscalas(escalasRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasCustomLogo = config?.logo_url && !config.logo_url.includes('placeholder');

  return (
    <div className="space-y-8">
      {/* Header with optional logo */}
      <div className="flex items-start gap-4">
        {hasCustomLogo && (
          <img 
            src={config.logo_url!} 
            alt={config.nome_igreja || 'Logo'}
            className="h-12 w-auto object-contain"
          />
        )}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Olá, {profile?.nome?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">Confira suas atividades e responsabilidades</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shadow-sm">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-primary">{bases.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Bases Lideradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center shadow-sm">
                <ClipboardList className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-amber-700 dark:text-amber-500">{escalas.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Próximas Escalas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-promessa/5 to-promessa/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-promessa/15 flex items-center justify-center shadow-sm">
                <CheckCircle className="w-7 h-7 text-promessa" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-promessa">
                  {escalas.filter((e) => e.status === 'confirmado').length}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Escalas Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas Bases */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg">Minhas Bases</CardTitle>
              <CardDescription>Bases que você lidera</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              <Link to="/leader/bases">
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {bases.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Você ainda não lidera nenhuma base</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bases.map((base) => (
                  <Link
                    key={base.id}
                    to={`/leader/bases/${base.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                  >
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">{base.nome}</p>
                      {base.dia_semana && base.horario && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {base.dia_semana} às {base.horario}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minhas Escalas */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg">Próximas Escalas</CardTitle>
              <CardDescription>Suas escalas de serviço</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              <Link to="/lider/escalas">
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {escalas.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhuma escala programada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {escalas.map((escala) => (
                  <div
                    key={escala.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-primary">
                          {format(parseLocalDate(escala.data), 'dd')}
                        </span>
                        <span className="text-[10px] text-primary uppercase font-medium">
                          {format(parseLocalDate(escala.data), 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{escala.funcao}</p>
                        <p className="text-sm text-muted-foreground">
                          {escala.ministerios?.nome || 'Ministério'}
                        </p>
                      </div>
                    </div>
                    {escala.status === 'confirmado' ? (
                      <div className="flex items-center gap-2 text-promessa">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-xs font-medium hidden sm:inline">Confirmado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-500">
                        <Clock className="w-5 h-5" />
                        <span className="text-xs font-medium hidden sm:inline">Pendente</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
