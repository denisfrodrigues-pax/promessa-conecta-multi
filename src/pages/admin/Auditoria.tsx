import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Download, Eye, ChevronLeft, ChevronRight,
  Shield, Clock, RefreshCw, PlusCircle, Pencil, Trash2,
} from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  created_at: string | null;
  userName?: string;
  userEmail?: string;
}

// ── Mapeamentos ────────────────────────────────────────────────────────────────

const ACTION_MAP: Record<string, { label: string; verb: string; color: string; icon: React.ReactNode }> = {
  INSERT: { label: 'Criou',   verb: 'criou',   color: 'bg-green-100 text-green-800 border-green-200', icon: <PlusCircle className="w-3.5 h-3.5" /> },
  CREATE: { label: 'Criou',   verb: 'criou',   color: 'bg-green-100 text-green-800 border-green-200', icon: <PlusCircle className="w-3.5 h-3.5" /> },
  UPDATE: { label: 'Editou',  verb: 'editou',  color: 'bg-blue-100 text-blue-800 border-blue-200',   icon: <Pencil className="w-3.5 h-3.5" /> },
  DELETE: { label: 'Excluiu', verb: 'excluiu', color: 'bg-red-100 text-red-800 border-red-200',      icon: <Trash2 className="w-3.5 h-3.5" /> },
};

const TABLE_MAP: Record<string, string> = {
  escalas:                     'Escala',
  profiles:                    'Membro',
  ministerio_usuarios:         'Voluntário no Ministério',
  ministerios:                 'Ministério',
  musicas_repertorio:          'Música',
  transacoes_financeiras:      'Transação Financeira',
  eb_matriculas:               'Matrícula EB',
  eb_presencas:                'Presença EB',
  eb_ciclos:                   'Ciclo EB',
  eb_disciplinas:              'Disciplina EB',
  eb_aulas:                    'Aula EB',
  visitantes:                  'Visitante',
  bases:                       'Base',
  eventos:                     'Evento',
  avisos:                      'Aviso',
  configuracoes_instituicao:   'Configuração',
  grupos:                      'Grupo',
  grupos_participantes:        'Participante de Grupo',
  notificacoes:                'Notificação',
  turmas_infantil:             'Turma Kids',
};

function tableName(t: string) {
  return TABLE_MAP[t] || t;
}

function actionInfo(a: string) {
  return ACTION_MAP[a] ?? { label: a, verb: a.toLowerCase(), color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
}

function getPeriodStart(periodo: string): Date {
  const now = new Date();
  switch (periodo) {
    case 'hoje':   return startOfDay(now);
    case 'semana': return startOfWeek(now, { locale: ptBR });
    case 'mes':    return startOfMonth(now);
    case '7':      return subDays(now, 7);
    case '90':     return subDays(now, 90);
    default:       return subDays(now, 30);  // '30'
  }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-36" />)}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Auditoria() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable]   = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('30');

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    else if (!authLoading && !isAdmin) navigate('/home');
  }, [user, authLoading, isAdmin, navigate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const desde = getPeriodStart(filterPeriodo);

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', desde.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (filterAction !== 'all') query = query.eq('action', filterAction);
      if (filterTable  !== 'all') query = query.eq('table_name', filterTable);

      const { data, error, count } = await query;
      if (error) throw error;

      // Batch user fetch — UMA query para todos os user_ids da página
      const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))] as string[];
      const userMap: Record<string, { nome: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', userIds);
        (profiles || []).forEach(p => { userMap[p.id] = { nome: p.nome || '', email: p.email || '' }; });
      }

      const enriched: AuditLog[] = (data || []).map(log => ({
        ...log,
        userName:  log.user_id ? (userMap[log.user_id]?.nome  || 'Sistema') : 'Sistema',
        userEmail: log.user_id ? (userMap[log.user_id]?.email || '')        : '',
      }));

      setLogs(enriched);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterTable, filterPeriodo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page ao mudar filtros
  useEffect(() => { setPage(1); }, [filterAction, filterTable, filterPeriodo]);

  function exportarCSV() {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const lines = [
      ['Data/Hora', 'Usuário', 'Ação', 'Módulo', 'ID do Registro'].join(';'),
      ...logs.map(log => [
        log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
        log.userName || 'Sistema',
        actionInfo(log.action).label,
        tableName(log.table_name),
        log.record_id || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')),
    ].join('\r\n');

    const blob = new Blob([bom, lines], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Exportado com sucesso');
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (authLoading || (loading && logs.length === 0)) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Log de Auditoria
          </h1>
          <p className="text-muted-foreground text-sm">
            Rastreamento de todas as ações críticas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Período */}
        <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
          <SelectTrigger className="w-[150px]">
            <Clock className="w-4 h-4 mr-2 shrink-0" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Esta semana</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        {/* Tipo de ação */}
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="INSERT">Criou</SelectItem>
            <SelectItem value="UPDATE">Editou</SelectItem>
            <SelectItem value="DELETE">Excluiu</SelectItem>
          </SelectContent>
        </Select>

        {/* Módulo */}
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            <SelectItem value="profiles">Membro</SelectItem>
            <SelectItem value="escalas">Escala</SelectItem>
            <SelectItem value="ministerio_usuarios">Voluntário no Ministério</SelectItem>
            <SelectItem value="musicas_repertorio">Música</SelectItem>
            <SelectItem value="transacoes_financeiras">Transação Financeira</SelectItem>
            <SelectItem value="eb_matriculas">Matrícula EB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{totalCount} registro{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}</span>
            <span className="text-sm font-normal text-muted-foreground">
              Página {page} de {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum registro encontrado</p>
              <p className="text-sm mt-1">Tente ampliar o período ou mudar os filtros</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map(log => {
                const ai = actionInfo(log.action);
                const data = log.created_at
                  ? format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : '—';
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Ação badge */}
                      <Badge
                        variant="outline"
                        className={`shrink-0 flex items-center gap-1 text-xs ${ai.color}`}
                      >
                        {ai.icon}
                        {ai.label}
                      </Badge>

                      {/* Descrição legível */}
                      <p className="text-sm min-w-0">
                        <span className="font-medium">{log.userName || 'Sistema'}</span>
                        {' '}
                        <span className="text-muted-foreground">{ai.verb}</span>
                        {' '}
                        <span className="font-medium">{tableName(log.table_name)}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {data}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 w-8 h-8"
                      onClick={() => { setSelectedLog(log); setDetailOpen(true); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
              </span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Próximo<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhe */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (() => {
            const ai = actionInfo(selectedLog.action);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Data/Hora</p>
                    <p className="font-medium">
                      {selectedLog.created_at
                        ? format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Usuário</p>
                    <p className="font-medium">{selectedLog.userName || 'Sistema'}</p>
                    {selectedLog.userEmail && (
                      <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Ação</p>
                    <Badge variant="outline" className={`flex items-center gap-1 w-fit text-xs ${ai.color}`}>
                      {ai.icon}{ai.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Módulo</p>
                    <p className="font-medium">{tableName(selectedLog.table_name)}</p>
                  </div>
                </div>

                {selectedLog.record_id && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ID do Registro</p>
                    <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded">{selectedLog.record_id}</p>
                  </div>
                )}

                {(selectedLog.old_data || selectedLog.new_data) && <Separator />}

                {selectedLog.old_data && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dados Anteriores</p>
                    <ScrollArea className="h-32">
                      <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dados Novos</p>
                    <ScrollArea className="h-32">
                      <pre className="text-xs bg-green-50 p-3 rounded border border-green-200 overflow-auto">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
