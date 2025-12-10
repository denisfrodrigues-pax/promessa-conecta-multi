import { Outlet, Navigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Users, ClipboardList, BarChart3, Home, LogOut, Church, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderNotifications } from '@/hooks/useLeaderNotifications';

const navItems = [
  { icon: LayoutDashboard, label: 'Visão Geral', path: '/lider' },
  { icon: Users, label: 'Minha Equipe', path: '/lider/equipe' },
  { icon: ClipboardList, label: 'Funções', path: '/lider/funcoes' },
  { icon: Users, label: 'Minhas Bases', path: '/lider/bases' },
  { icon: ClipboardList, label: 'Minhas Escalas', path: '/lider/escalas' },
  { icon: Bell, label: 'Notificações', path: '/lider/notificacoes', showBadge: true },
  { icon: BarChart3, label: 'Relatórios', path: '/lider/relatorios' },
];

export default function LeaderLayout() {
  const { user, loading, profile, signOut, isLider } = useAuth();
  const { unreadCount } = useLeaderNotifications();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isLider) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary shadow-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-church-gold flex items-center justify-center">
                <Church className="w-5 h-5 text-primary-foreground" />
              </div>
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-primary-foreground">Painel do Líder</h1>
              <p className="text-xs text-primary-foreground/70">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <RouterNavLink to="/">
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sub Nav */}
        <div className="container mx-auto px-4 pb-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/lider'}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors whitespace-nowrap"
                activeClassName="bg-primary-foreground/20 text-primary-foreground font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {item.showBadge && unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-church-gold text-primary">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
