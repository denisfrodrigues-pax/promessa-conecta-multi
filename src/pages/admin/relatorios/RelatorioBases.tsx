import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Network, Download, FileText, Users, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

export default function RelatorioBases() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [kpis, setKpis] = useState({ total: 0, ocupacaoMedia: 0, lotadas: 0 });
  const [chartData, setChartData] = useState({ ocupacao: [] as any[], crescimento: [] as any[] });

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get count first
      const { count } = await supabase.from('bases').select('*', { count: 'exact', head: true }).eq('status', 'ativo');
      setTotal(count || 0);

      const { data: basesData } = await supabase.from('bases')
        .select('*')
        .eq('status', 'ativo')
        .order('nome')
        .range((page - 1) * limit, page * limit - 1);
      
      const basesComOcupacao = await Promise.all((basesData || []).map(async (base) => {
        const { count } = await supabase.from('bases_membros').select('*', { count: 'exact', head: true })
          .eq('base_id', base.id).eq('status', 'ativo');
        const ocupacao = count || 0;
        const percentual = base.capacidade ? Math.round((ocupacao / base.capacidade) * 100) : 0;
        return { ...base, ocupacao, percentual };
      }));

      setBases(basesComOcupacao);

      // KPIs (from all bases)
      const { data: allBases } = await supabase.from('bases').select('id, capacidade').eq('status', 'ativo');
      const allBasesOcupacao = await Promise.all((allBases || []).map(async (base) => {
        const { count } = await supabase.from('bases_membros').select('*', { count: 'exact', head: true })
          .eq('base_id', base.id).eq('status', 'ativo');
        const ocupacao = count || 0;
        const percentual = base.capacidade ? Math.round((ocupacao / base.capacidade) * 100) : 0;
        return { ...base, ocupacao, percentual };
      }));

      const totalBases = allBasesOcupacao.length;
      const ocupacaoMedia = totalBases > 0 ? Math.round(allBasesOcupacao.reduce((s, b) => s + b.percentual, 0) / totalBases) : 0;
      const lotadas = allBasesOcupacao.filter(b => b.percentual >= 100).length;
      setKpis({ total: totalBases, ocupacaoMedia, lotadas });

      // Charts
      const ocupacao = basesComOcupacao.slice(0, 10).map(b => ({ nome: b.nome, ocupacao: b.percentual }));
      
      // Crescimento mensal
      const crescimento = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(new Date(), i);
        const { count } = await supabase.from('bases_membros').select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth(mes).toISOString())
          .lte('created_at', endOfMonth(mes).toISOString());
        crescimento.push({ mes: format(mes, 'MMM', { locale: ptBR }), novos: count || 0 });
      }

      setChartData({ ocupacao, crescimento });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(bases.map(b => ({
      Nome: b.nome,
      'Dia/Horário': `${b.dia_semana || ''} ${b.horario || ''}`.trim(),
      Ocupação: `${b.ocupacao}/${b.capacidade || '?'}`,
      'Percentual': `${b.percentual}%`,
      Local: b.local || '',
    })), 'relatorio_bases');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPDF(true);
    try {
      await exportToPDF(reportRef.current, 'relatorio_bases');
      toast.success('PDF exportado com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 100) return <Badge variant="destructive">Lotada</Badge>;
    if (percentual >= 80) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Mostrando {startItem} – {endItem} de {total}
      </span>
      <div className="space-x-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-8" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório de Bases</h1>
          <p className="text-muted-foreground">Ocupação e crescimento das bases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {exportingPDF ? 'Gerando...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* Indicadores Gerais Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Indicadores Gerais
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.total}</p>
                  <p className="text-xs text-muted-foreground">Bases Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.ocupacaoMedia}%</p>
                  <p className="text-xs text-muted-foreground">Ocupação Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bases.reduce((acc, b) => acc + b.ocupacao, 0)}</p>
                  <p className="text-xs text-muted-foreground">Membros em Bases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.lotadas}</p>
                  <p className="text-xs text-muted-foreground">Bases Lotadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Análise Visual Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Análise Visual
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Ocupação por Base</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.ocupacao} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="nome" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="ocupacao" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Crescimento Mensal</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData.crescimento}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="novos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resumo por Base - Main Content Section */}
      <section>
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Resumo por Base
            </CardTitle>
            <p className="text-sm text-muted-foreground">Detalhamento completo de todas as bases ativas</p>
          </CardHeader>
          <CardContent className="p-6">
            {total > limit && <div className="mb-6"><PaginationControls /></div>}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold">Nome</th>
                    <th className="text-left p-3 font-semibold">Dia/Horário</th>
                    <th className="text-left p-3 font-semibold">Ocupação</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bases.map((b, idx) => (
                    <tr key={b.id} className={`border-t hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                      <td className="p-3 font-medium">{b.nome}</td>
                      <td className="p-3 text-muted-foreground">{b.dia_semana} {b.horario}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Progress value={b.percentual} className="w-24 h-2" />
                          <span className="text-xs font-medium tabular-nums">{b.ocupacao}/{b.capacidade}</span>
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(b.percentual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && <div className="mt-6"><PaginationControls /></div>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
