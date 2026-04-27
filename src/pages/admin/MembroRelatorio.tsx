import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Users, UserCheck, Calendar, Download, 
  TrendingUp, Baby, User, UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
  total: number;
  ativos: number;
  inativos: number;
  batizados: number;
  masculino: number;
  feminino: number;
  // Faixas etárias
  kids: number; // 0-12
  teens: number; // 13-17
  jovens: number; // 18-35
  adultos: number; // 36-59
  idosos: number; // 60+
  semIdade: number;
}

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

const exportReportCSV = (stats: Stats) => {
  const headers = ['Métrica', 'Valor'];
  const rows = [
    ['Total de Membros', String(stats.total)],
    ['Membros Ativos', String(stats.ativos)],
    ['Membros Inativos', String(stats.inativos)],
    ['Membros Batizados', String(stats.batizados)],
    ['Sexo Masculino', String(stats.masculino)],
    ['Sexo Feminino', String(stats.feminino)],
    ['Crianças (0-12)', String(stats.kids)],
    ['Adolescentes (13-17)', String(stats.teens)],
    ['Jovens (18-35)', String(stats.jovens)],
    ['Adultos (36-59)', String(stats.adultos)],
    ['Idosos (60+)', String(stats.idosos)],
    ['Sem idade informada', String(stats.semIdade)],
  ];

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_membros_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function MembroRelatorio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    ativos: 0,
    inativos: 0,
    batizados: 0,
    masculino: 0,
    feminino: 0,
    kids: 0,
    teens: 0,
    jovens: 0,
    adultos: 0,
    idosos: 0,
    semIdade: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const { data: membros, error } = await supabase
        .from('membros')
        .select('id, status, data_batismo, data_nascimento, user_id');

      if (error) throw error;

      const total = membros?.length || 0;
      const ativos = membros?.filter(m => m.status === 'ativo').length || 0;
      const inativos = membros?.filter(m => m.status === 'inativo' || m.status === 'desligado').length || 0;
      const batizados = membros?.filter(m => m.data_batismo).length || 0;

      // Buscar sexo de profiles para membros com conta vinculada
      const userIds = (membros || []).map(m => m.user_id).filter(Boolean) as string[];
      let masculino = 0;
      let feminino = 0;
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, sexo')
          .in('user_id', userIds);
        const sexoMap = new Map((profilesData || []).map(p => [p.user_id, p.sexo]));
        (membros || []).forEach(m => {
          const sexo = m.user_id ? sexoMap.get(m.user_id) : null;
          if (sexo === 'masculino' || sexo === 'M') masculino++;
          else if (sexo === 'feminino' || sexo === 'F') feminino++;
        });
      }

      let kids = 0, teens = 0, jovens = 0, adultos = 0, idosos = 0, semIdade = 0;
      membros?.forEach(m => {
        const age = calculateAge(m.data_nascimento);
        if (age === null) semIdade++;
        else if (age <= 12) kids++;
        else if (age <= 17) teens++;
        else if (age <= 35) jovens++;
        else if (age <= 59) adultos++;
        else idosos++;
      });

      setStats({
        total,
        ativos,
        inativos,
        batizados,
        masculino,
        feminino,
        kids,
        teens,
        jovens,
        adultos,
        idosos,
        semIdade,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportReportCSV(stats);
    toast.success('Relatório exportado!');
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary',
    subtitle 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    color?: string;
    subtitle?: string;
  }) => {
    const colorClasses: Record<string, string> = {
      primary: 'bg-primary/10 text-primary',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      pink: 'bg-pink-100 text-pink-600',
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/membros')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Relatório de Membros</h1>
            <p className="text-muted-foreground">Visão geral da membresia</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Membros" value={stats.total} icon={Users} />
        <StatCard title="Membros Ativos" value={stats.ativos} icon={UserCheck} color="green" />
        <StatCard title="Membros Inativos" value={stats.inativos} icon={User} color="orange" />
        <StatCard title="Batizados" value={stats.batizados} icon={Calendar} color="blue" />
      </div>

      {/* Age Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribuição por Faixa Etária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <Baby className="w-8 h-8 mx-auto text-pink-600 mb-2" />
              <p className="text-2xl font-bold text-pink-700">{stats.kids}</p>
              <p className="text-sm text-pink-600">Crianças</p>
              <p className="text-xs text-muted-foreground">0-12 anos</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserPlus className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-700">{stats.teens}</p>
              <p className="text-sm text-purple-600">Adolescentes</p>
              <p className="text-xs text-muted-foreground">13-17 anos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <User className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-700">{stats.jovens}</p>
              <p className="text-sm text-blue-600">Jovens</p>
              <p className="text-xs text-muted-foreground">18-35 anos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.adultos}</p>
              <p className="text-sm text-green-600">Adultos</p>
              <p className="text-xs text-muted-foreground">36-59 anos</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <User className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-orange-700">{stats.idosos}</p>
              <p className="text-sm text-orange-600">Idosos</p>
              <p className="text-xs text-muted-foreground">60+ anos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <User className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="text-2xl font-bold text-gray-700">{stats.semIdade}</p>
              <p className="text-sm text-gray-600">Não informado</p>
              <p className="text-xs text-muted-foreground">Sem data nasc.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Percentage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Proporções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Taxa de Membros Ativos</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.ativos / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Taxa de Batizados</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats.total > 0 ? (stats.batizados / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.total > 0 ? Math.round((stats.batizados / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Com data de nascimento</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${stats.total > 0 ? ((stats.total - stats.semIdade) / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.total > 0 ? Math.round(((stats.total - stats.semIdade) / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
