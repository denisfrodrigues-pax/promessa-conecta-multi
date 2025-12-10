import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Download, FileText, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function RelatorioFinanceiro() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [chartData, setChartData] = useState({ mensal: [] as any[], categorias: [] as any[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mesAtual = new Date();
      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);

      // Transações do mês
      const { data } = await supabase.from('transacoes_financeiras')
        .select('*, categorias_financeiras(nome)')
        .gte('data_operacao', format(inicioMes, 'yyyy-MM-dd'))
        .lte('data_operacao', format(fimMes, 'yyyy-MM-dd'))
        .eq('status', 'confirmado')
        .order('data_operacao', { ascending: false });

      setTransacoes(data || []);

      // KPIs
      const entradas = (data || []).filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
      const saidas = (data || []).filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
      setKpis({ entradas, saidas, saldo: entradas - saidas });

      // Charts
      // Mensal
      const mensal = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(new Date(), i);
        const { data: mesData } = await supabase.from('transacoes_financeiras')
          .select('tipo, valor')
          .gte('data_operacao', format(startOfMonth(mes), 'yyyy-MM-dd'))
          .lte('data_operacao', format(endOfMonth(mes), 'yyyy-MM-dd'))
          .eq('status', 'confirmado');
        const entradasMes = (mesData || []).filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
        const saidasMes = (mesData || []).filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
        mensal.push({ mes: format(mes, 'MMM', { locale: ptBR }), entradas: entradasMes, saidas: saidasMes });
      }

      // Por categoria
      const catCount: Record<string, number> = {};
      (data || []).forEach(t => {
        const cat = t.categorias_financeiras?.nome || 'Sem categoria';
        catCount[cat] = (catCount[cat] || 0) + t.valor;
      });
      const categorias = Object.entries(catCount).map(([name, value]) => ({ name, value }));

      setChartData({ mensal, categorias });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(transacoes.map(t => ({
      Data: format(new Date(t.data_operacao), 'dd/MM/yyyy'),
      Tipo: t.tipo === 'receita' ? 'Entrada' : 'Saída',
      Categoria: t.categorias_financeiras?.nome || '',
      Descrição: t.descricao || '',
      Valor: t.valor.toFixed(2),
    })), 'relatorio_financeiro');
  };

  const handleExportPDF = () => {
    if (reportRef.current) exportToPDF(reportRef.current, 'relatorio_financeiro');
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório Financeiro</h1>
          <p className="text-muted-foreground">Visão executiva das finanças</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-2" />PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {kpis.entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-muted-foreground">Entradas do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {kpis.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-muted-foreground">Saídas do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className={`w-8 h-8 ${kpis.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className={`text-2xl font-bold ${kpis.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-muted-foreground">Saldo do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Entradas vs Saídas - Últimos 6 meses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.mensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.categorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.categorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Últimas Transações</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-right p-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.slice(0, 10).map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{format(new Date(t.data_operacao), 'dd/MM/yyyy')}</td>
                    <td className="p-2">
                      <span className={t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                        {t.tipo === 'receita' ? '↑ Entrada' : '↓ Saída'}
                      </span>
                    </td>
                    <td className="p-2">{t.categorias_financeiras?.nome || '–'}</td>
                    <td className="p-2">{t.descricao || '–'}</td>
                    <td className={`p-2 text-right font-medium ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
