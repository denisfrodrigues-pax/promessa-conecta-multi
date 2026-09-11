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
import { useKidsVolunteer } from '@/hooks/useKidsVolunteer';

export default function AppLayout() {
  const { roles, isLider, isVoluntario } = useAuth();
  const { slug, p } = useIgrejaSlug();
  const { nomeModulo } = useIgrejaConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { isKidsVolunteer } = useKidsVolunteer();

  const isSuperAdmin = roles.includes('superadmin');
  const isAdmin = roles.includes('admin');

  // Painéis: URLs absolutas com slug direto (sem p() que adicionaria /app/ desnecessário).
  // Cada item só aparece pra quem realmente tem acesso à rota — mesmos allowedRoles
  // de /admin, /leader e /voluntario em App.tsx. "Admin da Igreja" fica exclusivo de
  // admin/superadmin (allowedRoles=["admin"]); "Painel Líder" usa isLider, que já
  // cascateia lider/admin/superadmin (allowedRoles=["lider","admin"]); "Painel
  // Voluntário" usa isVoluntario, que cascateia voluntario/lider/admin/superadmin
  // (allowedRoles=["voluntario","admin","lider"]) — um líder puro (sem admin), como
  // uma líder de ministério comum, precisa ver os dois últimos mesmo sem ser admin.
  // "Super Admin" fica exclusivo do superadmin, único com acesso à rota /admin
  // (painel entre múltiplas igrejas). Check-in Kids aparece à parte, independente
  // de admin/líder — para qualquer usuário que seja voluntário ativo do ministério
  // Kids (ver useKidsVolunteer).
  const panelItems = [
    ...(isSuperAdmin ? [{ href: '/admin', label: '⚡ Super Admin' }] : []),
    ...(isSuperAdmin || isAdmin ? [{ href: `/i/${slug}/admin/dashboard`, label: 'Admin da Igreja' }] : []),
    ...(isLider ? [{ href: `/i/${slug}/leader/hub`, label: 'Painel Líder' }] : []),
    ...(isVoluntario ? [{ href: `/i/${slug}/voluntario`, label: 'Painel Voluntário' }] : []),
    ...(isKidsVolunteer ? [
      { href: `/i/${slug}/leader/mca/checkin`, label: '👶 Check-in Kids' },
    ] : []),
  ];

  const nomeBase = nomeModulo.bases ?? 'PG';

  const navItems = [
    { icon: Home,          label: 'Início',            path: p('/app') },
    { icon: Church,        label: 'Minha Igreja',      path: p('/app/minha-igreja') },
    { icon: Users,         label: nomeBase,             path: p('/app/minha-base') },
    { icon: BookOpenCheck, label: 'Ensino',             path: p('/app/meu-ensino') },
    { icon: Heart,         label: 'Minhas Contribuições', path: p('/app/contribuicoes') },
    { icon: Bell,          label: 'Notificações',      path: p('/app/notificacoes'), badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: User,          label: 'Perfil',             path: p('/app/perfil') },
  ];

  const mobileBottomNavItems = [
    { icon: Home,          label: 'Início',       path: p('/app') },
    { icon: Users,         label: nomeBase,        path: p('/app/minha-base') },
    { icon: BookOpenCheck, label: 'Ensino',        path: p('/app/meu-ensino') },
    { icon: User,          label: 'Perfil',        path: p('/app/perfil') },
  ];

  return (
    // Mobile: altura travada na viewport, com <main> como única área que rola —
    // a barra inferior fica fora da área de rolagem (não é mais `fixed` por
    // cima do conteúdo), então nenhum conteúdo pode ficar escondido atrás dela
    // na posição inicial de rolagem (ver bug de /app/calendario). Desktop
    // mantém o comportamento anterior (scroll do documento), já que a barra
    // inferior não existe a partir de md.
    <div className="h-screen md:h-auto md:min-h-screen bg-stone-50 flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
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
                      'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-promessa-100 text-promessa-700'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
                className="lg:hidden rounded-xl h-11 w-11"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
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
          <div className="lg:hidden border-t border-stone-200 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === p('/app')}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm font-medium rounded-xl transition-colors',
                      isActive
                        ? 'bg-promessa-100 text-promessa-700'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
              <div className="pt-3 mt-3 border-t border-stone-200">
                <UserAvatarMenu size="md" showName />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:overflow-visible">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation — item de flex normal, não mais `fixed`
          sobrepondo o conteúdo (ver comentário no wrapper acima). */}
      <nav className="md:hidden shrink-0 bg-white border-t border-stone-200 shadow-elevated z-50">
        <div className="flex justify-around py-2">
          {mobileBottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[44px] min-w-[44px] text-xs',
                  isActive
                    ? 'text-promessa-700'
                    : 'text-stone-500'
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
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[44px] min-w-[44px] text-xs',
                isActive
                  ? 'text-promessa-700'
                  : 'text-stone-500'
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
