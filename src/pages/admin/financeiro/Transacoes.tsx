import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Transacao {
  id: string;
  descricao: string | null;
  valor: number;
  tipo: string;
  data_operacao: string;
  status: string;
  referencia: string | null;
  categoria: { id: string; nome: string } | null;
  conta: { id: string; nome: string } | null;
}

interface Conta {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
  natureza: string;
}

// Sanitize search input to prevent SQL pattern injection
const sanitizeSearch = (input: string): string => {
  return input.replace(/[%_\\]/g, '\\$&').trim();
};

export default function Transacoes() {
  const { churchId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroConta, setFiltroConta] = useState<string>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    fetchContas();
    fetchCategorias();
  }, [churchId]);

  useEffect(() => {
    fetchTransacoes();
  }, [page, search, filtroTipo, filtroConta, filtroCategoria, filtroStatus, dataInicio, dataFim, churchId]);

  const fetchContas = async () => {
    if (!churchId) return;
    const { data } = await supabase
      .from("contas_financeiras")
      .select("id, nome")
      .eq("status", "ativa")
      .order("nome");
    setContas(data || []);
  };

  const fetchCategorias = async () => {
    if (!churchId) return;
    const { data } = await supabase
      .from("categorias_financeiras")
      .select("id, nome, natureza")
      .eq("church_id", churchId)
      .order("nome");
    setCategorias(data || []);
  };

  const fetchTransacoes = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("transacoes_financeiras")
        .select(
          `
          id,
          descricao,
          valor,
          tipo,
          data_operacao,
          status,
          referencia,
          categoria:categorias_financeiras(id, nome),
          conta:contas_financeiras(id, nome)
        `,
          { count: "exact" }
        )
        .order("data_operacao", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        const sanitizedSearch = sanitizeSearch(search);
        query = query.or(`descricao.ilike.%${sanitizedSearch}%,referencia.ilike.%${sanitizedSearch}%`);
      }
      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }
      if (filtroConta !== "todas") {
        query = query.eq("conta_id", filtroConta);
      }
      if (filtroCategoria !== "todas") {
        query = query.eq("categoria_id", filtroCategoria);
      }
      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }
      if (dataInicio) {
        query = query.gte("data_operacao", dataInicio);
      }
      if (dataFim) {
        query = query.lte("data_operacao", dataFim);
      }

      const { data, count, error } = await query;

      if (error) throw error;
      setTransacoes(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      toast.error("Erro ao carregar transações");
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

    const headers = [
      "Data",
      "Conta",
      "Categoria",
      "Tipo",
      "Valor",
      "Descrição",
      "Referência",
      "Status",
    ];
    const rows = transacoes.map((t) => [
      format(new Date(t.data_operacao), "dd/MM/yyyy"),
      t.conta?.nome || "",
      t.categoria?.nome || "",
      t.tipo,
      t.valor.toString().replace(".", ","),
      (t.descricao || "").replace(/"/g, '""'),
      t.referencia || "",
      t.status,
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => `"${r.join('";"')}"`)].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
        return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFiltroTipo("todos");
    setFiltroConta("todas");
    setFiltroCategoria("todas");
    setFiltroStatus("todos");
    setDataInicio("");
    setDataFim("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transações</h1>
          <p className="text-muted-foreground">Gerencie os lançamentos financeiros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => navigate("/admin/financeiro/transacoes/novo")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou referência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroConta} onValueChange={setFiltroConta}>
              <SelectTrigger>
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as contas</SelectItem>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} ({c.natureza})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Data início"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data fim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transacoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {format(new Date(t.data_operacao), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {t.descricao || "-"}
                      </TableCell>
                      <TableCell>{t.conta?.nome || "-"}</TableCell>
                      <TableCell>{t.categoria?.nome || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {t.tipo === "receita" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                          <span className="capitalize">{t.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          t.tipo === "receita" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.tipo === "receita" ? "+" : "-"}
                        {formatCurrency(Number(t.valor))}
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/financeiro/transacoes/${t.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, total)} de {total} registros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
