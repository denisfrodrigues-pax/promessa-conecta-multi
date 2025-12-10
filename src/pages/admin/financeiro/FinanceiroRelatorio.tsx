import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Resumo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  transacoes: number;
}

interface CategoriaResumo {
  id: string;
  nome: string;
  natureza: string;
  total: number;
}

interface Transacao {
  id: string;
  descricao: string | null;
  valor: number;
  tipo: string;
  data_operacao: string;
  status: string;
  categoria: { nome: string } | null;
  conta: { nome: string } | null;
}

export default function FinanceiroRelatorio() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes_atual");
  const [dataInicio, setDataInicio] = useState(startOfMonth(new Date()).toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(endOfMonth(new Date()).toISOString().split("T")[0]);

  const [resumo, setResumo] = useState<Resumo>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    transacoes: 0,
  });
  const [categoriaReceitas, setCategoriaReceitas] = useState<CategoriaResumo[]>([]);
  const [categoriaDespesas, setCategoriaDespesas] = useState<CategoriaResumo[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    handlePeriodoChange(periodo);
  }, [periodo]);

  useEffect(() => {
    if (dataInicio && dataFim) {
      fetchRelatorio();
    }
  }, [dataInicio, dataFim]);

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    const hoje = new Date();

    switch (value) {
      case "mes_atual":
        setDataInicio(startOfMonth(hoje).toISOString().split("T")[0]);
        setDataFim(endOfMonth(hoje).toISOString().split("T")[0]);
        break;
      case "mes_anterior":
        const mesAnterior = subMonths(hoje, 1);
        setDataInicio(startOfMonth(mesAnterior).toISOString().split("T")[0]);
        setDataFim(endOfMonth(mesAnterior).toISOString().split("T")[0]);
        break;
      case "ultimos_3_meses":
        setDataInicio(startOfMonth(subMonths(hoje, 2)).toISOString().split("T")[0]);
        setDataFim(endOfMonth(hoje).toISOString().split("T")[0]);
        break;
      case "ultimos_6_meses":
        setDataInicio(startOfMonth(subMonths(hoje, 5)).toISOString().split("T")[0]);
        setDataFim(endOfMonth(hoje).toISOString().split("T")[0]);
        break;
      case "ano_atual":
        setDataInicio(`${hoje.getFullYear()}-01-01`);
        setDataFim(`${hoje.getFullYear()}-12-31`);
        break;
      case "personalizado":
        // Mantém as datas atuais
        break;
    }
  };

  const fetchRelatorio = async () => {
    setLoading(true);
    try {
      // Buscar transações do período
      const { data: transacoesData, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          id,
          descricao,
          valor,
          tipo,
          data_operacao,
          status,
          categoria_id,
          categoria:categorias_financeiras(nome),
          conta:contas_financeiras(nome)
        `)
        .gte("data_operacao", dataInicio)
        .lte("data_operacao", dataFim)
        .eq("status", "confirmado")
        .order("data_operacao", { ascending: false });

      if (error) throw error;

      const transacoesList = transacoesData || [];
      setTransacoes(transacoesList);

      // Calcular resumo
      const totalReceitas = transacoesList
        .filter((t) => t.tipo === "receita")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      const totalDespesas = transacoesList
        .filter((t) => t.tipo === "despesa")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      setResumo({
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        transacoes: transacoesList.length,
      });

      // Buscar todas as categorias
      const { data: categoriasData } = await supabase
        .from("categorias_financeiras")
        .select("id, nome, natureza");

      const categorias = categoriasData || [];

      // Agrupar por categoria
      const receitasPorCategoria: CategoriaResumo[] = [];
      const despesasPorCategoria: CategoriaResumo[] = [];

      categorias.forEach((cat) => {
        const total = transacoesList
          .filter((t) => t.categoria_id === cat.id)
          .reduce((acc, t) => acc + Number(t.valor), 0);

        if (total > 0) {
          if (cat.natureza === "receita") {
            receitasPorCategoria.push({ ...cat, total });
          } else {
            despesasPorCategoria.push({ ...cat, total });
          }
        }
      });

      setCategoriaReceitas(receitasPorCategoria.sort((a, b) => b.total - a.total));
      setCategoriaDespesas(despesasPorCategoria.sort((a, b) => b.total - a.total));
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      toast.error("Erro ao carregar relatório");
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

  const exportCSV = () => {
    if (transacoes.length === 0) {
      toast.error("Nenhuma transação para exportar");
      return;
    }

    const headers = ["Data", "Conta", "Categoria", "Tipo", "Valor", "Descrição", "Status"];
    const rows = transacoes.map((t) => [
      format(new Date(t.data_operacao), "dd/MM/yyyy"),
      t.conta?.nome || "",
      t.categoria?.nome || "",
      t.tipo,
      t.valor.toString().replace(".", ","),
      (t.descricao || "").replace(/"/g, '""'),
      t.status,
    ]);

    // Adicionar linha de resumo
    rows.push([]);
    rows.push(["RESUMO DO PERÍODO"]);
    rows.push(["Total Receitas", "", "", "", resumo.totalReceitas.toString().replace(".", ",")]);
    rows.push(["Total Despesas", "", "", "", resumo.totalDespesas.toString().replace(".", ",")]);
    rows.push(["Saldo", "", "", "", resumo.saldo.toString().replace(".", ",")]);

    const csv = [headers.join(";"), ...rows.map((r) => `"${r.join('";"')}"`)].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_financeiro_${dataInicio}_${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Financeiro</h1>
          <p className="text-muted-foreground">
            Período: {format(new Date(dataInicio), "dd/MM/yyyy")} a{" "}
            {format(new Date(dataFim), "dd/MM/yyyy")}
          </p>
        </div>
        <Button onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros de período */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                  <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
                  <SelectItem value="ano_atual">Ano Atual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === "personalizado" && (
              <>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumo.totalReceitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumo.totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo do Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                resumo.saldo >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(resumo.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{resumo.transacoes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaReceitas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma receita no período
              </p>
            ) : (
              <div className="space-y-3">
                {categoriaReceitas.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm">{cat.nome}</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaDespesas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma despesa no período
              </p>
            ) : (
              <div className="space-y-3">
                {categoriaDespesas.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm">{cat.nome}</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transações do Período</CardTitle>
        </CardHeader>
        <CardContent>
          {transacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma transação encontrada no período selecionado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoes.slice(0, 20).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {format(new Date(t.data_operacao), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {t.descricao || "-"}
                    </TableCell>
                    <TableCell>{t.categoria?.nome || "-"}</TableCell>
                    <TableCell>{t.conta?.nome || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`flex items-center justify-end gap-1 font-medium ${
                          t.tipo === "receita" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.tipo === "receita" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {formatCurrency(Number(t.valor))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {transacoes.length > 20 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mostrando 20 de {transacoes.length} transações. Exporte o CSV para ver todas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
