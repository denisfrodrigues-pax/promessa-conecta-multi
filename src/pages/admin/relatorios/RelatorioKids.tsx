import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Baby, Download, FileText, Users, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

export default function RelatorioKids() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ criancas: 0, presentesHoje: 0, checkinsMes: 0, salas: 0 });
  const [chartData, setChartData] = useState({ diario: [] as any[], salas: [] as any[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const inicioMes = startOfMonth(new Date());

      // KPIs
      const [criancas, presentesHoje, checkinsMes, salas] = await Promise.all([
        supabase.from('criancas').select('*', { count: 'exact', head: true }),
        supabase.from('checkins_kids').select('*', { count: 'exact', head: true })
          .eq('status', 'presente').gte('checkin_at', hoje),
        supabase.from('checkins_kids').select('*', { count: 'exact', head: true })
          .gte('checkin_at', inicioMes.toISOString()),
        supabase.from('salas_kids').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
      ]);

      setKpis({
        criancas: criancas.count || 0,
        presentesHoje: presentesHoje.count || 0,
        checkinsMes: checkinsMes.count || 0,
        salas: salas.count || 0,
      });

      // Últimos check-ins
      const { data: ultimosCheckins } = await supabase.from('checkins_kids')
        .select('*, criancas(nome), salas_kids(nome), responsaveis(nome)')
        .order('checkin_at', { ascending: false })
        .limit(10);
      setCheckins(ultimosCheckins || []);

      // Charts
      // Diário (últimos 7 dias)
      const diario = [];
      for (let i = 6; i >= 0; i--) {
        const dia = subDays(new Date(), i);
        const diaStr = format(dia, 'yyyy-MM-dd');
        const { count } = await supabase.from('checkins_kids').select('*', { count: 'exact', head: true })
          .gte('checkin_at', diaStr)
          .lt('checkin_at', format(subDays(new Date(), i - 1), 'yyyy-MM-dd'));
        diario.push({ dia: format(dia, 'EEE', { locale: ptBR }), checkins: count || 0 });
      }

      // Por sala
      const { data: salasData } = await supabase.from('salas_kids').select('id, nome, capacidade');
      const salasComCheckins = await Promise.all((salasData || []).map(async (sala) => {
        const { count } = await supabase.from('checkins_kids').select('*', { count: 'exact', head: true })
          .eq('sala_id', sala.id)
          .gte('checkin_at', inicioMes.toISOString());
        return { sala: sala.nome, checkins: count || 0 };
      }));

      setChartData({ diario, salas: salasComCheckins });
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(checkins.map(c => ({
      Criança: c.criancas?.nome || '',
      Sala: c.salas_kids?.nome || '',
      Responsável: c.responsaveis?.nome || '',
      'Data/Hora': format(new Date(c.checkin_at), 'dd/MM/yyyy HH:mm'),
      Status: c.status,
    })), 'relatorio_kids');
  };

  const handleExportPDF = () => {
    if (reportRef.current) exportToPDF(reportRef.current, 'relatorio_kids');
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório Kids</h1>
          <p className="text-muted-foreground">Análise do ministério infantil</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText className="w-4 h-4 mr-2" />PDF</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Baby className="w-6 h-6 text-pink-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.criancas}</p>
                <p className="text-xs text-muted-foreground">Crianças</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.presentesHoje}</p>
                <p className="text-xs text-muted-foreground">Presentes hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.checkinsMes}</p>
                <p className="text-xs text-muted-foreground">Check-ins/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.salas}</p>
                <p className="text-xs text-muted-foreground">Salas ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Check-ins - Últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.diario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checkins" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Check-ins por Sala (mês)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.salas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="sala" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="checkins" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Últimos Check-ins</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Criança</th>
                  <th className="text-left p-2">Sala</th>
                  <th className="text-left p-2">Responsável</th>
                  <th className="text-left p-2">Data/Hora</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{c.criancas?.nome || '–'}</td>
                    <td className="p-2">{c.salas_kids?.nome || '–'}</td>
                    <td className="p-2">{c.responsaveis?.nome || '–'}</td>
                    <td className="p-2">{format(new Date(c.checkin_at), 'dd/MM HH:mm')}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${c.status === 'presente' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {c.status}
                      </span>
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
