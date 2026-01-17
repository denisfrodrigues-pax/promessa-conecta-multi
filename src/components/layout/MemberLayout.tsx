import { Outlet, Navigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/Logo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { Home, Users, Calendar, Bell, User, Menu, CalendarCheck, Loader2, Baby, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useKidsVolunteer } from '@/hooks/useKidsVolunteer';

const navItems = [
  { icon: Home, label: 'Início', path: '/app' },
  { icon: CalendarCheck, label: 'Escalas', path: '/app/escalas' },
  { icon: Users, label: 'Bases', path: '/app/bases' },
  { icon: Calendar, label: 'Eventos', path: '/app/eventos' },
  { icon: User, label: 'Perfil', path: '/app/perfil' },
];

export default function MemberLayout() {
  const { user, loading, profile, signOut, isAdmin, isLider, roles } = useAuth();
  const { unreadCount } = useNotifications();
  const { isKidsVolunteer } = useKidsVolunteer();
  
  // Check if user can see "Escala do Dia" - only for schedulable roles
  const canSeeEscalaDoDia = roles.some(r => ['admin', 'financeiro', 'lider', 'voluntario'].includes(r));
  // Check if user is financeiro-only (not admin)
  const isFinanceiroOnly = roles.includes('financeiro') && !roles.includes('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Premium White Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <RouterNavLink to="/home" className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-display font-bold text-lg hidden sm:block text-promessa-700">Igreja da Promessa</span>
          </RouterNavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors"
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
            {/* Notifications */}
            <NavLink
              to="/notificacoes"
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors"
              activeClassName="bg-promessa-100 text-promessa-700 font-medium"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm">Notificações</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-promessa-500 text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </NavLink>
            {/* Voluntários do Dia - only for schedulable roles */}
            {canSeeEscalaDoDia && (
              <NavLink
                to="/app/voluntarios-do-dia"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors"
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-sm">Escala do Dia</span>
              </NavLink>
            )}
            {/* Check-in Kids - apenas para voluntários do ministério Kids */}
            {isKidsVolunteer && (
              <NavLink
                to="/check-in-kids"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors"
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <Baby className="w-4 h-4" />
                <span className="text-sm">Check-in Kids</span>
              </NavLink>
            )}
            {isAdmin && (
              <Button asChild variant="promessa" className="ml-2 font-semibold">
                <RouterNavLink to="/admin">
                  Painel Admin
                </RouterNavLink>
              </Button>
            )}
            {isFinanceiroOnly && (
              <Button asChild variant="promessa" className="ml-2 font-semibold">
                <RouterNavLink to="/financeiro">
                  Painel Financeiro
                </RouterNavLink>
              </Button>
            )}
            {isLider && !isAdmin && !isFinanceiroOnly && (
              <Button asChild variant="promessa" className="ml-2 font-semibold">
                <RouterNavLink to="/leader">
                  Painel Líder
                </RouterNavLink>
              </Button>
            )}
            <UserAvatarMenu size="sm" className="ml-2" />
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Notification Bell */}
            <RouterNavLink to="/notificacoes" className="relative p-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </RouterNavLink>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">
                        {profile?.nome?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{profile?.nome}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>

                  <nav className="flex-1 py-6 space-y-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                    <NavLink
                      to="/notificacoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <Bell className="w-5 h-5" />
                      <span>Notificações</span>
                      {unreadCount > 0 && (
                        <Badge className="ml-auto">{unreadCount}</Badge>
                      )}
                    </NavLink>
                    {/* Check-in Kids - apenas para voluntários do ministério Kids */}
                    {isKidsVolunteer && (
                      <NavLink
                        to="/check-in-kids"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <Baby className="w-5 h-5" />
                        <span>Check-in Kids</span>
                      </NavLink>
                    )}
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-promessa-100 text-promessa-700 hover:bg-promessa-200 transition-colors"
                      >
                        <span className="font-medium">Painel Admin</span>
                      </NavLink>
                    )}
                    {isFinanceiroOnly && (
                      <NavLink
                        to="/financeiro"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-promessa-100 text-promessa-700 hover:bg-promessa-200 transition-colors"
                      >
                        <span className="font-medium">Painel Financeiro</span>
                      </NavLink>
                    )}
                    {isLider && !isAdmin && !isFinanceiroOnly && (
                      <NavLink
                        to="/leader"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-promessa-100 text-promessa-700 hover:bg-promessa-200 transition-colors"
                      >
                        <span className="font-medium">Painel Líder</span>
                      </NavLink>
                    )}
                  </nav>

                  <Button variant="outline" onClick={signOut} className="mt-auto">
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-elevated z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground"
              activeClassName="text-primary"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/notificacoes"
            className="relative flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground"
            activeClassName="text-primary"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Avisos</span>
            {unreadCount > 0 && (
              <Badge className="absolute top-0 right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
