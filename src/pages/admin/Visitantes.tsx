import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Users, Eye, Calendar as CalendarIcon, Download, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_visita: string | null;
  culto: string | null;
  observacoes: string | null;
  status: string | null;
  melhor_horario: string | null;
  created_at: string | null;
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contatado: 'bg-green-100 text-green-800 border-green-300',
};

export default function Visitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [dataInicial, setDataInicial] = useState<Date | undefined>(undefined);
  const [dataFinal, setDataFinal] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Debounce search term
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filtroStatus, dataInicial, dataFinal, debouncedSearch]);

  useEffect(() => {
    fetchVisitantes();
  }, [filtroStatus, dataInicial, dataFinal, debouncedSearch, page]);

  // Highlight function for search results
  const highlight = (text: string) => {
    if (!debouncedSearch.trim()) return text;
    const regex = new RegExp(`(${debouncedSearch})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const fetchVisitantes = async () => {
    try {
      setLoading(true);

      // First: get total count for pagination
      let countQuery = supabase
        .from('visitantes')
        .select('*', { count: 'exact', head: true });

      if (filtroStatus !== 'todos') {
        countQuery = countQuery.eq('status', filtroStatus);
      }
      if (debouncedSearch.trim() !== '') {
        countQuery = countQuery.ilike('nome', `%${debouncedSearch.trim()}%`);
      }
      if (dataInicial) {
        countQuery = countQuery.gte('created_at', `${format(dataInicial, 'yyyy-MM-dd')}T00:00:00`);
      }
      if (dataFinal) {
        countQuery = countQuery.lte('created_at', `${format(dataFinal, 'yyyy-MM-dd')}T23:59:59`);
      }

      const { count } = await countQuery;
      setTotal(count || 0);

      // Second: get paginated data
      let query = supabase
        .from('visitantes')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }
      if (debouncedSearch.trim() !== '') {
        query = query.ilike('nome', `%${debouncedSearch.trim()}%`);
      }
      if (dataInicial) {
        query = query.gte('created_at', `${format(dataInicial, 'yyyy-MM-dd')}T00:00:00`);
      }
      if (dataFinal) {
        query = query.lte('created_at', `${format(dataFinal, 'yyyy-MM-dd')}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisitantes(data || []);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
      toast.error('Erro ao carregar visitantes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  const clearFilters = () => {
    setFiltroStatus('todos');
    setDataInicial(undefined);
    setDataFinal(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const hasActiveFilters = filtroStatus !== 'todos' || dataInicial || dataFinal || searchTerm.trim() !== '';

  const exportToCSV = () => {
    if (visitantes.length === 0) {
      toast.error('Nenhum visitante para exportar');
      return;
    }

    setExporting(true);

    try {
      // UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      
      const headers = ['ID', 'Nome', 'Telefone', 'Melhor Horário', 'Observações', 'Status', 'Data Cadastro'];
      
      const rows = visitantes.map(v => [
        v.id,
        v.nome,
        v.telefone || '',
        v.melhor_horario || '',
        (v.observacoes || '').replace(/"/g, '""'),
        statusLabels[v.status || 'novo'] || v.status || '',
        v.created_at ? format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
      ]);

      const csvContent = BOM + [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visitantes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${visitantes.length} visitantes exportados com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Visitantes</h1>
          <p className="text-muted-foreground">Gerencie os visitantes da igreja</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitantes.filter((v) => v.status === 'novo').length}
                </p>
                <p className="text-sm text-muted-foreground">Novos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitantes.filter((v) => v.status === 'contatado').length}
                </p>
                <p className="text-sm text-muted-foreground">Contatados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[200px] pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" id="data-inicial-label">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dataInicial && "text-muted-foreground"
                    )}
                    aria-labelledby="data-inicial-label"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicial ? format(dataInicial, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicial}
                    onSelect={setDataInicial}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" id="data-final-label">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dataFinal && "text-muted-foreground"
                    )}
                    aria-labelledby="data-final-label"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFinal ? format(dataFinal, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataFinal}
                    onSelect={setDataFinal}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="novo">Novos</SelectItem>
                  <SelectItem value="contatado">Contatados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}

            <div className="ml-auto">
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={exporting || visitantes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <Badge variant="secondary">
                {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Lista de Visitantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : visitantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum visitante encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Melhor Horário</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitantes.map((visitante) => (
                  <TableRow key={visitante.id}>
                    <TableCell 
                      className="font-medium"
                      dangerouslySetInnerHTML={{ __html: highlight(visitante.nome) }}
                    />
                    <TableCell>{visitante.telefone || '-'}</TableCell>
                    <TableCell>{visitante.melhor_horario || '-'}</TableCell>
                    <TableCell>{formatDate(visitante.created_at)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusColors[visitante.status || 'novo']}
                      >
                        {statusLabels[visitante.status || 'novo']}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/visitantes/${visitante.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total} registros)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
