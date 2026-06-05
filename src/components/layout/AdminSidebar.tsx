import { NavLink } from '@/components/NavLink';
import { ChurchLogo } from '@/components/ChurchLogo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { PlanoInfo } from '@/components/PlanoInfo';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  Music,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  UserPlus,
  Network,
  BarChart3,
  FileText,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Tag,
  History,
  Home,
  Briefcase,
  MessageCircle,
  BookOpen,
  Baby,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  showBadge?: boolean;
  moduleKey?: string;
  section?: string; // label de seção exibida antes deste item
  submenu?: { icon: React.ElementType; label: string; path: string; moduleKey?: string }[];
}

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { profile, roles, signOut } = useAuth();
  const { config, nomeModulo } = useIgrejaConfig();
  const { unreadCount } = useAdminNotifications();
  const { p } = useIgrejaSlug();
  const location = useLocation();
  const isSuperAdmin = roles.includes('superadmin');

  // Monta o menu com nomes e disponibilidade dinâmicos
  const menuItems: MenuItem[] = useMemo(() => [
    { icon: LayoutDashboard, label: 'Dashboard', path: p('/admin/dashboard') },
    // === PESSOAS ===
    { icon: Users,    label: 'Usuários', path: p('/admin/usuarios'), section: 'Pessoas' },
    {
      icon: Users, label: 'Membros', path: p('/admin/membros'),
      submenu: [
        { icon: Users,    label: 'Lista de Membros',    path: p('/admin/membros') },
        { icon: UserPlus, label: 'Visitantes',          path: p('/admin/visitantes') },
        { icon: FileText, label: 'Relatório Membros',   path: p('/admin/membros/relatorio') },
      ]
    },
    {
      icon: Network, label: nomeModulo.bases, path: p('/admin/bases'),
      moduleKey: 'modulo_pequenos_grupos',
      submenu: [
        { icon: Network,  label: `Lista de ${nomeModulo.bases}`,    path: p('/admin/bases') },
        { icon: FileText, label: `Relatório ${nomeModulo.bases}`,   path: p('/admin/bases/relatorio') },
      ]
    },
    // === OPERAÇÕES ===
    {
      icon: Briefcase, label: 'Equipe & Operações', path: p('/admin/ministerios'), section: 'Operações',
      submenu: [
        { icon: Music,        label: 'Ministérios',      path: p('/admin/ministerios') },
        { icon: ClipboardList,label: 'Funções',          path: p('/admin/funcoes-ministerio') },
        { icon: Users,        label: 'Voluntários',      path: p('/admin/voluntarios-ministerios') },
        { icon: ClipboardList,label: 'Períodos de Escala',path: p('/admin/escalas/periodos') },
        { icon: ClipboardList,label: 'Escalas',          path: p('/admin/escalas') },
      ]
    },
    { icon: Calendar,  label: 'Eventos',       path: p('/admin/eventos') },
    { icon: Bell,      label: 'Notificações',  path: p('/admin/notificacoes'), showBadge: true },
    // === CONTEÚDO ===
    { icon: MessageCircle, label: 'Avisos',    path: p('/admin/avisos'), section: 'Conteúdo' },
    { icon: BookOpen,      label: 'Devocionais',path: p('/admin/devocionais') },
    {
      icon: GraduationCap, label: nomeModulo.escolaBiblica,
      path: p('/admin/ensino'), moduleKey: 'modulo_escola_biblica',
    },
    // === GESTÃO ===
    {
      icon: Wallet, label: nomeModulo.financeiro, path: p('/admin/financeiro'),
      moduleKey: 'modulo_financeiro', section: 'Gestão',
      submenu: [
        { icon: LayoutDashboard, label: 'Dashboard',    path: p('/admin/financeiro') },
        { icon: ArrowLeftRight,  label: 'Transações',   path: p('/admin/financeiro/transacoes') },
        { icon: CreditCard,      label: 'Contas',       path: p('/admin/financeiro/contas') },
        { icon: Tag,             label: 'Categorias',   path: p('/admin/financeiro/categorias') },
        { icon: FileText,        label: 'Relatórios',   path: p('/admin/financeiro/relatorios') },
        { icon: History,         label: 'Auditoria',    path: p('/admin/financeiro/auditoria') },
      ]
    },
    {
      icon: BarChart3, label: 'Relatórios', path: p('/admin/relatorios'),
      submenu: [
        { icon: LayoutDashboard, label: 'Consolidado Geral',    path: p('/admin/relatorios') },
        { icon: UserPlus,        label: 'Visitantes',           path: p('/admin/relatorios/visitantes') },
        { icon: Network,         label: nomeModulo.bases,        path: p('/admin/relatorios/bases') },
        { icon: Users,           label: 'Membros',               path: p('/admin/relatorios/membros') },
        { icon: Wallet,          label: nomeModulo.financeiro,   path: p('/admin/relatorios/financeiro'), moduleKey: 'modulo_financeiro' },
        { icon: MessageCircle,   label: 'Comunicações',          path: p('/admin/relatorios/comunicacoes') },
      ]
    },
    { icon: Shield, label: 'Auditoria', path: p('/admin/auditoria'), moduleKey: 'modulo_auditoria' },
    // === SISTEMA ===
    { icon: Settings, label: 'Configurações', path: p('/admin/configuracoes/igreja'), section: 'Sistema' },
  ], [nomeModulo, config, p]);

  // Filtra itens de menu baseado nos módulos habilitados
  const visibleMenuItems = useMemo(() => {
    return menuItems
      .filter(item => {
        if (!item.moduleKey) return true;
        return (config as any)[item.moduleKey] !== false;
      })
      .map(item => ({
        ...item,
        submenu: item.submenu?.filter(sub => {
          if (!sub.moduleKey) return true;
          return (config as any)[sub.moduleKey] !== false;
        }),
      }));
  }, [menuItems, config]);

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
    return expandedMenus.includes(path) || visibleMenuItems.find(m => m.path === path && isSubmenuActive(m));
  };

  const hasCustomLogo = config?.logo_url && !config.logo_url.includes('placeholder');
  const churchName = config?.nome || 'Igreja';

  const activeBase = 'border-l-2 border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] font-medium';
  const inactiveBase = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-gray-100 sticky top-0 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'px-4 py-5 flex items-center border-b border-gray-100',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        {hasCustomLogo ? (
          <img
            src={config.logo_url!}
            alt={churchName}
            className={cn('object-contain rounded-lg', collapsed ? 'max-h-8 max-w-8' : 'max-h-9 max-w-[110px]')}
          />
        ) : (
          <ChurchLogo size={collapsed ? 32 : 36} />
        )}
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{churchName}</p>
            <p className="text-xs text-gray-400">Painel Administrativo</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <div key={item.path}>
            {/* Section label */}
            {!collapsed && item.section && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 mt-4 mb-1">
                {item.section}
              </p>
            )}

            {item.submenu && item.submenu.length > 0 ? (
              <div>
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={cn(
                    'w-full relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                    collapsed && 'justify-center px-2',
                    isSubmenuActive(item) ? activeBase : inactiveBase
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isExpanded(item.path) && 'rotate-180')} />
                    </>
                  )}
                </button>

                {!collapsed && isExpanded(item.path) && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-gray-100 space-y-0.5 mb-0.5">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 text-sm"
                        activeClassName="bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] font-medium"
                      >
                        <subItem.icon className="w-3.5 h-3.5" />
                        <span>{subItem.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to={item.path}
                end
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150',
                  collapsed && 'justify-center px-2'
                )}
                activeClassName={activeBase}
                inactiveClassName={inactiveBase}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {item.showBadge && unreadCount > 0 && (
                  <Badge
                    className={cn(
                      'h-4 min-w-[16px] flex items-center justify-center p-0 text-[10px]',
                      collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'
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

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1.5">
        {!collapsed && <PlanoInfo compact />}

        {isSuperAdmin && (
          <NavLink
            to="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all duration-150 border border-amber-200 text-sm font-medium',
              collapsed && 'justify-center px-2'
            )}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>← Super Admin</span>}
          </NavLink>
        )}

        <NavLink
          to={p('/app')}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150 border border-gray-200',
            collapsed && 'justify-center px-2'
          )}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Área do Membro</span>}
        </NavLink>

        <div className={cn('flex items-center gap-2', collapsed ? 'justify-center' : 'justify-between')}>
          <UserAvatarMenu size="sm" showName={!collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
