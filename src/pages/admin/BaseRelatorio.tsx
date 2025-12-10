import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Network, Users, CheckCircle, UserX, UserCheck, UserMinus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BaseResumo {
  id: string;
  nome: string;
  status: string;
  lider_nome: string | null;
  membros_count: number;
  visitantes_count: number;
  capacidade: number;
}

// ===== CSV EXPORT =====
const exportToCSV = (bases: BaseResumo[], stats: any) => {
  const headers = ['base', 'lider', 'membros', 'visitantes', 'capacidade', 'status'];
  const rows = bases.map((b) => [
    b.nome,
    b.lider_nome || '',
    b.membros_count.toString(),
    b.visitantes_count.toString(),
    b.capacidade.toString(),
    b.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_bases_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

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
      const { data: basesData } = await supabase
        .from('bases')
        .select('id, nome, status, lider_id, capacidade')
        .order('nome');

      const { data: basesMembrosData } = await supabase
        .from('bases_membros')
        .select('base_id, membro_id, visitante_id')
        .eq('status', 'ativo');

      const { data: basesVisitantesData } = await supabase
        .from('bases_membros')
        .select('base_id, visitante_id')
        .not('visitante_id', 'is', null)
        .neq('status', 'desligado');

      const { count: totalMembros } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      const { count: totalVisitantes } = await supabase
        .from('visitantes')
        .select('*', { count: 'exact', head: true });

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
            capacidade: base.capacidade || 20,
          };
        })
      );

      const membrosEmBases = new Set(
        (basesMembrosData || []).filter((bm) => bm.membro_id).map((bm) => bm.membro_id)
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

  const handleExportCSV = () => {
    if (bases.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    exportToCSV(bases, stats);
    toast.success('CSV exportado!');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold">Relatório de Bases</h1>
            <p className="text-sm text-muted-foreground">Visão geral das bases e participantes</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

      {/* Bases List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo por Base</CardTitle>
        </CardHeader>
        <CardContent>
          {bases.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma base cadastrada</p>
          ) : (
            <div className="space-y-3">
              {bases.map((base) => {
                const totalPessoas = base.membros_count + base.visitantes_count;
                const ocupacao = Math.min(100, (totalPessoas / base.capacidade) * 100);
                const isLotada = totalPessoas >= base.capacidade;

                return (
                  <div key={base.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{base.nome}</span>
                        <Badge
                          variant="outline"
                          className={base.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {isLotada && <Badge variant="destructive">Lotada</Badge>}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {base.lider_nome || 'Sem líder'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{base.membros_count} membros</span>
                      <span>{base.visitantes_count} visitantes</span>
                      <span>{totalPessoas}/{base.capacidade} total</span>
                    </div>

                    <Progress value={ocupacao} className={`h-2 ${isLotada ? '[&>div]:bg-destructive' : ''}`} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
