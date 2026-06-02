import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserPlus,
  Network,
  Baby,
  Wallet,
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";

const COLORS = ["#5A9462", "#396939", "#73A97A", "#D9534F", "#85A89A", "#E6A327"];

export default function RelatorioGeral() {
  const { churchId } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [kpis, setKpis] = useState({
    visitantesMes: 0,
    taxaConversao: 0,
    basesAtivas: 0,
    membrosAtivos: 0,
    kidsPresentes: 0,
    transacoesMes: 0,
    saldoMes: 0,
  });
  const [chartData, setChartData] = useState({
    visitantesMensal: [] as any[],
    acompStatus: [] as any[],
    membrosStatus: [] as any[],
    checkinsSalas: [] as any[],
    financeiroMensal: [] as any[],
  });

  useEffect(() => {
    fetchData();
  }, [churchId]);

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const mesAtual = new Date();
      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);

      // KPIs
      const [visitantes, bases, membros, checkins, transacoes] = await Promise.all([
        supabase
          .from("visitantes")
          .select("*", { count: "exact", head: true })
          .eq("church_id", churchId)
          .gte("created_at", inicioMes.toISOString())
          .lte("created_at", fimMes.toISOString()),
        supabase.from("bases").select("*", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "ativo"),
        supabase.from("membros").select("*", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "ativo"),
        supabase
          .from("checkins_kids")
          .select("*", { count: "exact", head: true })
          .eq("status", "presente")
          .gte("checkin_at", format(new Date(), "yyyy-MM-dd")),
        supabase
          .from("transacoes_financeiras")
          .select("tipo, valor")
          .gte("data_operacao", format(inicioMes, "yyyy-MM-dd"))
          .lte("data_operacao", format(fimMes, "yyyy-MM-dd"))
          .eq("status", "confirmado"),
      ]);

      // Taxa conversão
      const { count: acompCount } = await supabase.from("acompanhamentos").select("*", { count: "exact", head: true });
      const taxaConversao =
        visitantes.count && visitantes.count > 0 ? Math.round(((acompCount || 0) / visitantes.count) * 100) : 0;

      // Saldo do mês
      const saldoMes = (transacoes.data || []).reduce((acc, t) => {
        return acc + (t.tipo === "receita" ? t.valor : -t.valor);
      }, 0);

      setKpis({
        visitantesMes: visitantes.count || 0,
        taxaConversao,
        basesAtivas: bases.count || 0,
        membrosAtivos: membros.count || 0,
        kidsPresentes: checkins.count || 0,
        transacoesMes: transacoes.data?.length || 0,
        saldoMes,
      });

      // Charts data
      await fetchChartData();
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Visitantes últimos 6 meses
    const visitantesMensal = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const { count } = await supabase
        .from("visitantes")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId!)
        .gte("created_at", startOfMonth(mes).toISOString())
        .lte("created_at", endOfMonth(mes).toISOString());
      visitantesMensal.push({ mes: format(mes, "MMM", { locale: ptBR }), visitantes: count || 0 });
    }

    // Acompanhamentos por status
    const { data: acompData } = await supabase.from("acompanhamentos").select("status");
    const acompStatus = Object.entries(
      (acompData || []).reduce((acc: Record<string, number>, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    // Membros ativos vs inativos
    const { count: ativos } = await supabase
      .from("membros")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId!)
      .eq("status", "ativo");
    const { count: inativos } = await supabase
      .from("membros")
      .select("*", { count: "exact", head: true })
      .eq("church_id", churchId!)
      .neq("status", "ativo");
    const membrosStatus = [
      { name: "Ativos", value: ativos || 0 },
      { name: "Inativos", value: inativos || 0 },
    ];

    // Check-ins por sala
    const { data: salasData } = await supabase.from("salas").select("id, nome");
    const checkinsSalas = await Promise.all(
      (salasData || []).map(async (sala) => {
        const { count } = await supabase
          .from("checkins_kids")
          .select("*", { count: "exact", head: true })
          .eq("sala_id", sala.id)
          .gte("checkin_at", format(startOfMonth(new Date()), "yyyy-MM-dd"));
        return { sala: sala.nome, checkins: count || 0 };
      }),
    );

    // Financeiro mensal
    const financeiroMensal = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const { data } = await supabase
        .from("transacoes_financeiras")
        .select("tipo, valor")
        .gte("data_operacao", format(startOfMonth(mes), "yyyy-MM-dd"))
        .lte("data_operacao", format(endOfMonth(mes), "yyyy-MM-dd"))
        .eq("status", "confirmado");
      const entradas = (data || []).filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
      const saidas = (data || []).filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
      financeiroMensal.push({ mes: format(mes, "MMM", { locale: ptBR }), entradas, saidas });
    }

    setChartData({ visitantesMensal, acompStatus, membrosStatus, checkinsSalas, financeiroMensal });
  };

  const handleExportCSV = () => {
    const data = [
      { metrica: "Visitantes no Mês", valor: kpis.visitantesMes },
      { metrica: "Taxa de Conversão", valor: `${kpis.taxaConversao}%` },
      { metrica: "Bases Ativas", valor: kpis.basesAtivas },
      { metrica: "Membros Ativos", valor: kpis.membrosAtivos },
      { metrica: "Kids Presentes Hoje", valor: kpis.kidsPresentes },
      { metrica: "Transações do Mês", valor: kpis.transacoesMes },
      { metrica: "Saldo do Mês", valor: kpis.saldoMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    ];
    exportToCSV(data, "relatorio_geral");
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPDF(true);
    try {
      await exportToPDF(reportRef.current, "relatorio_geral");
      toast.success("PDF exportado com sucesso.");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório Consolidado</h1>
          <p className="text-muted-foreground">Visão geral de todas as áreas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {exportingPDF ? "Gerando..." : "PDF"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.visitantesMes}</p>
                <p className="text-xs text-muted-foreground">Visitantes/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.taxaConversao}%</p>
                <p className="text-xs text-muted-foreground">Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.basesAtivas}</p>
                <p className="text-xs text-muted-foreground">Bases ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{kpis.membrosAtivos}</p>
                <p className="text-xs text-muted-foreground">Membros ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.kidsPresentes}</p>
                <p className="text-xs text-muted-foreground">Kids hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.transacoesMes}</p>
                <p className="text-xs text-muted-foreground">Transações/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${kpis.saldoMes >= 0 ? "text-green-600" : "text-red-600"}`} />
              <div>
                <p className={`text-xl font-bold ${kpis.saldoMes >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {kpis.saldoMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-xs text-muted-foreground">Saldo/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Visitantes - Últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.visitantesMensal}>
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
          <CardHeader>
            <CardTitle className="text-base font-bold">Membros por Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.membrosStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.membrosStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Financeiro - Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.financeiroMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#5A9462" />
                <Bar dataKey="saidas" name="Saídas" fill="#D9534F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Check-ins Kids por Sala</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.checkinsSalas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="sala" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="checkins" fill="#5A9462" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
