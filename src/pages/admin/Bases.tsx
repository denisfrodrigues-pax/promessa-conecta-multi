import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Network, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  status: string;
  data_criacao: string;
  lider_nome?: string;
  membros_count?: number;
}

export default function Bases() {
  const navigate = useNavigate();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchBases();
  }, [debouncedSearch, filtroStatus]);

  const fetchBases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bases')
        .select(`
          id,
          nome,
          descricao,
          lider_id,
          status,
          data_criacao
        `)
        .order('nome');

      if (debouncedSearch) {
        query = query.ilike('nome', `%${debouncedSearch}%`);
      }

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch leader names and member counts
      const basesWithDetails = await Promise.all(
        (data || []).map(async (base) => {
          let lider_nome = null;
          if (base.lider_id) {
            const { data: lider } = await supabase
              .from('membros')
              .select('nome')
              .eq('id', base.lider_id)
              .maybeSingle();
            lider_nome = lider?.nome;
          }

          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');

          return {
            ...base,
            lider_nome,
            membros_count: count || 0,
          };
        })
      );

      setBases(basesWithDetails);
    } catch (error: any) {
      toast.error('Erro ao carregar bases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const highlight = (text: string) => {
    if (!debouncedSearch || !text) return text;
    const regex = new RegExp(`(${debouncedSearch})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-100 text-green-800',
    inativo: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Bases
          </CardTitle>
          <Button onClick={() => navigate('/admin/bases/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Base
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : bases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma base encontrada</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {bases.map((base) => (
                <Card key={base.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-foreground truncate"
                          dangerouslySetInnerHTML={{ __html: highlight(base.nome) }}
                        />
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {base.membros_count} membro{base.membros_count !== 1 ? 's' : ''}
                          </span>
                          {base.lider_nome && (
                            <span>Líder: {base.lider_nome}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[base.status] || ''}>
                          {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/bases/${base.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
