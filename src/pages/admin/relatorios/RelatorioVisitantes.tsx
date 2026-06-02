import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Download, FileText, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';
import { getWhatsAppUrl, hasValidPhone, formatPhoneBR } from '@/lib/formatters';

const COLORS = ['#5A9462', '#396939', '#73A97A', '#85A89A', '#B7CEC4', '#E6A327'];
const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};
const statusColors: Record<string, string> = {
  novo: 'bg-yellow-100 text-yellow-800',
  contato_iniciado: 'bg-blue-100 text-blue-800',
  em_acompanhamento: 'bg-purple-100 text-purple-800',
  concluido: 'bg-green-100 text-green-800',
};

export default function RelatorioVisitantes() {
  const { churchId } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState('mes');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [chartData, setChartData] = useState({ mensal: [] as any[], status: [] as any[] });

  useEffect(() => {
    fetchData();
  }, [periodo, filtroStatus, page, churchId]);

  const getDateRange = () => {
    const now = new Date();
    switch (periodo) {
      case 'semana': return subDays(now, 7);
      case 'mes': return subMonths(now, 1);
      case 'trimestre': return subMonths(now, 3);
      case 'ano': return subYears(now, 1);
      default: return subMonths(now, 1);
    }
  };

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const dataInicio = getDateRange();

      let countQuery = supabase.from('visitantes').select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('created_at', dataInicio.toISOString());
      if (filtroStatus !== 'todos') countQuery = countQuery.eq('status', filtroStatus);
      const { count } = await countQuery;
      setTotal(count || 0);

      let query = supabase.from('visitantes').select('*')
        .eq('church_id', churchId)
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (filtroStatus !== 'todos') query = query.eq('status', filtroStatus);
      const { data } = await query;
      setVisitantes(data || []);

      // Charts
      const { data: allData } = await supabase.from('visitantes').select('status, created_at')
        .eq('church_id', churchId)
        .gte('created_at', dataInicio.toISOString());
      
      // Mensal
      const mensal: Record<string, number> = {};
      (allData || []).forEach(v => {
        const mes = format(new Date(v.created_at), 'MMM/yy', { locale: ptBR });
        mensal[mes] = (mensal[mes] || 0) + 1;
      });
      
      // Status
      const statusCount: Record<string, number> = {};
      (allData || []).forEach(v => {
        statusCount[v.status || 'novo'] = (statusCount[v.status || 'novo'] || 0) + 1;
      });

      setChartData({
        mensal: Object.entries(mensal).map(([mes, count]) => ({ mes, visitantes: count })),
        status: Object.entries(statusCount).map(([name, value]) => ({ name: statusLabels[name] || name, value })),
      });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(visitantes.map(v => ({
      Nome: v.nome,
      Telefone: v.telefone || '',
      Email: v.email || '',
      Status: statusLabels[v.status] || v.status,
      'Data Visita': v.data_visita ? format(new Date(v.data_visita), 'dd/MM/yyyy') : '',
      Culto: v.culto || '',
    })), 'relatorio_visitantes');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPDF(true);
    try {
      await exportToPDF(reportRef.current, 'relatorio_visitantes');
      toast.success('PDF exportado com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setExportingPDF(false);
    }
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
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório de Visitantes</h1>
          <p className="text-muted-foreground">Análise detalhada dos visitantes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {exportingPDF ? 'Gerando...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ano">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato_iniciado">Contato Iniciado</SelectItem>
                <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-muted-foreground">Visitantes no período</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">Visitantes por Mês</CardTitle></CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.mensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="visitantes" stroke="#396939" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-bold">Status dos Visitantes</CardTitle></CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base font-bold">Lista de Visitantes</CardTitle></CardHeader>
        <CardContent>
          {total > limit && <div className="mb-4"><PaginationControls /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Telefone</th>
                  <th className="text-left p-2">Data Visita</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visitantes.map(v => (
                  <tr key={v.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{v.nome}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {v.telefone ? formatPhoneBR(v.telefone) : '–'}
                        {hasValidPhone(v.telefone) && (
                          <button onClick={() => window.open(getWhatsAppUrl(v.telefone), '_blank')} className="text-green-600">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{v.data_visita ? format(new Date(v.data_visita), 'dd/MM/yyyy') : '–'}</td>
                    <td className="p-2"><Badge className={statusColors[v.status || 'novo']}>{statusLabels[v.status || 'novo']}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > limit && <div className="mt-4"><PaginationControls /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
