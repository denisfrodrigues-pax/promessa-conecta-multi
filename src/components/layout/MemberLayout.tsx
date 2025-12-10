import { Outlet, Navigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { Home, Users, Calendar, Bell, User, Menu, X, Church, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const navItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: CalendarCheck, label: 'Escalas', path: '/minhas-escalas' },
  { icon: Users, label: 'Bases', path: '/bases' },
  { icon: Calendar, label: 'Eventos', path: '/eventos' },
  { icon: User, label: 'Perfil', path: '/perfil' },
];

export default function MemberLayout() {
  const { user, loading, profile, signOut, isAdmin, isLider } = useAuth();
  const { unreadCount } = useNotifications();
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <RouterNavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Church className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">Igreja da Promessa</span>
          </RouterNavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
            {/* Notifications */}
            <NavLink
              to="/notificacoes"
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm">Notificações</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </NavLink>
            {(isAdmin || isLider) && (
              <NavLink
                to={isAdmin ? '/admin' : '/lider'}
                className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-church-gold text-primary-foreground hover:bg-church-gold-dark transition-colors"
              >
                <span className="text-sm font-medium">{isAdmin ? 'Admin' : 'Líder'}</span>
              </NavLink>
            )}
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
                    {(isAdmin || isLider) && (
                      <NavLink
                        to={isAdmin ? '/admin' : '/lider'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-church-gold/10 text-church-gold hover:bg-church-gold/20 transition-colors"
                      >
                        <span className="font-medium">{isAdmin ? 'Painel Admin' : 'Painel Líder'}</span>
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
