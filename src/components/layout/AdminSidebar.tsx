import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/Logo';
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
  moduleKey?: string; // chave do módulo para ocultar se desabilitado
  submenu?: { icon: React.ElementType; label: string; path: string; moduleKey?: string }[];
}

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { profile, signOut } = useAuth();
  const { config, nomeModulo } = useIgrejaConfig();
  const { unreadCount } = useAdminNotifications();
  const { p } = useIgrejaSlug();
  const location = useLocation();

  // Monta o menu com nomes e disponibilidade dinâmicos
  const menuItems: MenuItem[] = useMemo(() => [
    { icon: LayoutDashboard, label: 'Dashboard', path: p('/admin/dashboard') },
    { icon: Users, label: 'Usuários', path: p('/admin/usuarios') },
    // === MEMBROS ===
    {
      icon: Users,
      label: 'Membros',
      path: p('/admin/membros'),
      submenu: [
        { icon: Users, label: 'Lista de Membros', path: p('/admin/membros') },
        { icon: UserPlus, label: 'Visitantes', path: p('/admin/visitantes') },
        { icon: Baby, label: 'Kids', path: p('/admin/kids') },
        { icon: FileText, label: 'Relatório Membros', path: p('/admin/membros/relatorio') },
      ]
    },
    // === BASES / PEQUENOS GRUPOS ===
    {
      icon: Network,
      label: nomeModulo.bases,
      path: p('/admin/bases'),
      moduleKey: 'modulo_pequenos_grupos',
      submenu: [
        { icon: Network, label: `Lista de ${nomeModulo.bases}`, path: p('/admin/bases') },
        { icon: FileText, label: `Relatório ${nomeModulo.bases}`, path: p('/admin/bases/relatorio') },
      ]
    },
    // === EQUIPE & OPERAÇÕES ===
    {
      icon: Briefcase,
      label: 'Equipe & Operações',
      path: p('/admin/ministerios'),
      submenu: [
        { icon: Music, label: 'Ministérios', path: p('/admin/ministerios') },
        { icon: ClipboardList, label: 'Funções', path: p('/admin/funcoes-ministerio') },
        { icon: Users, label: 'Voluntários', path: p('/admin/voluntarios-ministerios') },
        { icon: ClipboardList, label: 'Períodos de Escala', path: p('/admin/escalas/periodos') },
        { icon: ClipboardList, label: 'Escalas', path: p('/admin/escalas') },
      ]
    },
    { icon: Bell, label: 'Notificações', path: p('/admin/notificacoes'), showBadge: true },
    // === FINANCEIRO ===
    {
      icon: Wallet,
      label: nomeModulo.financeiro,
      path: p('/admin/financeiro'),
      moduleKey: 'modulo_financeiro',
      submenu: [
        { icon: LayoutDashboard, label: 'Dashboard', path: p('/admin/financeiro') },
        { icon: ArrowLeftRight, label: 'Transações', path: p('/admin/financeiro/transacoes') },
        { icon: CreditCard, label: 'Contas', path: p('/admin/financeiro/contas') },
        { icon: Tag, label: 'Categorias', path: p('/admin/financeiro/categorias') },
        { icon: FileText, label: 'Relatórios', path: p('/admin/financeiro/relatorios') },
        { icon: History, label: 'Auditoria', path: p('/admin/financeiro/auditoria') },
      ]
    },
    // === RELATÓRIOS ===
    {
      icon: BarChart3,
      label: 'Relatórios',
      path: p('/admin/relatorios'),
      submenu: [
        { icon: LayoutDashboard, label: 'Consolidado Geral', path: p('/admin/relatorios') },
        { icon: UserPlus, label: 'Visitantes', path: p('/admin/relatorios/visitantes') },
        { icon: Network, label: nomeModulo.bases, path: p('/admin/relatorios/bases') },
        { icon: Users, label: 'Membros', path: p('/admin/relatorios/membros') },
        { icon: Wallet, label: nomeModulo.financeiro, path: p('/admin/relatorios/financeiro'), moduleKey: 'modulo_financeiro' },
        { icon: MessageCircle, label: 'Comunicações', path: p('/admin/relatorios/comunicacoes') },
      ]
    },
    { icon: Calendar, label: 'Eventos', path: p('/admin/eventos') },
    { icon: Bell, label: 'Avisos', path: p('/admin/avisos') },
    { icon: BookOpen, label: 'Devocionais', path: p('/admin/devocionais') },
    // Escola Bíblica (módulo oculto se desabilitado)
    {
      icon: GraduationCap,
      label: nomeModulo.escolaBiblica,
      path: p('/admin/ensino'),
      moduleKey: 'modulo_escola_biblica',
    },
    // Auditoria (módulo oculto se desabilitado)
    { icon: Shield, label: 'Auditoria', path: p('/admin/auditoria'), moduleKey: 'modulo_auditoria' },
    // Configurações
    {
      icon: Settings,
      label: 'Configurações',
      path: p('/admin/configuracoes'),
      submenu: [
        { icon: Settings, label: 'Configurações Gerais', path: p('/admin/configuracoes') },
        { icon: Building2, label: 'Dados da Igreja', path: p('/admin/configuracoes/igreja') },
      ]
    },
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

  return (
    <aside
      className={cn(
        'h-screen bg-neutral-50 border-r border-neutral-200 sticky top-0 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        "p-4 flex items-center border-b border-neutral-200",
        collapsed ? "justify-center" : "gap-3"
      )}>
        {hasCustomLogo ? (
          <img
            src={config.logo_url!}
            alt={churchName}
            className={cn(
              "object-contain",
              collapsed ? "max-h-8 max-w-8" : "max-h-10 max-w-[120px]"
            )}
          />
        ) : (
          <Logo size={collapsed ? 32 : 40} />
        )}
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="text-sm font-semibold text-promessa-700">Painel Administrativo</p>
            <p className="text-xs text-neutral-500 truncate">{churchName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <div key={item.path}>
            {item.submenu && item.submenu.length > 0 ? (
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

                {!collapsed && isExpanded(item.path) && (
                  <div className="mt-1 ml-4 pl-4 border-l border-neutral-200 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end={subItem.path === p('/admin/kids')}
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

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200 space-y-2">
        {!collapsed && <PlanoInfo compact />}

        <NavLink
          to={p('/app')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-promessa-50 text-promessa-700 hover:bg-promessa-100 hover:text-promessa-900 transition-all duration-200 border border-promessa-200',
            collapsed && 'justify-center px-2'
          )}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Área do Membro</span>}
        </NavLink>

        <div className={cn(
          "flex items-center gap-2",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <UserAvatarMenu size="sm" showName={!collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-promessa-700 hover:bg-promessa-50"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
