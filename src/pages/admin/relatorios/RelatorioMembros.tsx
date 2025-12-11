import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Download, FileText, UserPlus, UserMinus, Calendar, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';
import { getWhatsAppUrl, hasValidPhone, formatPhoneBR } from '@/lib/formatters';

const COLORS = ['#5A9462', '#396939', '#73A97A', '#85A89A', '#B7CEC4'];
const statusLabels: Record<string, string> = { ativo: 'Ativo', inativo: 'Inativo' };

export default function RelatorioMembros() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [membros, setMembros] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [kpis, setKpis] = useState({ ativos: 0, novosMes: 0, desligados: 0, idadeMedia: 0 });
  const [chartData, setChartData] = useState({ entradas: [] as any[], faixaEtaria: [] as any[], status: [] as any[] });

  useEffect(() => {
    fetchData();
  }, [filtroStatus, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // KPIs
      const [ativos, novosMes, desligados, todosData] = await Promise.all([
        supabase.from('membros').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('membros').select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth(new Date()).toISOString()),
        supabase.from('membros').select('*', { count: 'exact', head: true }).neq('status', 'ativo'),
        supabase.from('membros').select('data_nascimento'),
      ]);

      // Idade média
      const idades = (todosData.data || [])
        .filter(m => m.data_nascimento)
        .map(m => differenceInYears(new Date(), new Date(m.data_nascimento!)));
      const idadeMedia = idades.length > 0 ? Math.round(idades.reduce((s, i) => s + i, 0) / idades.length) : 0;

      setKpis({
        ativos: ativos.count || 0,
        novosMes: novosMes.count || 0,
        desligados: desligados.count || 0,
        idadeMedia,
      });

      // Table data
      let countQuery = supabase.from('membros').select('*', { count: 'exact', head: true });
      if (filtroStatus !== 'todos') countQuery = countQuery.eq('status', filtroStatus);
      const { count } = await countQuery;
      setTotal(count || 0);

      let query = supabase.from('membros').select('*').order('nome').range((page - 1) * limit, page * limit - 1);
      if (filtroStatus !== 'todos') query = query.eq('status', filtroStatus);
      const { data } = await query;
      setMembros(data || []);

      // Charts
      // Entradas por mês
      const entradas = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(new Date(), i);
        const { count } = await supabase.from('membros').select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth(mes).toISOString())
          .lte('created_at', endOfMonth(mes).toISOString());
        entradas.push({ mes: format(mes, 'MMM', { locale: ptBR }), novos: count || 0 });
      }

      // Faixa etária
      const faixas = { '0-17': 0, '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
      idades.forEach(i => {
        if (i <= 17) faixas['0-17']++;
        else if (i <= 30) faixas['18-30']++;
        else if (i <= 45) faixas['31-45']++;
        else if (i <= 60) faixas['46-60']++;
        else faixas['60+']++;
      });
      const faixaEtaria = Object.entries(faixas).map(([name, value]) => ({ name, value }));

      // Status
      const status = [
        { name: 'Ativos', value: ativos.count || 0 },
        { name: 'Inativos', value: desligados.count || 0 },
      ];

      setChartData({ entradas, faixaEtaria, status });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(membros.map(m => ({
      Nome: m.nome,
      Telefone: m.telefone || '',
      Status: statusLabels[m.status] || m.status,
      'Data Nascimento': m.data_nascimento ? format(new Date(m.data_nascimento), 'dd/MM/yyyy') : '',
      Idade: m.data_nascimento ? differenceInYears(new Date(), new Date(m.data_nascimento)) : '',
    })), 'relatorio_membros');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPDF(true);
    try {
      await exportToPDF(reportRef.current, 'relatorio_membros');
      toast.success('PDF exportado com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Não foi possível gerar o PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório de Membros</h1>
          <p className="text-muted-foreground">Análise detalhada da membresia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {exportingPDF ? 'Gerando...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.ativos}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.novosMes}</p>
                <p className="text-xs text-muted-foreground">Novos/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserMinus className="w-6 h-6 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.desligados}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.idadeMedia}</p>
                <p className="text-xs text-muted-foreground">Idade média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Entradas por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.entradas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="novos" stroke="#396939" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Faixa Etária</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.faixaEtaria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#5A9462" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Ativos vs Inativos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData.status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {chartData.status.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
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
        <CardHeader><CardTitle className="text-base">Lista de Membros</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Telefone</th>
                  <th className="text-left p-2">Idade</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {membros.map(m => (
                  <tr key={m.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{m.nome}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {m.telefone ? formatPhoneBR(m.telefone) : '–'}
                        {hasValidPhone(m.telefone) && (
                          <button onClick={() => window.open(getWhatsAppUrl(m.telefone), '_blank')} className="text-green-600">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{m.data_nascimento ? differenceInYears(new Date(), new Date(m.data_nascimento)) : '–'}</td>
                    <td className="p-2">
                      <Badge className={m.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {statusLabels[m.status] || m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">Página {page} de {Math.ceil(total / limit)}</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
