import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Eye, Search, X, Plus, Download, MessageCircle,
  UserCheck, Calendar, ChevronRight, BarChart3, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { highlightText, formatPhoneBR } from '@/lib/formatters';

interface Base {
  id: string;
  nome: string;
}

interface BaseMembro {
  base_id: string;
  bases: Base | null;
}

/**
 * ATENÇÃO: O campo 'nome' nesta interface NÃO é fonte de verdade quando user_id existe.
 * 
 * Para membros vinculados a um perfil (user_id != null):
 * - Dados pessoais vêm da tabela 'profiles' (fonte primária)
 * - O 'nome' aqui é apenas fallback para membros sem conta
 * 
 * Na listagem atual, usamos membro.nome direto por performance,
 * mas na página de detalhes fazemos a busca combinada correta.
 * 
 * @see src/pages/admin/MembroDetalhes.tsx para lógica completa de exibição
 */
interface Membro {
  id: string;
  // Fallback - quando user_id existe, exibir nome de profiles
  nome: string;
  telefone: string | null;
  foto_perfil: string | null;
  status: string | null;
  estado_civil: string | null;
  data_batismo: string | null;
  data_nascimento: string | null;
  created_at: string | null;
  // Quando não-nulo, profiles é a fonte primária de dados pessoais
  user_id: string | null;
  bases_membros?: BaseMembro[];
}

// Status labels and colors - same pattern as Visitantes/Acompanhamento
const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  desligado: 'Desligado',
  transferido: 'Transferido',
  em_acompanhamento: 'Em Acompanhamento',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 border-green-300',
  inativo: 'bg-gray-100 text-gray-800 border-gray-300',
  desligado: 'bg-red-100 text-red-800 border-red-300',
  transferido: 'bg-orange-100 text-orange-800 border-orange-300',
  em_acompanhamento: 'bg-blue-100 text-blue-800 border-blue-300',
};

const estadoCivilLabels: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
};

// Helper functions - same pattern as other modules
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Sanitize search input to prevent SQL pattern injection
const sanitizeSearch = (input: string): string => {
  // Escape special characters that could affect pattern matching
  return input.replace(/[%_\\]/g, '\\$&').trim();
};

const hasValidPhone = (phone: string | null): boolean => {
  const cleaned = cleanPhone(phone);
  return cleaned.length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  const msg = encodeURIComponent(`Olá! Sou da ${churchNome || 'nossa Igreja'}. Estou entrando em contato :)`);
  return `https://wa.me/55${cleaned}?text=${msg}`;
};

const formatDateTime = (date: string | null) => {
  if (!date) return '–';
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// CSV Export function
const exportToCSV = (data: Membro[]) => {
  const headers = ['ID', 'Nome', 'Telefone', 'Status', 'Base Atual', 'Data Nascimento', 'Idade', 'Batizado', 'Data Cadastro'];
  
  const rows = data.map(m => {
    const baseAtual = m.bases_membros?.find(bm => bm.bases)?.bases?.nome || '';
    const age = calculateAge(m.data_nascimento);
    return [
      m.id,
      `"${m.nome.replace(/"/g, '""')}"`,
      m.telefone || '',
      statusLabels[m.status || 'ativo'] || m.status || '',
      `"${baseAtual.replace(/"/g, '""')}"`,
      m.data_nascimento || '',
      age !== null ? String(age) : '',
      m.data_batismo ? 'Sim' : 'Não',
      m.created_at ? format(new Date(m.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `membros_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Membros() {
  const { churchId: authChurchId } = useAuth();
  const { church, p, churchNome } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const [membros, setMembros] = useState<Membro[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroBase, setFiltroBase] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, ativos: 0, batizados: 0 });
  const limit = 12;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filtroStatus, filtroBase, debouncedSearch]);

  useEffect(() => {
    fetchBases();
    fetchStats();
  }, [churchId]);

  useEffect(() => {
    fetchMembros();
  }, [filtroStatus, filtroBase, debouncedSearch, page, churchId]);

  const fetchBases = async () => {
    if (!churchId) return;
    const { data } = await supabase
      .from('bases')
      .select('id, nome')
      .eq('church_id', churchId)
      .eq('status', 'ativo')
      .order('nome');
    setBases(data || []);
  };

  const fetchStats = async () => {
    if (!churchId) return;
    const { count: totalCount } = await supabase
      .from('membros')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId);

    const { count: ativosCount } = await supabase
      .from('membros')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .eq('status', 'ativo');

    const { count: batizadosCount } = await supabase
      .from('membros')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .not('data_batismo', 'is', null);

    setStats({
      total: totalCount || 0,
      ativos: ativosCount || 0,
      batizados: batizadosCount || 0,
    });
  };

  const fetchMembros = async () => {
    if (!churchId) return;
    try {
      setLoading(true);

      // Build base filter if needed
      let memberIdsInBase: string[] | null = null;
      if (filtroBase !== 'todos') {
        const { data: baseMembers } = await supabase
          .from('bases_membros')
          .select('membro_id')
          .eq('base_id', filtroBase)
          .eq('status', 'ativo')
          .not('membro_id', 'is', null);
        
        memberIdsInBase = baseMembers?.map(bm => bm.membro_id).filter(Boolean) as string[] || [];
      }

      // Count query
      let countQuery = supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId);

      if (filtroStatus !== 'todos') {
        countQuery = countQuery.eq('status', filtroStatus);
      }
      if (debouncedSearch.trim()) {
        const sanitizedSearch = sanitizeSearch(debouncedSearch);
        const cleanedSearch = cleanPhone(debouncedSearch);
        if (cleanedSearch.length >= 3) {
          countQuery = countQuery.or(`nome.ilike.%${sanitizedSearch}%,telefone.ilike.%${cleanedSearch}%`);
        } else {
          countQuery = countQuery.ilike('nome', `%${sanitizedSearch}%`);
        }
      }
      if (memberIdsInBase !== null) {
        if (memberIdsInBase.length === 0) {
          setMembros([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        countQuery = countQuery.in('id', memberIdsInBase);
      }

      const { count } = await countQuery;
      setTotal(count || 0);

      // Data query
      let query = supabase
        .from('membros')
        .select(`
          id, nome, telefone, foto_perfil, status, estado_civil, data_batismo, data_nascimento, created_at, user_id,
          bases_membros!left(base_id, bases(id, nome))
        `)
        .eq('church_id', churchId)
        .order('nome', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }
      if (debouncedSearch.trim()) {
        const sanitizedSearch = sanitizeSearch(debouncedSearch);
        const cleanedSearch = cleanPhone(debouncedSearch);
        if (cleanedSearch.length >= 3) {
          query = query.or(`nome.ilike.%${sanitizedSearch}%,telefone.ilike.%${cleanedSearch}%`);
        } else {
          query = query.ilike('nome', `%${sanitizedSearch}%`);
        }
      }
      if (memberIdsInBase !== null) {
        query = query.in('id', memberIdsInBase);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process bases_membros to get active base
      const processedData = (data || []).map(m => ({
        ...m,
        bases_membros: (m.bases_membros as unknown as BaseMembro[])?.filter(bm => bm.bases) || []
      }));

      setMembros(processedData);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFiltroStatus('todos');
    setFiltroBase('todos');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = filtroStatus !== 'todos' || filtroBase !== 'todos' || searchTerm.trim() !== '';

  const handleExportCSV = () => {
    if (membros.length === 0) {
      toast.error('Nenhum membro para exportar');
      return;
    }
    exportToCSV(membros);
    toast.success('CSV exportado com sucesso!');
  };

  const handleWhatsAppClick = (e: React.MouseEvent, telefone: string | null) => {
    e.stopPropagation();
    if (hasValidPhone(telefone)) {
      window.open(getWhatsAppUrl(telefone), '_blank');
    }
  };

  const getBaseAtual = (membro: Membro): string | null => {
    const activeBase = membro.bases_membros?.find(bm => bm.bases);
    return activeBase?.bases?.nome || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Membros</h1>
          <p className="text-muted-foreground">Gerencie os membros da igreja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(p('/admin/membros/relatorio'))}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatório
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => navigate(p('/admin/membros/novo'))}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Membro
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ativos}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.batizados}</p>
                <p className="text-sm text-muted-foreground">Batizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="desligado">Desligados</SelectItem>
                  <SelectItem value="transferido">Transferidos</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Base</label>
              <Select value={filtroBase} onValueChange={setFiltroBase}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as bases</SelectItem>
                  {bases.map(base => (
                    <SelectItem key={base.id} value={base.id}>{base.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
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

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pagination Top */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mb-4 border-b">
              <div className="text-sm text-muted-foreground">
                Mostrando{" "}
                <strong>{total === 0 ? 0 : (page - 1) * limit + 1}</strong> –{" "}
                <strong>{Math.min(page * limit, total)}</strong> de{" "}
                <strong>{total}</strong> membros
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : membros.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum membro encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {membros.map((membro) => {
                const baseAtual = getBaseAtual(membro);
                const phoneFormatted = membro.telefone ? formatPhoneBR(membro.telefone) : null;
                return (
                  <div
                    key={membro.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Name and Phone */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p 
                          className="font-medium truncate"
                          dangerouslySetInnerHTML={{ __html: highlightText(membro.nome, debouncedSearch) }}
                        />
                        {membro.user_id && (
                          <span 
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary flex-shrink-0" 
                            title="Possui acesso ao sistema"
                          >
                            <UserCheck className="w-3 h-3" />
                          </span>
                        )}
                        {(!membro.telefone || !membro.data_nascimento) && (
                          <span
                            className="text-yellow-500 flex-shrink-0"
                            title={[
                              !membro.telefone ? 'sem telefone' : '',
                              !membro.data_nascimento ? 'sem data de nascimento' : '',
                            ].filter(Boolean).join(', ')}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                        {hasValidPhone(membro.telefone) && (
                          <button
                            onClick={(e) => handleWhatsAppClick(e, membro.telefone)}
                            className="text-green-600 hover:text-green-700 flex-shrink-0"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p 
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ 
                          __html: phoneFormatted 
                            ? highlightText(phoneFormatted, debouncedSearch) 
                            : 'Sem telefone' 
                        }}
                      />
                    </div>

                    {/* Estado Civil */}
                    <div className="text-sm text-muted-foreground min-w-[100px] hidden lg:block">
                      <span dangerouslySetInnerHTML={{ 
                        __html: membro.estado_civil 
                          ? highlightText(estadoCivilLabels[membro.estado_civil] || membro.estado_civil, debouncedSearch) 
                          : '–' 
                      }} />
                    </div>

                    {/* Data Batismo */}
                    <div className="text-sm text-muted-foreground min-w-[90px] hidden md:block">
                      {membro.data_batismo ? formatDateTime(membro.data_batismo) : '–'}
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={statusColors[membro.status || 'ativo']}
                    >
                      {statusLabels[membro.status || 'ativo']}
                    </Badge>

                    {/* Base */}
                    <div className="text-sm text-muted-foreground min-w-[120px] hidden xl:block">
                      {baseAtual ? (
                        <span className="font-medium text-primary">{baseAtual}</span>
                      ) : (
                        <span className="italic">Sem base</span>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(p(`/admin/membros/${membro.id}`))}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando{" "}
                <strong>{total === 0 ? 0 : (page - 1) * limit + 1}</strong> –{" "}
                <strong>{Math.min(page * limit, total)}</strong> de{" "}
                <strong>{total}</strong> membros
              </div>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
