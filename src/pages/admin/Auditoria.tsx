import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Clock,
  User,
  Database,
  RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string | null;
  user?: {
    nome: string;
    email: string;
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const variants: Record<string, { color: string; label: string }> = {
    CREATE: { color: 'bg-green-500/10 text-green-700 border-green-200', label: 'Criação' },
    UPDATE: { color: 'bg-blue-500/10 text-blue-700 border-blue-200', label: 'Atualização' },
    DELETE: { color: 'bg-red-500/10 text-red-700 border-red-200', label: 'Exclusão' },
    LOGIN: { color: 'bg-purple-500/10 text-purple-700 border-purple-200', label: 'Login' },
    LOGOUT: { color: 'bg-gray-500/10 text-gray-700 border-gray-200', label: 'Logout' },
    CONFIG_UPDATE: { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', label: 'Config' },
  };

  const variant = variants[action] || { color: 'bg-muted text-muted-foreground', label: action };

  return (
    <Badge variant="outline" className={variant.color}>
      {variant.label}
    </Badge>
  );
}

function TableBadge({ tableName }: { tableName: string }) {
  const labels: Record<string, string> = {
    'configuracoes_instituicao': 'Configurações',
    'bases': 'Bases',
    'membros': 'Membros',
    'visitantes': 'Visitantes',
    'eventos': 'Eventos',
    'escalas': 'Escalas',
    'ministerios': 'Ministérios',
    'profiles': 'Perfis',
    'avisos': 'Avisos',
    'auth': 'Autenticação',
  };

  return (
    <Badge variant="secondary">
      {labels[tableName] || tableName}
    </Badge>
  );
}

export default function Auditoria() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('30');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !isAdmin) {
      navigate('/home');
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, filterTable, filterPeriodo]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const dataInicio = subDays(new Date(), parseInt(filterPeriodo));
      
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      if (filterTable !== 'all') {
        query = query.eq('table_name', filterTable);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user names for each log
      const logsWithUsers: AuditLog[] = await Promise.all(
        (data || []).map(async (log) => {
          if (log.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nome, email')
              .eq('id', log.user_id)
              .maybeSingle();
            
            return { ...log, user: profile || undefined };
          }
          return log;
        })
      );

      setLogs(logsWithUsers);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (!searchTerm.trim()) {
      fetchLogs();
      return;
    }

    const filtered = logs.filter(log => 
      log.record_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setLogs(filtered);
  }

  function exportarCSV() {
    const csvContent = [
      ['Data', 'Usuário', 'Ação', 'Tabela', 'Registro'].join(','),
      ...logs.map(log => [
        log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : '',
        log.user?.nome || 'Sistema',
        log.action,
        log.table_name,
        log.record_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('Log de auditoria exportado com sucesso.');
  }

  function viewDetails(log: AuditLog) {
    setSelectedLog(log);
    setDetailOpen(true);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Log de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Rastreamento de todas as ações críticas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, tabela ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Ações</SelectItem>
                <SelectItem value="CREATE">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="CONFIG_UPDATE">Configuração</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <Database className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Tabelas</SelectItem>
                <SelectItem value="configuracoes_instituicao">Configurações</SelectItem>
                <SelectItem value="bases">Bases</SelectItem>
                <SelectItem value="membros">Membros</SelectItem>
                <SelectItem value="visitantes">Visitantes</SelectItem>
                <SelectItem value="eventos">Eventos</SelectItem>
                <SelectItem value="escalas">Escalas</SelectItem>
                <SelectItem value="ministerios">Ministérios</SelectItem>
                <SelectItem value="profiles">Perfis</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros ({totalCount})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Página {page} de {totalPages || 1}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro de auditoria encontrado.</p>
              <p className="text-sm">Os logs aparecerão aqui conforme ações forem realizadas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium">Ação</th>
                    <th className="text-left py-3 px-4 font-medium">Tabela</th>
                    <th className="text-left py-3 px-4 font-medium">Registro</th>
                    <th className="text-center py-3 px-4 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {log.created_at 
                              ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : '-'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{log.user?.nome || 'Sistema'}</p>
                            {log.user?.email && (
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="py-3 px-4">
                        <TableBadge tableName={log.table_name} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.record_id ? `${log.record_id.slice(0, 8)}...` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewDetails(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, totalCount)} de {totalCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {selectedLog.created_at 
                      ? format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedLog.user?.nome || 'Sistema'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ação</p>
                  <ActionBadge action={selectedLog.action} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tabela</p>
                  <TableBadge tableName={selectedLog.table_name} />
                </div>
              </div>

              {selectedLog.record_id && (
                <div>
                  <p className="text-sm text-muted-foreground">ID do Registro</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded">{selectedLog.record_id}</p>
                </div>
              )}

              <Separator />

              {selectedLog.old_data && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dados Anteriores</p>
                  <ScrollArea className="h-32">
                    <pre className="text-xs bg-red-500/5 p-3 rounded border border-red-500/20 overflow-auto">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dados Novos</p>
                  <ScrollArea className="h-32">
                    <pre className="text-xs bg-green-500/5 p-3 rounded border border-green-500/20 overflow-auto">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
