import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye, Download, Search, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

// Helper: Clean phone number (remove non-numeric chars)
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Helper: Check if phone is valid
const hasValidPhone = (phone: string | null): boolean => {
  const cleaned = cleanPhone(phone);
  return cleaned.length >= 10;
};

// Helper: Generate WhatsApp URL
const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  const message = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/55${cleaned}?text=${message}`;
};

// Helper: Export to CSV
const exportToCSV = (data: Visitante[]) => {
  const headers = ['nome', 'telefone', 'status', 'data_criacao', 'ultima_atualizacao'];
  
  const rows = data.map((v) => [
    v.nome || '',
    v.telefone || '',
    statusLabels[v.status || 'novo'] || v.status || '',
    v.created_at ? format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
    v.created_at ? format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
  ]);

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `visitantes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Visitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
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
  }, [filtroStatus, debouncedSearch]);

  useEffect(() => {
    fetchVisitantes();
  }, [filtroStatus, debouncedSearch, page]);

  const fetchVisitantes = async () => {
    try {
      setLoading(true);

      // Build search filter for name OR phone
      const searchClean = debouncedSearch.trim();
      const searchNumeric = cleanPhone(searchClean);

      // First: get total count for pagination
      let countQuery = supabase
        .from('visitantes')
        .select('*', { count: 'exact', head: true });

      if (filtroStatus !== 'todos') {
        countQuery = countQuery.eq('status', filtroStatus);
      }
      
      if (searchClean !== '') {
        // Search by name OR phone (cleaned)
        countQuery = countQuery.or(`nome.ilike.%${searchClean}%,telefone.ilike.%${searchNumeric}%,telefone.ilike.%${searchClean}%`);
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
      
      if (searchClean !== '') {
        query = query.or(`nome.ilike.%${searchClean}%,telefone.ilike.%${searchNumeric}%,telefone.ilike.%${searchClean}%`);
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

  const totalPages = Math.ceil(total / limit);

  const handleExportCSV = () => {
    if (visitantes.length === 0) {
      toast.error('Nenhum visitante para exportar');
      return;
    }
    exportToCSV(visitantes);
    toast.success('CSV exportado com sucesso!');
  };

  const handleWhatsAppClick = (phone: string | null) => {
    if (!hasValidPhone(phone)) return;
    window.open(getWhatsAppUrl(phone), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Visitantes
          </h1>
          <p className="text-muted-foreground">Gerencie os visitantes da igreja</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={loading || visitantes.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros inline */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="contato_iniciado">Contato Iniciado</SelectItem>
            <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visitantes ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : visitantes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum visitante encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {visitantes.map((visitante) => (
                <div
                  key={visitante.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{visitante.nome}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={!hasValidPhone(visitante.telefone)}
                          onClick={() => handleWhatsAppClick(visitante.telefone)}
                          title={hasValidPhone(visitante.telefone) ? 'Enviar WhatsApp' : 'Telefone não disponível'}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className={statusColors[visitante.status || 'novo']}>
                          {statusLabels[visitante.status || 'novo']}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{visitante.telefone || 'Sem telefone'}</span>
                        <span>Cadastro: {formatDate(visitante.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/visitantes/${visitante.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {total > limit && (
            <div className="flex items-center justify-between py-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando <strong>{(page - 1) * limit + 1}</strong> – <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
