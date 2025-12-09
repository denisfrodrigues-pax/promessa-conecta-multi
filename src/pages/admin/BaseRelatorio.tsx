import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Network, Users, CheckCircle, UserX } from 'lucide-react';

interface BaseResumo {
  id: string;
  nome: string;
  status: string;
  lider_nome: string | null;
  membros_count: number;
}

export default function BaseRelatorio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState<BaseResumo[]>([]);
  const [stats, setStats] = useState({
    totalBases: 0,
    basesAtivas: 0,
    membrosEmBases: 0,
    membrosSemBase: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all bases
      const { data: basesData } = await supabase
        .from('bases')
        .select('id, nome, status, lider_id')
        .order('nome');

      // Fetch all active base_membros relations
      const { data: basesMembrosData } = await supabase
        .from('bases_membros')
        .select('base_id, membro_id')
        .eq('status', 'ativo');

      // Fetch total active members
      const { count: totalMembros } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Build base summaries
      const basesWithDetails: BaseResumo[] = await Promise.all(
        (basesData || []).map(async (base) => {
          let lider_nome = null;
          if (base.lider_id) {
            const { data: lider } = await supabase
              .from('membros')
              .select('nome')
              .eq('id', base.lider_id)
              .maybeSingle();
            lider_nome = lider?.nome || null;
          }

          const membros_count = (basesMembrosData || []).filter(
            (bm) => bm.base_id === base.id
          ).length;

          return {
            id: base.id,
            nome: base.nome,
            status: base.status,
            lider_nome,
            membros_count,
          };
        })
      );

      // Calculate stats
      const membrosEmBases = new Set(
        (basesMembrosData || []).map((bm) => bm.membro_id)
      ).size;

      setStats({
        totalBases: basesData?.length || 0,
        basesAtivas: basesData?.filter((b) => b.status === 'ativo').length || 0,
        membrosEmBases,
        membrosSemBase: (totalMembros || 0) - membrosEmBases,
      });

      setBases(basesWithDetails);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Bases &gt; Relatório</p>
          <h1 className="text-2xl font-bold">Relatório de Bases</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Network className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBases}</p>
                <p className="text-sm text-muted-foreground">Total de Bases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.basesAtivas}</p>
                <p className="text-sm text-muted-foreground">Bases Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.membrosEmBases}</p>
                <p className="text-sm text-muted-foreground">Em Bases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <UserX className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.membrosSemBase}</p>
                <p className="text-sm text-muted-foreground">Sem Base</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Resumo por Base</CardTitle>
        </CardHeader>
        <CardContent>
          {bases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma base cadastrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead className="text-center">Membros</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bases.map((base) => (
                  <TableRow key={base.id}>
                    <TableCell className="font-medium">{base.nome}</TableCell>
                    <TableCell>{base.lider_nome || '-'}</TableCell>
                    <TableCell className="text-center">{base.membros_count}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          base.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
