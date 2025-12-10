import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UsersRound, Calendar, Bell, TrendingUp, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalUsers: number;
  activeBases: number;
  upcomingEvents: number;
  recentAnnouncements: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeBases: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, basesRes, eventsRes, announcementsRes, recentUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bases').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('eventos').select('id', { count: 'exact', head: true }).gte('data_inicio', new Date().toISOString()),
        supabase.from('avisos').select('id', { count: 'exact', head: true }).eq('publico', true),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        activeBases: basesRes.count || 0,
        upcomingEvents: eventsRes.count || 0,
        recentAnnouncements: announcementsRes.count || 0,
      });

      setRecentUsers(recentUsersRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Membros',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-primary',
      description: 'Membros cadastrados',
      link: '/admin/usuarios',
    },
    {
      title: 'Bases Ativas',
      value: stats.activeBases,
      icon: UsersRound,
      color: 'bg-church-gold',
      description: 'Pequenas comunidades',
      link: '/admin/bases',
    },
    {
      title: 'Eventos Próximos',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'bg-emerald-600',
      description: 'Eventos agendados',
      link: '/admin/eventos',
    },
    {
      title: 'Avisos Publicados',
      value: stats.recentAnnouncements,
      icon: Bell,
      color: 'bg-violet-600',
      description: 'Comunicados ativos',
      link: '/admin/avisos',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Link to={stat.link}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{loading ? '-' : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.description}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Novos Membros</CardTitle>
              <CardDescription>Últimos cadastros no sistema</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/usuarios">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.nome?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro cadastrado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funções principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/usuarios">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Usuários
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/bases">
                <UsersRound className="w-4 h-4 mr-2" />
                Gerenciar Bases
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/eventos">
                <Calendar className="w-4 h-4 mr-2" />
                Criar Evento
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/avisos">
                <Bell className="w-4 h-4 mr-2" />
                Publicar Aviso
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
