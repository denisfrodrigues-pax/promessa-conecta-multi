import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiTile } from '@/components/KpiTile';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { supabase } from '@/integrations/supabase/client';
import { Users, ClipboardList, Calendar, ChevronRight, CalendarDays } from 'lucide-react';
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
  ministerios: { nome: string } | null;
}

interface AgendaEvento {
  id: string;
  titulo: string;
  data_evento: string;
  tipo: string;
  status: string | null;
}

export default function LeaderDashboard() {
  const { ministerioId } = useOutletContext<{ ministerioId: string }>();
  const { slug } = useParams<{ slug: string }>();
  const { p } = useIgrejaSlug();
  const { profile } = useAuth();
  const { config } = useIgrejaConfig();
  const [bases, setBases] = useState<Base[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [agenda, setAgenda] = useState<AgendaEvento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && ministerioId) {
      fetchData();
    }
  }, [profile, ministerioId]);

  const fetchData = async () => {
    try {
      const [basesRes, escalasRes] = await Promise.all([
        supabase.from('bases').select('*').eq('lider_id', profile?.id),
        supabase
          .from('escalas')
          .select('*, ministerios(nome)')
          .eq('ministerio_id', ministerioId)
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data', { ascending: true })
          .limit(5),
      ]);

      setBases(basesRes.data || []);
      setEscalas(escalasRes.data || []);

      // Próximos eventos do ministério
      const hoje = new Date().toISOString().split('T')[0];
      const { data: emData } = await (supabase as any)
        .from('evento_ministerios')
        .select('status, eventos_escala(id, titulo, tipo, data_evento)')
        .eq('ministerio_id', ministerioId)
        .gte('eventos_escala.data_evento', hoje)
        .order('eventos_escala.data_evento', { ascending: true })
        .limit(3);

      if (emData) {
        setAgenda(
          (emData as any[])
            .filter((em: any) => em.eventos_escala)
            .map((em: any) => ({ ...em.eventos_escala, status: em.status }))
            .sort((a: any, b: any) => a.data_evento.localeCompare(b.data_evento))
            .slice(0, 3)
        );
      }
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
            alt={config.nome || 'Logo'}
            className="h-12 w-auto object-contain"
          />
        )}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Olá, {profile?.nome || 'Líder'}!</h1>
          <p className="text-muted-foreground mt-1">Confira suas atividades e responsabilidades</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <KpiTile
          icon={Users}
          value={bases.length}
          label="Bases Lideradas"
          loading={loading}
          iconClassName="text-primary"
          iconBgClassName="bg-primary/10"
        />
        <KpiTile
          icon={ClipboardList}
          value={escalas.length}
          label="Próximas Escalas"
          loading={loading}
          iconClassName="text-amber-600"
          iconBgClassName="bg-amber-500/10"
        />
      </div>

      {/* Minha Agenda */}
      {agenda.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Minha Agenda
            </CardTitle>
            <CardDescription>Próximos eventos deste ministério</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agenda.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary leading-tight">
                        {format(new Date(ev.data_evento + 'T12:00:00'), 'dd')}
                      </span>
                      <span className="text-[10px] text-primary uppercase">
                        {format(new Date(ev.data_evento + 'T12:00:00'), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ev.titulo}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ev.tipo}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ev.status === 'escala_criada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ev.status === 'escala_criada' ? 'Escala criada' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas Bases */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg">Minhas Bases</CardTitle>
              <CardDescription>Bases que você lidera</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              <Link to={p(`/leader/${slug}/bases`)}>
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : bases.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Você ainda não lidera nenhuma base</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bases.map((base) => (
                  <Link
                    key={base.id}
                    to={p(`/leader/${slug}/bases/${base.id}`)}
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
              <Link to={p(`/leader/${slug}/escalas`)}>
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : escalas.length === 0 ? (
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
