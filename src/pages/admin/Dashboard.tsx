import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Network,
  Baby,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Phone,
  ExternalLink,
  CalendarDays,
  Building2,
  PlusCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  visitantesNoMes: number;
  acompanhamentosAtivos: number;
  visitantesConcluidos: number;
  basesAtivas: number;
  membrosAtivos: number;
  criancasPresentes: number;
}

interface ChartData {
  month: string;
  visitantes: number;
}

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  data_visita: string | null;
  status: string | null;
}

interface Acompanhamento {
  id: string;
  status: string;
  updated_at: string;
  visitante: { id: string; nome: string } | null;
  base: { id: string; nome: string } | null;
}

interface ProximoEvento {
  id: string;
  titulo: string;
  tipo: string;
  data_evento: string;
  total_ministerios: number;
}

interface Alert {
  id: string;
  type: 'sem_acompanhamento' | 'contato_parado' | 'base_lotada';
  message: string;
  entityName: string;
  entityId: string;
  link: string;
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  'contato_iniciado': 'bg-yellow-100 text-yellow-800',
  'em_acompanhamento': 'bg-purple-100 text-purple-800',
  visitando_base: 'bg-indigo-100 text-indigo-800',
  integrado: 'bg-green-100 text-green-800',
  desistente: 'bg-red-100 text-red-800',
  concluido: 'bg-emerald-100 text-emerald-800',
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  'contato_iniciado': 'Contato Iniciado',
  'em_acompanhamento': 'Em Acompanhamento',
  visitando_base: 'Visitando Base',
  integrado: 'Integrado',
  desistente: 'Desistente',
  concluido: 'Concluído',
};

export default function AdminDashboard() {
  const { churchId: authChurchId } = useAuth();
  const { church } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    visitantesNoMes: 0,
    acompanhamentosAtivos: 0,
    visitantesConcluidos: 0,
    basesAtivas: 0,
    membrosAtivos: 0,
    criancasPresentes: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentVisitantes, setRecentVisitantes] = useState<Visitante[]>([]);
  const [recentAcompanhamentos, setRecentAcompanhamentos] = useState<Acompanhamento[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [proximosEventos, setProximosEventos] = useState<ProximoEvento[]>([]);
  const [membrosIncompletos, setMembrosIncompletos] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [churchId]);

  const fetchDashboardData = async () => {
    if (!churchId) return;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        visitantesNoMesRes,
        acompanhamentosAtivosRes,
        visitantesConcluidosRes,
        basesAtivasRes,
        membrosAtivosRes,
        criancasPresentesRes,
        recentVisitantesRes,
        recentAcompRes,
        chartDataRes,
        alertsData,
        membrosIncompletosRes,
      ] = await Promise.all([
        // Visitantes no mês
        supabase
          .from('visitantes')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .gte('created_at', startOfMonth),
        
        // Acompanhamentos ativos (não concluídos)
        supabase
          .from('acompanhamentos')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'concluido'),
        
        // Visitantes concluídos no mês
        supabase
          .from('acompanhamentos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'concluido')
          .gte('updated_at', startOfMonth),
        
        // Bases ativas
        supabase
          .from('bases')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('status', 'ativo'),

        // Membros ativos
        supabase
          .from('membros')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('status', 'ativo'),
        
        // Crianças presentes hoje
        supabase
          .from('checkins_kids')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'presente')
          .gte('checkin_at', today),
        
        // Últimos 5 visitantes
        supabase
          .from('visitantes')
          .select('id, nome, telefone, data_visita, status')
          .eq('church_id', churchId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Últimos 5 acompanhamentos
        supabase
          .from('acompanhamentos')
          .select(`
            id,
            status,
            updated_at,
            visitante:visitantes(id, nome),
            base:bases(id, nome)
          `)
          .order('updated_at', { ascending: false })
          .limit(5),
        
        // Chart data - visitantes últimos 6 meses
        fetchChartData(),
        
        // Alerts
        fetchAlerts(),

        // Membros com cadastro incompleto (sem telefone ou sem data_nascimento)
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .or('telefone.is.null,telefone.eq.,data_nascimento.is.null'),
      ]);

      setStats({
        visitantesNoMes: visitantesNoMesRes.count || 0,
        acompanhamentosAtivos: acompanhamentosAtivosRes.count || 0,
        visitantesConcluidos: visitantesConcluidosRes.count || 0,
        basesAtivas: basesAtivasRes.count || 0,
        membrosAtivos: membrosAtivosRes.count || 0,
        criancasPresentes: criancasPresentesRes.count || 0,
      });

      setRecentVisitantes(recentVisitantesRes.data || []);
      setRecentAcompanhamentos(recentAcompRes.data as any || []);
      setChartData(chartDataRes);
      setAlerts(alertsData);
      setMembrosIncompletos(membrosIncompletosRes.count || 0);

      // Próximos eventos
      const { data: eventosData } = await (supabase as any)
        .from('eventos_escala')
        .select('id, titulo, tipo, data_evento')
        .eq('church_id', churchId ?? '')
        .gte('data_evento', today)
        .order('data_evento', { ascending: true })
        .limit(5);

      if (eventosData?.length) {
        const eIds = eventosData.map((e: any) => e.id);
        const { data: emData } = await (supabase as any)
          .from('evento_ministerios')
          .select('evento_id')
          .in('evento_id', eIds);
        const counts: Record<string, number> = {};
        (emData ?? []).forEach((em: any) => {
          counts[em.evento_id] = (counts[em.evento_id] ?? 0) + 1;
        });
        setProximosEventos(
          eventosData.map((e: any) => ({ ...e, total_ministerios: counts[e.id] ?? 0 }))
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (): Promise<ChartData[]> => {
    const now = new Date();
    
    // Create date ranges for all 6 months
    const monthRanges = Array.from({ length: 6 }, (_, i) => {
      const monthOffset = 5 - i;
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const startOfMonth = date.toISOString();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      return { startOfMonth, endOfMonth, monthName };
    });

    try {
      // Execute all 6 queries in parallel using Promise.all
      const results = await Promise.all(
        monthRanges.map(({ startOfMonth, endOfMonth }) =>
          supabase
            .from('visitantes')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', churchId!)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth)
        )
      );

      // Map results to chart data format
      return monthRanges.map((range, index) => ({
        month: range.monthName.charAt(0).toUpperCase() + range.monthName.slice(1),
        visitantes: results[index].count || 0,
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Erro ao carregar dados do gráfico');
      return monthRanges.map(range => ({
        month: range.monthName.charAt(0).toUpperCase() + range.monthName.slice(1),
        visitantes: 0,
      }));
    }
  };

  const fetchAlerts = async (): Promise<Alert[]> => {
    const alertsList: Alert[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Visitantes sem acompanhamento há mais de 7 dias
    const { data: visitantesSemAcomp } = await supabase
      .from('visitantes')
      .select(`
        id,
        nome,
        created_at,
        acompanhamentos(id)
      `)
      .eq('church_id', churchId!)
      .lte('created_at', sevenDaysAgo)
      .limit(10);

    visitantesSemAcomp?.forEach((v: any) => {
      if (!v.acompanhamentos || v.acompanhamentos.length === 0) {
        alertsList.push({
          id: `sem_acomp_${v.id}`,
          type: 'sem_acompanhamento',
          message: 'Visitante sem acompanhamento há mais de 7 dias',
          entityName: v.nome,
          entityId: v.id,
          link: `/admin/visitantes/${v.id}`,
        });
      }
    });

    // 2. Visitantes com contato iniciado parado há mais de 10 dias
    const { data: contatosParados } = await supabase
      .from('acompanhamentos')
      .select(`
        id,
        status,
        updated_at,
        visitante:visitantes(id, nome)
      `)
      .eq('status', 'contato_iniciado')
      .lte('updated_at', tenDaysAgo)
      .limit(10);

    contatosParados?.forEach((a: any) => {
      if (a.visitante) {
        alertsList.push({
          id: `contato_parado_${a.id}`,
          type: 'contato_parado',
          message: 'Contato iniciado há mais de 10 dias sem progresso',
          entityName: a.visitante.nome,
          entityId: a.visitante.id,
          link: `/admin/visitantes/${a.visitante.id}`,
        });
      }
    });

    // 3. Bases lotadas
    const { data: bases } = await supabase
      .from('bases')
      .select('id, nome, capacidade')
      .eq('church_id', churchId!)
      .eq('status', 'ativo');

    if (bases) {
      for (const base of bases) {
        const { count } = await supabase
          .from('bases_membros')
          .select('id', { count: 'exact', head: true })
          .eq('base_id', base.id)
          .eq('status', 'ativo');

        if (count && base.capacidade && count >= base.capacidade) {
          alertsList.push({
            id: `base_lotada_${base.id}`,
            type: 'base_lotada',
            message: `Base lotada (${count}/${base.capacidade})`,
            entityName: base.nome,
            entityId: base.id,
            link: `/admin/bases/${base.id}`,
          });
        }
      }
    }

    return alertsList.slice(0, 10);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const cleanPhone = (phone: string | null) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const hasValidPhone = (phone: string | null) => {
    const cleaned = cleanPhone(phone);
    return cleaned.length >= 10 && cleaned.length <= 13;
  };

  const getWhatsAppUrl = (phone: string | null) => {
    const cleaned = cleanPhone(phone);
    const formatted = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    return `https://wa.me/${formatted}`;
  };

  const kpiCards = [
    {
      title: 'Visitantes no Mês',
      value: stats.visitantesNoMes,
      icon: UserPlus,
      color: 'bg-blue-500',
      link: '/admin/visitantes',
    },
    {
      title: 'Acompanhamentos Ativos',
      value: stats.acompanhamentosAtivos,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/acompanhamento',
    },
    {
      title: 'Concluídos no Mês',
      value: stats.visitantesConcluidos,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      link: '/admin/acompanhamento',
    },
    {
      title: 'Bases Ativas',
      value: stats.basesAtivas,
      icon: Network,
      color: 'bg-indigo-500',
      link: '/admin/bases',
    },
    {
      title: 'Membros Ativos',
      value: stats.membrosAtivos,
      icon: Users,
      color: 'bg-purple-500',
      link: '/admin/membros',
    },
    {
      title: 'Kids Presentes Hoje',
      value: stats.criancasPresentes,
      icon: Baby,
      color: 'bg-pink-500',
      link: '/admin/kids',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do ministério</p>
        </div>
        <Button
          onClick={() => navigate('/admin/igrejas/nova')}
          className="bg-emerald-700 hover:bg-emerald-800 shrink-0"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Nova Igreja
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card
            key={kpi.title}
            className="shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Link to={kpi.link}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold font-display">{kpi.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{kpi.title}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Incomplete profiles warning */}
      {!loading && membrosIncompletos > 0 && (
        <Link to="/admin/membros" className="block">
          <div className="flex items-center gap-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600 px-4 py-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
            <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-500" />
            <p className="flex-1 text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold">{membrosIncompletos} membro{membrosIncompletos !== 1 ? 's' : ''}</span>{' '}
              com cadastro incompleto (sem telefone ou data de nascimento).
            </p>
            <ChevronRight className="w-4 h-4 text-yellow-600 shrink-0" />
          </div>
        </Link>
      )}

      {/* Próximos Eventos */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Escalas programadas</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/escalas/periodos">Ver todos <ChevronRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>
          ) : proximosEventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento programado.</p>
          ) : (
            <div className="space-y-2">
              {proximosEventos.map(ev => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary leading-tight">
                        {new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-primary uppercase">
                        {new Date(ev.data_evento + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ev.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.total_ministerios} ministério{ev.total_ministerios !== 1 ? 's' : ''} convocado{ev.total_ministerios !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">{ev.tipo}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Visitantes nos Últimos 6 Meses
            </CardTitle>
            <CardDescription>Evolução mensal de novos visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitantes"
                    stroke="#396939"
                    fill="#5A9462"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alertas
            </CardTitle>
            <CardDescription>Itens que precisam de atenção</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Nenhum alerta no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                  >
                    <p className="font-medium text-sm text-foreground">{alert.entityName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <Button asChild variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
                      <Link to={alert.link}>
                        Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visitantes */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Últimos Visitantes</CardTitle>
              <CardDescription>Cadastros mais recentes</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/visitantes">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentVisitantes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum visitante cadastrado</p>
            ) : (
              <div className="space-y-3">
                {recentVisitantes.map((visitante) => (
                  <div
                    key={visitante.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {visitante.nome?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{visitante.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(visitante.data_visita)}</span>
                        {hasValidPhone(visitante.telefone) && (
                          <a
                            href={getWhatsAppUrl(visitante.telefone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge className={statusColors[visitante.status || 'novo']}>
                      {statusLabels[visitante.status || 'novo']}
                    </Badge>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to={`/admin/visitantes/${visitante.id}`}>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Acompanhamentos */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Últimos Acompanhamentos</CardTitle>
              <CardDescription>Atualizações mais recentes</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/acompanhamento">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentAcompanhamentos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum acompanhamento registrado</p>
            ) : (
              <div className="space-y-3">
                {recentAcompanhamentos.map((acomp) => (
                  <div
                    key={acomp.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {acomp.visitante?.nome || 'Visitante não encontrado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {acomp.base?.nome || 'Sem base'} • {formatDate(acomp.updated_at)}
                      </p>
                    </div>
                    <Badge className={statusColors[acomp.status] || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[acomp.status] || acomp.status}
                    </Badge>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link to="/admin/acompanhamento">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
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
