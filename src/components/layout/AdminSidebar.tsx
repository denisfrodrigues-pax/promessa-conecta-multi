import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  Music,
  ClipboardList,
  Baby,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  UserPlus,
  Network,
  BarChart3,
  CheckSquare,
  User,
  MapPin,
  FileText,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Tag,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  showBadge?: boolean;
  submenu?: { icon: React.ElementType; label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Usuários', path: '/admin/usuarios' },
  { icon: UserPlus, label: 'Visitantes', path: '/admin/visitantes' },
  { 
    icon: Users, 
    label: 'Membros', 
    path: '/admin/membros',
    submenu: [
      { icon: Users, label: 'Lista de Membros', path: '/admin/membros' },
      { icon: UserPlus, label: 'Novo Membro', path: '/admin/membros/novo' },
      { icon: FileText, label: 'Relatório', path: '/admin/membros/relatorio' },
    ]
  },
  { icon: Network, label: 'Bases', path: '/admin/bases' },
  { icon: BarChart3, label: 'Relatório Bases', path: '/admin/bases/relatorio' },
  { icon: Users, label: 'Acompanhamento', path: '/admin/acompanhamento' },
  { icon: Music, label: 'Ministérios', path: '/admin/ministerios' },
  { icon: Users, label: 'Voluntários', path: '/admin/voluntarios-ministerios' },
  { icon: ClipboardList, label: 'Funções', path: '/admin/funcoes-ministerio' },
  { icon: ClipboardList, label: 'Escalas', path: '/admin/escalas' },
  { icon: Bell, label: 'Notificações', path: '/admin/notificacoes', showBadge: true },
  { 
    icon: Baby, 
    label: 'Kids', 
    path: '/admin/kids',
    submenu: [
      { icon: CheckSquare, label: 'Check-ins', path: '/admin/kids' },
      { icon: Baby, label: 'Crianças', path: '/admin/kids/criancas' },
      { icon: User, label: 'Responsáveis', path: '/admin/kids/responsaveis' },
      { icon: MapPin, label: 'Salas', path: '/admin/kids/salas' },
      { icon: FileText, label: 'Relatório', path: '/admin/kids/relatorio' },
    ]
  },
  {
    icon: Wallet,
    label: 'Financeiro',
    path: '/admin/financeiro',
    submenu: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/financeiro' },
      { icon: ArrowLeftRight, label: 'Transações', path: '/admin/financeiro/transacoes' },
      { icon: CreditCard, label: 'Contas', path: '/admin/financeiro/contas' },
      { icon: Tag, label: 'Categorias', path: '/admin/financeiro/categorias' },
      { icon: FileText, label: 'Relatórios', path: '/admin/financeiro/relatorios' },
      { icon: History, label: 'Auditoria', path: '/admin/financeiro/auditoria' },
    ]
  },
  {
    icon: BarChart3,
    label: 'Relatórios',
    path: '/admin/relatorios',
    submenu: [
      { icon: LayoutDashboard, label: 'Consolidado Geral', path: '/admin/relatorios' },
      { icon: UserPlus, label: 'Visitantes', path: '/admin/relatorios/visitantes' },
      { icon: Network, label: 'Bases', path: '/admin/relatorios/bases' },
      { icon: Users, label: 'Membros', path: '/admin/relatorios/membros' },
      { icon: Wallet, label: 'Financeiro', path: '/admin/relatorios/financeiro' },
      { icon: Baby, label: 'Kids', path: '/admin/relatorios/kids' },
    ]
  },
  { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
  { icon: Bell, label: 'Avisos', path: '/admin/avisos' },
  { icon: Shield, label: 'Auditoria', path: '/admin/auditoria' },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { profile, signOut } = useAuth();
  const { unreadCount } = useAdminNotifications();
  const location = useLocation();

  const isSubmenuActive = (item: MenuItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isExpanded = (path: string) => {
    return expandedMenus.includes(path) || menuItems.find(m => m.path === path && isSubmenuActive(m));
  };

  return (
    <aside
      className={cn(
        'h-screen bg-neutral-50 border-r border-neutral-200 sticky top-0 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header - Clean Premium */}
      <div className={cn(
        "p-4 flex items-center border-b border-neutral-200",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <Logo size={collapsed ? 32 : 40} />
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-semibold text-promessa-700">Painel Admin</p>
            <p className="text-xs text-neutral-500">Igreja da Promessa</p>
          </div>
        )}
      </div>

      {/* Navigation - Clean Premium */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.path}>
            {item.submenu ? (
              // Menu with submenu
              <div>
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={cn(
                    'w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 hover:bg-promessa-50 hover:text-promessa-700 transition-all duration-200',
                    collapsed && 'justify-center px-2',
                    isSubmenuActive(item) && 'bg-promessa-100 text-promessa-700 font-medium'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">{item.label}</span>
                      <ChevronDown 
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isExpanded(item.path) && 'rotate-180'
                        )} 
                      />
                    </>
                  )}
                </button>
                
                {/* Submenu items */}
                {!collapsed && isExpanded(item.path) && (
                  <div className="mt-1 ml-4 pl-4 border-l border-neutral-200 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end={subItem.path === '/admin/kids'}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-600 hover:bg-promessa-50 hover:text-promessa-700 transition-all duration-200 text-sm"
                        activeClassName="bg-promessa-100 text-promessa-700 font-medium"
                      >
                        <subItem.icon className="w-4 h-4" />
                        <span>{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Regular menu item
              <NavLink
                to={item.path}
                end
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 hover:bg-promessa-50 hover:text-promessa-700 transition-all duration-200',
                  collapsed && 'justify-center px-2'
                )}
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {item.showBadge && unreadCount > 0 && (
                  <Badge 
                    className={cn(
                      "h-5 min-w-[20px] flex items-center justify-center p-0 text-xs bg-promessa-500 text-white",
                      collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Profile & Actions - Clean Premium */}
      <div className="p-3 border-t border-neutral-200 space-y-2">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-100">
            <div className="w-8 h-8 rounded-full bg-promessa-700 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {profile.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{profile.nome}</p>
              <p className="text-xs text-neutral-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-promessa-700 hover:bg-promessa-50 flex-1"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-destructive hover:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}