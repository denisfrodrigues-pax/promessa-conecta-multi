import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
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
  ChevronDown,
  Church,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function AppLayout() {
  const { roles } = useAuth();
  const { p } = useIgrejaSlug();
  const { nomeModulo } = useIgrejaConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const isSuperAdmin = roles.includes('superadmin');

  // Painéis: apenas superadmin vê o dropdown de troca de painel
  // Usa window.location.href para garantir navegação completa (evita issues com PrivateRoute + router)
  const panelItems = isSuperAdmin ? [
    { href: '/admin',                          label: '⚡ Super Admin' },
    { href: `${p('/admin/dashboard')}`,        label: 'Admin da Igreja' },
    { href: `${p('/leader/hub')}`,             label: 'Painel Líder' },
    { href: `${p('/voluntario')}`,             label: 'Painel Voluntário' },
  ] : [];

  const nomeBase = nomeModulo.bases ?? 'PG';

  const navItems = [
    { icon: Home,          label: 'Início',       path: p('/app') },
    { icon: Church,        label: 'Minha Igreja', path: p('/app/minha-igreja') },
    { icon: Users,         label: nomeBase,        path: p('/app/minha-base') },
    { icon: BookOpenCheck, label: 'Ensino',        path: p('/app/meu-ensino') },
    { icon: Bell,          label: 'Notificações', path: p('/app/notificacoes'), badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User,          label: 'Perfil',        path: p('/app/perfil') },
  ];

  const mobileBottomNavItems = [
    { icon: Home,          label: 'Início',  path: p('/app') },
    { icon: Users,         label: nomeBase,   path: p('/app/minha-base') },
    { icon: BookOpenCheck, label: 'Ensino',   path: p('/app/meu-ensino') },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to={p('/publico')} title="Ir para o site da igreja" className="flex items-center gap-2">
              <ChurchLogo size={36} maxWidth={140} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === p('/app')}
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

              {/* Panel Dropdown */}
              {panelItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painéis
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {panelItems.map((item) => (
                      <DropdownMenuItem key={item.href} onClick={() => { window.location.href = item.href; }}>
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                  end={item.path === p('/app')}
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

              {/* Panel Dropdown - Mobile */}
              {panelItems.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-2 border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Painéis
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {panelItems.map((item) => (
                      <DropdownMenuItem key={item.href} onClick={() => { window.location.href = item.href; setMobileMenuOpen(false); }}>
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
            to={p('/app/notificacoes')}
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
