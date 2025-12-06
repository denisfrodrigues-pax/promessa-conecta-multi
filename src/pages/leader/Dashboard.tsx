import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, Calendar, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Grupo {
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
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [gruposRes, escalasRes] = await Promise.all([
        supabase.from('grupos').select('*').eq('lider_id', profile?.id),
        supabase
          .from('escalas')
          .select('*, ministerios(nome)')
          .eq('voluntario_id', profile?.id)
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data', { ascending: true })
          .limit(5),
      ]);

      setGrupos(gruposRes.data || []);
      setEscalas(escalasRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Olá, {profile?.nome?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Confira suas atividades e responsabilidades</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{grupos.length}</p>
                <p className="text-sm text-muted-foreground">Grupos Liderados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-church-gold/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-church-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{escalas.length}</p>
                <p className="text-sm text-muted-foreground">Próximas Escalas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {escalas.filter((e) => e.status === 'confirmado').length}
                </p>
                <p className="text-sm text-muted-foreground">Escalas Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meus Grupos */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Meus Grupos</CardTitle>
              <CardDescription>Grupos que você lidera</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/lider/grupos">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {grupos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Você ainda não lidera nenhum grupo
              </p>
            ) : (
              <div className="space-y-3">
                {grupos.map((grupo) => (
                  <div
                    key={grupo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{grupo.nome}</p>
                      {grupo.dia_semana && grupo.horario && (
                        <p className="text-sm text-muted-foreground">
                          {grupo.dia_semana} às {grupo.horario}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minhas Escalas */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Próximas Escalas</CardTitle>
              <CardDescription>Suas escalas de serviço</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/lider/escalas">
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {escalas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma escala programada
              </p>
            ) : (
              <div className="space-y-3">
                {escalas.map((escala) => (
                  <div
                    key={escala.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {format(new Date(escala.data), 'dd')}
                        </span>
                        <span className="text-[10px] text-primary uppercase">
                          {format(new Date(escala.data), 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{escala.funcao}</p>
                        <p className="text-sm text-muted-foreground">
                          {escala.ministerios?.nome || 'Ministério'}
                        </p>
                      </div>
                    </div>
                    {escala.status === 'confirmado' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
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
