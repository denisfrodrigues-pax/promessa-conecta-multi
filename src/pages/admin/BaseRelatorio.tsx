import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Network, Users, CheckCircle, UserX, UserCheck, UserMinus } from 'lucide-react';

interface BaseResumo {
  id: string;
  nome: string;
  status: string;
  lider_nome: string | null;
  membros_count: number;
  visitantes_count: number;
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
    visitantesEmBases: 0,
    visitantesSemBase: 0,
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

      // Fetch all active base_membros relations (members)
      const { data: basesMembrosData } = await supabase
        .from('bases_membros')
        .select('base_id, membro_id, visitante_id')
        .eq('status', 'ativo');

      // Fetch all base_visitantes relations (not desligado)
      const { data: basesVisitantesData } = await supabase
        .from('bases_membros')
        .select('base_id, visitante_id')
        .not('visitante_id', 'is', null)
        .neq('status', 'desligado');

      // Fetch total active members
      const { count: totalMembros } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Fetch total visitors
      const { count: totalVisitantes } = await supabase
        .from('visitantes')
        .select('*', { count: 'exact', head: true });

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
            (bm) => bm.base_id === base.id && bm.membro_id
          ).length;

          const visitantes_count = (basesVisitantesData || []).filter(
            (bv) => bv.base_id === base.id
          ).length;

          return {
            id: base.id,
            nome: base.nome,
            status: base.status,
            lider_nome,
            membros_count,
            visitantes_count,
          };
        })
      );

      // Calculate stats
      const membrosEmBases = new Set(
        (basesMembrosData || []).filter(bm => bm.membro_id).map((bm) => bm.membro_id)
      ).size;

      const visitantesEmBases = new Set(
        (basesVisitantesData || []).map((bv) => bv.visitante_id)
      ).size;

      setStats({
        totalBases: basesData?.length || 0,
        basesAtivas: basesData?.filter((b) => b.status === 'ativo').length || 0,
        membrosEmBases,
        membrosSemBase: (totalMembros || 0) - membrosEmBases,
        visitantesEmBases,
        visitantesSemBase: (totalVisitantes || 0) - visitantesEmBases,
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Network className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBases}</p>
                <p className="text-xs text-muted-foreground">Total Bases</p>
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
                <p className="text-xs text-muted-foreground">Bases Ativas</p>
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
                <p className="text-xs text-muted-foreground">Membros em Bases</p>
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
                <p className="text-xs text-muted-foreground">Membros s/ Base</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <UserCheck className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.visitantesEmBases}</p>
                <p className="text-xs text-muted-foreground">Visitantes em Acomp.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100">
                <UserMinus className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.visitantesSemBase}</p>
                <p className="text-xs text-muted-foreground">Visitantes s/ Base</p>
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
                  <TableHead className="text-center">Visitantes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bases.map((base) => (
                  <TableRow key={base.id}>
                    <TableCell className="font-medium">{base.nome}</TableCell>
                    <TableCell>{base.lider_nome || '-'}</TableCell>
                    <TableCell className="text-center">{base.membros_count}</TableCell>
                    <TableCell className="text-center">{base.visitantes_count}</TableCell>
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
