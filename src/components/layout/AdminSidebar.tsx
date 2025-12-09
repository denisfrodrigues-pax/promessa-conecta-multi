import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  Bell,
  Church,
  Music,
  ClipboardList,
  Baby,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserPlus,
  Network,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Usuários', path: '/admin/usuarios' },
  { icon: UserPlus, label: 'Visitantes', path: '/admin/visitantes' },
  { icon: Users, label: 'Membros', path: '/admin/membros' },
  { icon: Network, label: 'Bases', path: '/admin/bases' },
  { icon: BarChart3, label: 'Relatório Bases', path: '/admin/bases/relatorio' },
  { icon: UsersRound, label: 'Grupos', path: '/admin/grupos' },
  { icon: Music, label: 'Ministérios', path: '/admin/ministerios' },
  { icon: Users, label: 'Voluntários', path: '/admin/voluntarios-ministerios' },
  { icon: ClipboardList, label: 'Funções', path: '/admin/funcoes-ministerio' },
  { icon: ClipboardList, label: 'Escalas', path: '/admin/escalas' },
  { icon: Bell, label: 'Notificações', path: '/admin/notificacoes', showBadge: true },
  { icon: Baby, label: 'Infantil', path: '/admin/infantil' },
  { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
  { icon: Bell, label: 'Avisos', path: '/admin/avisos' },
  { icon: Shield, label: 'Auditoria', path: '/admin/auditoria' },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { unreadCount } = useAdminNotifications();

  return (
    <aside
      className={cn(
        'h-screen bg-gradient-sidebar sticky top-0 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-church-gold flex items-center justify-center flex-shrink-0">
          <Church className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-sidebar-foreground text-sm">Igreja da Promessa</h2>
            <p className="text-xs text-sidebar-foreground/60">Painel Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200',
              collapsed && 'justify-center px-2'
            )}
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
            {item.showBadge && unreadCount > 0 && (
              <Badge 
                className={cn(
                  "h-5 min-w-[20px] flex items-center justify-center p-0 text-xs bg-church-gold text-primary",
                  collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Actions */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
            <div className="w-8 h-8 rounded-full bg-church-gold flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {profile.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.nome}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile.email}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-1"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
