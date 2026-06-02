import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageCircle, Filter, RefreshCw, CheckCircle, XCircle, AlertTriangle, Phone } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

interface CommunicationRecord {
  id: string;
  escala_id: string | null;
  voluntario_id: string | null;
  tipo: string;
  status: string;
  mensagem_preview: string | null;
  detalhes_erro: string | null;
  created_at: string;
  voluntario_nome?: string;
  escala_data?: string;
  escala_funcao?: string;
  ministerio_nome?: string;
}

type PeriodFilter = 'all' | '7days' | '30days' | 'month';
type StatusFilter = 'all' | 'sucesso' | 'sem_telefone' | 'erro_api';

export default function RelatorioComunicacoes() {
  const { churchId } = useAuth();
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30days');

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, periodFilter, churchId]);

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (periodFilter) {
      case '7days':
        return subDays(now, 7).toISOString();
      case '30days':
        return subDays(now, 30).toISOString();
      case 'month':
        return startOfMonth(now).toISOString();
      default:
        return null;
    }
  };

  const fetchRecords = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('historico_comunicacoes')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply date filter
      const dateFrom = getDateRangeFilter();
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch volunteer names and escala details
      const enrichedRecords = await Promise.all(
        (data || []).map(async (record) => {
          let voluntarioNome = 'Desconhecido';
          let escalaData = '';
          let escalaFuncao = '';
          let ministerioNome = '';

          // Fetch volunteer name
          if (record.voluntario_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nome')
              .eq('id', record.voluntario_id)
              .maybeSingle();
            voluntarioNome = profile?.nome || 'Desconhecido';
          }

          // Fetch escala details
          if (record.escala_id) {
            const { data: escala } = await supabase
              .from('escalas')
              .select(`
                data,
                funcao,
                ministerios(nome)
              `)
              .eq('id', record.escala_id)
              .maybeSingle();
            
            if (escala) {
              escalaData = escala.data;
              escalaFuncao = escala.funcao;
              ministerioNome = (escala.ministerios as { nome: string } | null)?.nome || '';
            }
          }

          return {
            ...record,
            voluntario_nome: voluntarioNome,
            escala_data: escalaData,
            escala_funcao: escalaFuncao,
            ministerio_nome: ministerioNome,
          };
        })
      );

      setRecords(enrichedRecords);
    } catch (error) {
      console.error('Error fetching communication records:', error);
      toast.error('Erro ao carregar histórico de comunicações');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sucesso
          </Badge>
        );
      case 'sem_telefone':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Phone className="w-3 h-3 mr-1" />
            Sem telefone
          </Badge>
        );
      case 'erro_api':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Erro API
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            <MessageCircle className="w-3 h-3 mr-1" />
            WhatsApp Manual
          </Badge>
        );
      case 'whatsapp_auto':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <MessageCircle className="w-3 h-3 mr-1" />
            WhatsApp Auto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {tipo}
          </Badge>
        );
    }
  };

  const getSummary = () => {
    const total = records.length;
    const sucesso = records.filter(r => r.status === 'sucesso').length;
    const semTelefone = records.filter(r => r.status === 'sem_telefone').length;
    const erroApi = records.filter(r => r.status === 'erro_api').length;
    
    return { total, sucesso, semTelefone, erroApi };
  };

  const summary = getSummary();

  return (
    <div className="container-padding space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Comunicações</h1>
          <p className="text-muted-foreground">Histórico de mensagens enviadas pelo sistema</p>
        </div>
        <Button onClick={fetchRecords} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-sm text-muted-foreground">Total de Envios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{summary.sucesso}</div>
            <p className="text-sm text-muted-foreground">Sucesso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{summary.semTelefone}</div>
            <p className="text-sm text-muted-foreground">Sem Telefone</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{summary.erroApi}</div>
            <p className="text-sm text-muted-foreground">Erros de API</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="sem_telefone">Sem telefone</SelectItem>
                  <SelectItem value="erro_api">Erro de API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comunicações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de comunicação encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voluntário</TableHead>
                    <TableHead>Escala</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="max-w-[200px]">Mensagem/Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.voluntario_nome}
                      </TableCell>
                      <TableCell>
                        {record.escala_data ? (
                          <div className="text-sm">
                            <div>{format(parseLocalDate(record.escala_data), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            <div className="text-muted-foreground">{record.escala_funcao}</div>
                            <div className="text-muted-foreground text-xs">{record.ministerio_nome}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(record.tipo)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm truncate" title={record.mensagem_preview || record.detalhes_erro || ''}>
                          {record.status === 'erro_api' || record.status === 'sem_telefone' ? (
                            <span className="text-red-600">{record.detalhes_erro || 'Erro desconhecido'}</span>
                          ) : (
                            <span className="text-muted-foreground">{record.mensagem_preview || '-'}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
