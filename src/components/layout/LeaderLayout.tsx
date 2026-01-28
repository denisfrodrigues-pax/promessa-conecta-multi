import { Outlet, Navigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/Logo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { LayoutDashboard, Users, ClipboardList, BarChart3, Home, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLeaderNotifications } from '@/hooks/useLeaderNotifications';

const navItems = [
  { icon: LayoutDashboard, label: 'Visão Geral', path: '/leader' },
  { icon: Users, label: 'Minha Equipe', path: '/leader/equipe' },
  { icon: ClipboardList, label: 'Funções', path: '/leader/funcoes' },
  { icon: ClipboardList, label: 'Minhas Escalas', path: '/leader/escalas' },
  { icon: Users, label: 'Minhas Bases', path: '/leader/bases' },
  { icon: Bell, label: 'Notificações', path: '/leader/notificacoes', showBadge: true },
  { icon: BarChart3, label: 'Relatórios', path: '/leader/relatorios' },
];

export default function LeaderLayout() {
  const { user, loading, profile, isLider } = useAuth();
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

  // Leader panel accessible by 'lider' and 'admin' roles
  // isLider already includes both roles
  if (!isLider) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Premium White */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to="/app" className="flex items-center gap-3">
              <Logo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-promessa-700">Painel do Líder</h1>
              <p className="text-xs text-neutral-500">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to="/app">
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>

        {/* Sub Nav */}
        <div className="container mx-auto px-4 pb-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/leader'}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors whitespace-nowrap"
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {item.showBadge && unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-promessa-500 text-white">
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
