import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface KPIData {
  totalReceitas: number;
  totalDespesas: number;
  saldoGeral: number;
  contasAtivas: number;
}

interface ChartData {
  mes: string;
  receitas: number;
  despesas: number;
}

interface TransacaoRecente {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  data_operacao: string;
  categoria: { nome: string } | null;
  conta: { nome: string } | null;
}

export default function FinanceiroDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoGeral: 0,
    contasAtivas: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [transacoesRecentes, setTransacoesRecentes] = useState<TransacaoRecente[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const inicioMes = startOfMonth(new Date()).toISOString().split("T")[0];
      const fimMes = endOfMonth(new Date()).toISOString().split("T")[0];

      // KPIs do mês
      const { data: transacoesMes } = await supabase
        .from("transacoes_financeiras")
        .select("tipo, valor")
        .gte("data_operacao", inicioMes)
        .lte("data_operacao", fimMes)
        .eq("status", "confirmado");

      const receitas = transacoesMes?.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + Number(t.valor), 0) || 0;
      const despesas = transacoesMes?.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + Number(t.valor), 0) || 0;

      // Saldo geral das contas
      const { data: contas } = await supabase
        .from("contas_financeiras")
        .select("saldo, status")
        .eq("status", "ativa");

      const saldoGeral = contas?.reduce((acc, c) => acc + Number(c.saldo), 0) || 0;
      const contasAtivas = contas?.length || 0;

      setKpis({
        totalReceitas: receitas,
        totalDespesas: despesas,
        saldoGeral,
        contasAtivas,
      });

      // Dados para gráfico (últimos 6 meses)
      const chartDataTemp: ChartData[] = [];
      for (let i = 5; i >= 0; i--) {
        const data = subMonths(new Date(), i);
        const inicio = startOfMonth(data).toISOString().split("T")[0];
        const fim = endOfMonth(data).toISOString().split("T")[0];

        const { data: transacoes } = await supabase
          .from("transacoes_financeiras")
          .select("tipo, valor")
          .gte("data_operacao", inicio)
          .lte("data_operacao", fim)
          .eq("status", "confirmado");

        const receitasMes = transacoes?.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + Number(t.valor), 0) || 0;
        const despesasMes = transacoes?.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + Number(t.valor), 0) || 0;

        chartDataTemp.push({
          mes: format(data, "MMM", { locale: ptBR }),
          receitas: receitasMes,
          despesas: despesasMes,
        });
      }
      setChartData(chartDataTemp);

      // Transações recentes
      const { data: recentes } = await supabase
        .from("transacoes_financeiras")
        .select(`
          id,
          descricao,
          valor,
          tipo,
          data_operacao,
          categoria:categorias_financeiras(nome),
          conta:contas_financeiras(nome)
        `)
        .order("data_operacao", { ascending: false })
        .limit(5);

      setTransacoesRecentes(recentes || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das finanças - {format(new Date(), "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/financeiro/transacoes/novo")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.totalReceitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(kpis.totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Geral
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.saldoGeral >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(kpis.saldoGeral)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Ativas
            </CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpis.contasAtivas}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Receitas x Despesas (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Últimos Lançamentos</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/financeiro/transacoes")}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transacoesRecentes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum lançamento encontrado
                </p>
              ) : (
                transacoesRecentes.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/admin/financeiro/transacoes/${t.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          t.tipo === "receita" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {t.tipo === "receita" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {t.descricao || t.categoria?.nome || "Sem descrição"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.data_operacao), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        t.tipo === "receita" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.tipo === "receita" ? "+" : "-"}
                      {formatCurrency(Number(t.valor))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/admin/financeiro/transacoes")}
        >
          <FileText className="h-5 w-5" />
          <span>Transações</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/admin/financeiro/contas")}
        >
          <Wallet className="h-5 w-5" />
          <span>Contas</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/admin/financeiro/categorias")}
        >
          <DollarSign className="h-5 w-5" />
          <span>Categorias</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/admin/financeiro/relatorio")}
        >
          <TrendingUp className="h-5 w-5" />
          <span>Relatório</span>
        </Button>
      </div>
    </div>
  );
}
