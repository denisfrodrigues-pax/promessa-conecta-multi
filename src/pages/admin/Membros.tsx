import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Eye, Search, X, Plus, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  foto_perfil: string | null;
  status: string | null;
  data_batismo: string | null;
  created_at: string | null;
}

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 border-green-300',
  inativo: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function Membros() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroBatizado, setFiltroBatizado] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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
  }, [filtroStatus, filtroBatizado, debouncedSearch]);

  useEffect(() => {
    fetchMembros();
  }, [filtroStatus, filtroBatizado, debouncedSearch, page]);

  const highlight = (text: string) => {
    if (!debouncedSearch.trim()) return text;
    const regex = new RegExp(`(${debouncedSearch})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const fetchMembros = async () => {
    try {
      setLoading(true);

      // Count query
      let countQuery = supabase
        .from('membros')
        .select('*', { count: 'exact', head: true });

      if (filtroStatus !== 'todos') {
        countQuery = countQuery.eq('status', filtroStatus);
      }
      if (filtroBatizado === 'sim') {
        countQuery = countQuery.not('data_batismo', 'is', null);
      } else if (filtroBatizado === 'nao') {
        countQuery = countQuery.is('data_batismo', null);
      }
      if (debouncedSearch.trim()) {
        countQuery = countQuery.ilike('nome', `%${debouncedSearch.trim()}%`);
      }

      const { count } = await countQuery;
      setTotal(count || 0);

      // Data query
      let query = supabase
        .from('membros')
        .select('id, nome, telefone, foto_perfil, status, data_batismo, created_at')
        .order('nome', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }
      if (filtroBatizado === 'sim') {
        query = query.not('data_batismo', 'is', null);
      } else if (filtroBatizado === 'nao') {
        query = query.is('data_batismo', null);
      }
      if (debouncedSearch.trim()) {
        query = query.ilike('nome', `%${debouncedSearch.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMembros(data || []);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFiltroStatus('todos');
    setFiltroBatizado('todos');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = filtroStatus !== 'todos' || filtroBatizado !== 'todos' || searchTerm.trim() !== '';

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Membros</h1>
          <p className="text-muted-foreground">Gerencie os membros da igreja</p>
        </div>
        <Button onClick={() => navigate('/admin/membros/novo')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Membro
        </Button>
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
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {membros.filter(m => m.status === 'ativo').length}
                </p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {membros.filter(m => m.data_batismo).length}
                </p>
                <p className="text-sm text-muted-foreground">Batizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4" />
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
                  className="w-[220px] pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Batizado</label>
              <Select value={filtroBatizado} onValueChange={setFiltroBatizado}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Batizado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
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

      {/* Members Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : membros.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro encontrado
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {membros.map((membro) => (
                <Card key={membro.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={membro.foto_perfil || undefined} alt={membro.nome} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(membro.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium truncate"
                          dangerouslySetInnerHTML={{ __html: highlight(membro.nome) }}
                        />
                        <p className="text-sm text-muted-foreground truncate">
                          {membro.telefone || 'Sem telefone'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={statusColors[membro.status || 'ativo']}>
                            {statusLabels[membro.status || 'ativo']}
                          </Badge>
                          {membro.data_batismo && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Batizado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => navigate(`/admin/membros/${membro.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between py-3 mt-4 pt-4 border-t">
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
