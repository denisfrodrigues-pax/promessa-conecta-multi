import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/Logo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/hooks/useChurchConfig';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  CreditCard,
  Tag,
  FileText,
  History,
  Home,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/financeiro' },
  { icon: ArrowLeftRight, label: 'Transações', path: '/financeiro/transacoes' },
  { icon: CreditCard, label: 'Contas', path: '/financeiro/contas' },
  { icon: Tag, label: 'Categorias', path: '/financeiro/categorias' },
  { icon: FileText, label: 'Relatórios', path: '/financeiro/relatorios' },
  { icon: History, label: 'Auditoria', path: '/financeiro/auditoria' },
];

export default function FinanceiroSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const { config } = useChurchConfig();

  const hasCustomLogo = config?.logo_url && !config.logo_url.includes('placeholder');
  const churchName = config?.nome_igreja || 'Igreja da Promessa';

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
            <p className="text-sm font-semibold text-emerald-700">Painel Financeiro</p>
            <p className="text-xs text-neutral-500 truncate">{churchName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/financeiro'}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200',
              collapsed && 'justify-center px-2'
            )}
            activeClassName="bg-emerald-100 text-emerald-700 font-medium"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200 space-y-2">
        {/* Back to Member Area Button */}
        <NavLink
          to="/app"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 transition-all duration-200 border border-emerald-200',
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
            className="text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
