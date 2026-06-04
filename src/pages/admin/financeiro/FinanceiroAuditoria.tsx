import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  History,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  entidade: string;
  entidade_id: string | null;
  acao: string;
  payload: unknown;
  usuario_id: string | null;
  created_at: string;
  usuario?: { nome: string } | null;
}

export default function FinanceiroAuditoria() {
  const { churchId: authChurchId } = useAuth();
  const { church } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("todas");
  const [filtroEntidade, setFiltroEntidade] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Modal de detalhes
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, search, filtroAcao, filtroEntidade, dataInicio, dataFim, churchId]);

  const fetchLogs = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("auditoria_financeira")
        .select(
          `
          id,
          entidade,
          entidade_id,
          acao,
          payload,
          usuario_id,
          created_at,
          usuario:profiles!auditoria_financeira_usuario_id_fkey(nome)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filtroAcao !== "todas") {
        query = query.eq("acao", filtroAcao);
      }
      if (filtroEntidade !== "todas") {
        query = query.eq("entidade", filtroEntidade);
      }
      if (dataInicio) {
        query = query.gte("created_at", `${dataInicio}T00:00:00`);
      }
      if (dataFim) {
        query = query.lte("created_at", `${dataFim}T23:59:59`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Filtro de busca local (usuário)
      let filteredData = data || [];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(
          (log) =>
            log.usuario?.nome?.toLowerCase().includes(searchLower) ||
            log.entidade?.toLowerCase().includes(searchLower) ||
            log.entidade_id?.toLowerCase().includes(searchLower)
        );
      }

      setLogs(filteredData);
      setTotal(count || 0);
    } catch (error) {
      console.error("Erro ao carregar auditoria:", error);
      toast.error("Erro ao carregar registros de auditoria");
    } finally {
      setLoading(false);
    }
  };

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case "create":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Plus className="h-3 w-3 mr-1" />
            Criação
          </Badge>
        );
      case "update":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Pencil className="h-3 w-3 mr-1" />
            Atualização
          </Badge>
        );
      case "delete":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Trash2 className="h-3 w-3 mr-1" />
            Exclusão
          </Badge>
        );
      default:
        return <Badge variant="secondary">{acao}</Badge>;
    }
  };

  const getEntidadeLabel = (entidade: string) => {
    const labels: Record<string, string> = {
      transacoes_financeiras: "Transação",
      contas_financeiras: "Conta",
      categorias_financeiras: "Categoria",
    };
    return labels[entidade] || entidade;
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    const headers = ["Data/Hora", "Usuário", "Ação", "Entidade", "ID Registro", "Detalhes"];
    const rows = logs.map((log) => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
      log.usuario?.nome || "Sistema",
      log.acao,
      getEntidadeLabel(log.entidade),
      log.entidade_id || "-",
      JSON.stringify(log.payload || {}).replace(/"/g, '""'),
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => `"${r.join('";"')}"`)].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_financeira_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const clearFilters = () => {
    setSearch("");
    setFiltroAcao("todas");
    setFiltroEntidade("todas");
    setDataInicio("");
    setDataFim("");
    setPage(1);
  };

  const openDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria Financeira</h1>
          <p className="text-muted-foreground">
            Histórico de alterações no módulo financeiro
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroAcao} onValueChange={setFiltroAcao}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
              <SelectTrigger>
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as entidades</SelectItem>
                <SelectItem value="transacoes_financeiras">Transações</SelectItem>
                <SelectItem value="contas_financeiras">Contas</SelectItem>
                <SelectItem value="categorias_financeiras">Categorias</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>

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
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum registro de auditoria encontrado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID Registro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{log.usuario?.nome || "Sistema"}</TableCell>
                      <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                      <TableCell>{getEntidadeLabel(log.entidade)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entidade_id?.slice(0, 8) || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Detalhes da Auditoria
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedLog.usuario?.nome || "Sistema"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ação</p>
                  <div>{getAcaoBadge(selectedLog.acao)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entidade</p>
                  <p className="font-medium">{getEntidadeLabel(selectedLog.entidade)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">ID do Registro</p>
                  <p className="font-mono text-sm">{selectedLog.entidade_id || "-"}</p>
                </div>
              </div>

              {selectedLog.payload && typeof selectedLog.payload === 'object' && Object.keys(selectedLog.payload as object).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dados Alterados</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
