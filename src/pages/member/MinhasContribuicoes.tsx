import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, HandHeart, Calendar, Tag, DollarSign, TrendingUp, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format, startOfMonth, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

interface Contribuicao {
  id: string;
  valor: number;
  data_operacao: string;
  status: string;
  categoria: {
    nome: string;
  } | null;
}

const chartConfig = {
  valor: {
    label: 'Valor',
    color: 'hsl(var(--primary))',
  },
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MinhasContribuicoes() {
  const { profile, churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId, p } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const { config } = useIgrejaConfig();
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exportingPdf, setExportingPdf] = useState(false);
  const extratoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id && churchId) {
      fetchContribuicoes();
    }
  }, [profile?.id, churchId, selectedYear]);

  const fetchContribuicoes = async () => {
    setLoading(true);
    try {
      // Uma contribuição pode ter sido lançada pelo próprio membro (criado_por)
      // ou por um admin em nome dele (membro_id) — ver o registro do membro
      // vinculado ao perfil logado para cobrir os dois casos.
      const { data: membro } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          id,
          valor,
          data_operacao,
          status,
          categoria:categorias_financeiras(nome)
        `)
        .eq('church_id', churchId ?? '')
        .eq('tipo', 'receita')
        .gte('data_operacao', `${selectedYear}-01-01`)
        .lte('data_operacao', `${selectedYear}-12-31`)
        .order('data_operacao', { ascending: false });

      query = membro?.id
        ? query.or(`criado_por.eq.${profile?.id},membro_id.eq.${membro.id}`)
        : query.eq('criado_por', profile?.id);

      const { data, error } = await query;

      if (error) throw error;
      setContribuicoes(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (contribuicoes.length === 0) return;
    const rows = contribuicoes.map((c) => ({
      Data: format(new Date(c.data_operacao), 'dd/MM/yyyy'),
      Categoria: c.categoria?.nome || 'Não categorizado',
      Status: c.status,
      Valor: formatCurrency(c.valor),
    }));
    const nomeArquivo = `contribuicoes_${(profile?.nome || 'membro').replace(/\s+/g, '_')}_${selectedYear}`;
    exportToCSV(rows, nomeArquivo);
  };

  const handleExportPDF = async () => {
    if (!extratoRef.current) return;
    setExportingPdf(true);
    try {
      const nomeArquivo = `contribuicoes_${(profile?.nome || 'membro').replace(/\s+/g, '_')}_${selectedYear}`;
      await exportToPDF(extratoRef.current, nomeArquivo);
    } finally {
      setExportingPdf(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate totals
  const totalContribuido = contribuicoes
    .filter((c) => c.status === 'confirmado')
    .reduce((acc, c) => acc + c.valor, 0);

  // Generate chart data for the last 6 months
  const chartData = useMemo(() => {
    const months: { month: string; valor: number; label: string }[] = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthKey = format(monthStart, 'yyyy-MM');
      const monthLabel = format(monthStart, 'MMM', { locale: ptBR });

      const monthTotal = contribuicoes
        .filter((c) => {
          if (c.status !== 'confirmado') return false;
          const contributionDate = parseISO(c.data_operacao);
          return format(contributionDate, 'yyyy-MM') === monthKey;
        })
        .reduce((acc, c) => acc + c.valor, 0);

      months.push({
        month: monthKey,
        valor: monthTotal,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      });
    }

    return months;
  }, [contribuicoes]);

  const hasChartData = chartData.some((d) => d.valor > 0);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={p('/app')}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Minhas Contribuições</h1>
            <p className="text-sm text-muted-foreground">
              Histórico de ofertas e dízimos
            </p>
          </div>
        </div>
        <Button
          asChild
          className="bg-green-600 hover:bg-green-700"
        >
          <Link to={p('/app/contribuir')}>
            <HandHeart className="w-4 h-4 mr-2" />
            Contribuir
          </Link>
        </Button>
      </div>

      {/* Extrato: seletor de ano + exportação — pensado para declaração de IR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={contribuicoes.length === 0}
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={contribuicoes.length === 0 || exportingPdf}
            onClick={handleExportPDF}
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      <div ref={extratoRef} className="space-y-6 bg-background">
      {/* Cabeçalho do extrato — visível na tela e no PDF exportado */}
      <div className="text-sm text-muted-foreground space-y-0.5">
        <p><span className="font-medium text-foreground">{profile?.nome || 'Membro'}</span> · {config.nome}</p>
        <p>Extrato de contribuições — ano de {selectedYear}</p>
      </div>

      {/* Summary Card */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total contribuído em {selectedYear}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(totalContribuido)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section — só faz sentido para o ano corrente (tendência recente) */}
      {!loading && hasChartData && selectedYear === currentYear && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Contribuições por mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                  width={60}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  } 
                />
                <Bar 
                  dataKey="valor" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Contributions List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          Histórico de contribuições
        </h2>
        
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : contribuicoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted">
                  <HandHeart className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {selectedYear === currentYear ? 'Nenhuma contribuição ainda' : `Nenhuma contribuição em ${selectedYear}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedYear === currentYear
                      ? 'Sua primeira contribuição ficará registrada aqui'
                      : 'Escolha outro ano acima para ver o extrato correspondente'}
                  </p>
                </div>
                {selectedYear === currentYear && (
                  <Button
                    asChild
                    className="mt-2 bg-green-600 hover:bg-green-700"
                  >
                    <Link to={p('/app/contribuir')}>
                      Fazer primeira contribuição
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          contribuicoes.map((contribuicao) => (
            <Card key={contribuicao.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(contribuicao.data_operacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      <span>{contribuicao.categoria?.nome || 'Não categorizado'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg text-green-700 dark:text-green-400">
                      {formatCurrency(contribuicao.valor)}
                    </p>
                    {getStatusBadge(contribuicao.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>

    </div>
  );
}