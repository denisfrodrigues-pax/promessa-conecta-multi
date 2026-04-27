import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  UserPlus,
  BarChart3,
  PieChart,
  Download,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BaseStats {
  id: string;
  nome: string;
  totalMembros: number;
  visitantesAtivos: number;
  capacidade: number;
  ocupacao: number;
}

interface EscalaStats {
  confirmadas: number;
  pendentes: number;
  ausentes: number;
  total: number;
  taxaConfirmacao: number;
}

interface CrescimentoData {
  mes: string;
  membros: number;
  visitantes: number;
}

interface EngajamentoData {
  dia: string;
  presencas: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'primary'
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-green-500/10 text-green-600',
    warning: 'bg-yellow-500/10 text-yellow-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-3 h-3 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeaderRelatorios() {
  const { ministerioId } = useOutletContext<{ ministerioId: string }>();
  const { user, profile, isLider, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [basesSelecionada, setBasesSelecionada] = useState<string>('all');
  
  const [bases, setBases] = useState<BaseStats[]>([]);
  const [escalaStats, setEscalaStats] = useState<EscalaStats>({
    confirmadas: 0,
    pendentes: 0,
    ausentes: 0,
    total: 0,
    taxaConfirmacao: 0
  });
  const [crescimento, setCrescimento] = useState<CrescimentoData[]>([]);
  const [engajamento, setEngajamento] = useState<EngajamentoData[]>([]);
  const [totalMembros, setTotalMembros] = useState(0);
  const [totalVisitantes, setTotalVisitantes] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !isLider) {
      navigate('/home');
    }
  }, [user, authLoading, isLider, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchAllData();
    }
  }, [profile?.id, periodo, basesSelecionada]);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchBasesStats(),
        fetchEscalaStats(),
        fetchCrescimento(),
        fetchEngajamento()
      ]);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Não foi possível carregar os dados dos relatórios.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBasesStats() {
    const { data: basesData, error: basesError } = await supabase
      .from('bases')
      .select('id, nome, capacidade')
      .eq('lider_id', profile?.id)
      .eq('status', 'ativo');

    if (basesError) throw basesError;

    const basesStats: BaseStats[] = [];
    let totalM = 0;
    let totalV = 0;

    for (const base of basesData || []) {
      const { count: membrosCount } = await supabase
        .from('bases_membros')
        .select('*', { count: 'exact', head: true })
        .eq('base_id', base.id)
        .eq('status', 'ativo');

      const { count: visitantesCount } = await supabase
        .from('acompanhamentos')
        .select('*', { count: 'exact', head: true })
        .eq('base_id', base.id)
        .in('status', ['novo', 'ativo', 'em_acompanhamento']);

      const total = membrosCount || 0;
      const visitantes = visitantesCount || 0;
      const capacidade = base.capacidade || 20;
      
      totalM += total;
      totalV += visitantes;

      basesStats.push({
        id: base.id,
        nome: base.nome,
        totalMembros: total,
        visitantesAtivos: visitantes,
        capacidade,
        ocupacao: Math.round((total / capacidade) * 100)
      });
    }

    setBases(basesStats);
    setTotalMembros(totalM);
    setTotalVisitantes(totalV);
  }

  async function fetchEscalaStats() {
    const dataInicio = subDays(new Date(), parseInt(periodo));
    
    // Get ministerios where user is leader
    const { data: ministerios } = await supabase
      .from('ministerios')
      .select('id')
      .eq('lider_id', profile?.id);

    if (!ministerios?.length) {
      setEscalaStats({
        confirmadas: 0,
        pendentes: 0,
        ausentes: 0,
        total: 0,
        taxaConfirmacao: 0
      });
      return;
    }

    const ministerioIds = ministerios.map(m => m.id);

    const { data: escalas } = await supabase
      .from('escalas')
      .select('id')
      .in('ministerio_id', ministerioIds)
      .gte('data', format(dataInicio, 'yyyy-MM-dd'));

    const total = escalas?.length || 0;

    setEscalaStats({
      confirmadas: 0,
      pendentes: 0,
      ausentes: 0,
      total,
      taxaConfirmacao: 0
    });
  }

  async function fetchCrescimento() {
    const hoje = new Date();
    const mesesData: CrescimentoData[] = [];

    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const inicio = startOfMonth(data);
      const fim = endOfMonth(data);

      const { data: basesData } = await supabase
        .from('bases')
        .select('id')
        .eq('lider_id', profile?.id);

      const baseIds = basesData?.map(b => b.id) || [];

      if (baseIds.length === 0) {
        mesesData.push({
          mes: format(data, 'MMM', { locale: ptBR }),
          membros: 0,
          visitantes: 0
        });
        continue;
      }

      const { count: novosM } = await supabase
        .from('bases_membros')
        .select('*', { count: 'exact', head: true })
        .in('base_id', baseIds)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString());

      const { count: novosV } = await supabase
        .from('acompanhamentos')
        .select('*', { count: 'exact', head: true })
        .in('base_id', baseIds)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString());

      mesesData.push({
        mes: format(data, 'MMM', { locale: ptBR }),
        membros: novosM || 0,
        visitantes: novosV || 0
      });
    }

    setCrescimento(mesesData);
  }

  async function fetchEngajamento() {
    const dias = parseInt(periodo);
    const dataInicio = subDays(new Date(), dias);
    const interval = eachDayOfInterval({ start: dataInicio, end: new Date() });
    
    // For now, simulate engagement data based on escalas
    const { data: basesData } = await supabase
      .from('bases')
      .select('id')
      .eq('lider_id', profile?.id);

    const engajamentoData: EngajamentoData[] = interval.slice(-7).map(date => ({
      dia: format(date, 'EEE', { locale: ptBR }),
      presencas: Math.floor(Math.random() * 20) + 5 // Placeholder - would need presencas table data
    }));

    setEngajamento(engajamentoData);
  }

  function exportarCSV() {
    const csvContent = [
      ['Base', 'Membros', 'Visitantes', 'Capacidade', 'Ocupação (%)'].join(','),
      ...bases.map(b => [b.nome, b.totalMembros, b.visitantesAtivos, b.capacidade, b.ocupacao].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-lider-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('Relatório exportado com sucesso.');
  }

  const pieData = [
    { name: 'Confirmadas', value: escalaStats.confirmadas },
    { name: 'Pendentes', value: escalaStats.pendentes },
    { name: 'Ausentes', value: escalaStats.ausentes }
  ].filter(d => d.value > 0);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho das suas bases e equipes</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Membros"
          value={totalMembros}
          subtitle={`Em ${bases.length} base(s)`}
          icon={Users}
          color="primary"
        />
        <KPICard
          title="Visitantes Ativos"
          value={totalVisitantes}
          subtitle="Em acompanhamento"
          icon={UserPlus}
          color="secondary"
        />
        <KPICard
          title="Taxa de Confirmação"
          value={`${escalaStats.taxaConfirmacao}%`}
          subtitle={`${escalaStats.confirmadas} de ${escalaStats.total} escalas`}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title="Escalas Pendentes"
          value={escalaStats.pendentes}
          subtitle="Aguardando resposta"
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="escalas">
            <PieChart className="w-4 h-4 mr-2" />
            Escalas
          </TabsTrigger>
          <TabsTrigger value="detalhes">
            <FileText className="w-4 h-4 mr-2" />
            Detalhes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crescimento Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Crescimento Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crescimento}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="membros" name="Membros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="visitantes" name="Visitantes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engajamento Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Engajamento Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engajamento}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="dia" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="presencas" 
                        name="Presenças"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="escalas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Escalas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nenhuma escala no período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Escalas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="font-medium">Confirmadas</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-700">
                    {escalaStats.confirmadas}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg">
                  <span className="font-medium">Pendentes</span>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
                    {escalaStats.pendentes}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                  <span className="font-medium">Ausentes</span>
                  <Badge variant="outline" className="bg-red-500/20 text-red-700">
                    {escalaStats.ausentes}
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total de Escalas</span>
                    <span className="font-bold text-lg">{escalaStats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detalhes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Base</CardTitle>
            </CardHeader>
            <CardContent>
              {bases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Você não lidera nenhuma base ativa.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Base</th>
                        <th className="text-center py-3 px-4 font-medium">Membros</th>
                        <th className="text-center py-3 px-4 font-medium">Visitantes</th>
                        <th className="text-center py-3 px-4 font-medium">Capacidade</th>
                        <th className="text-center py-3 px-4 font-medium">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bases.map((base) => (
                        <tr key={base.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{base.nome}</td>
                          <td className="text-center py-3 px-4">{base.totalMembros}</td>
                          <td className="text-center py-3 px-4">{base.visitantesAtivos}</td>
                          <td className="text-center py-3 px-4">{base.capacidade}</td>
                          <td className="text-center py-3 px-4">
                            <Badge 
                              variant={base.ocupacao >= 90 ? 'destructive' : base.ocupacao >= 70 ? 'secondary' : 'outline'}
                            >
                              {base.ocupacao}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
