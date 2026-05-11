import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { ChurchLogo } from '@/components/ChurchLogo';
import {
  Users,
  Calendar,
  Bell,
  Heart,
  LayoutDashboard,
  Menu,
  X,
  Home,
  User,
  BookOpenCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function AppLayout() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const panelItems = [
    roles.includes('admin')      && { route: '/admin/dashboard', label: 'Painel Admin' },
    roles.includes('financeiro') && { route: '/financeiro',      label: 'Painel Financeiro' },
    roles.includes('lider')      && { route: '/leader/hub',      label: 'Painel Líder' },
    roles.includes('voluntario') && { route: '/voluntario',      label: 'Painel Voluntário' },
  ].filter(Boolean) as { route: string; label: string }[];
  
  const navItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: Users, label: 'Minha Base', path: '/app/minha-base' },
    { icon: Calendar, label: 'Eventos', path: '/app/eventos' },
    { icon: Calendar, label: 'Calendário', path: '/app/calendario' },
    { icon: BookOpenCheck, label: 'Meu Ensino', path: '/app/meu-ensino' },
    { icon: Bell, label: 'Notificações', path: '/app/notificacoes', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: Heart, label: 'Contribuições', path: '/app/contribuicoes' },
    { icon: User, label: 'Perfil', path: '/app/perfil' },
  ];

  // Items for bottom mobile nav (limited)
  const mobileBottomNavItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: Calendar, label: 'Calendário', path: '/app/calendario' },
    { icon: Calendar, label: 'Eventos', path: '/app/eventos' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <NavLink to="/app" className="flex items-center gap-2">
              <ChurchLogo size={36} maxWidth={140} />
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-promessa-100 text-promessa-700'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}

              {/* Panel Buttons - one per elevated role */}
              {panelItems.map((item) => (
                <Button
                  key={item.route}
                  variant="outline"
                  size="sm"
                  className="ml-2 border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                  onClick={() => navigate(item.route)}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* User Avatar & Mobile Menu Toggle */}
            <div className="flex items-center gap-3">
              <UserAvatarMenu size="sm" showName className="hidden sm:flex" />
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-promessa-100 text-promessa-700'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}

              {/* Panel Buttons - Mobile */}
              {panelItems.map((item) => (
                <Button
                  key={item.route}
                  variant="outline"
                  className="w-full mt-2 border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                  onClick={() => { navigate(item.route); setMobileMenuOpen(false); }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}

              {/* User info on mobile */}
              <div className="pt-3 mt-3 border-t border-border">
                <UserAvatarMenu size="md" showName />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="flex justify-around py-2">
          {mobileBottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs',
                  isActive
                    ? 'text-promessa-700'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Notification with badge */}
          <NavLink
            to="/app/notificacoes"
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 text-xs',
                isActive
                  ? 'text-promessa-700'
                  : 'text-muted-foreground'
              )
            }
          >
            <Bell className="w-5 h-5" />
            <span>Avisos</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
