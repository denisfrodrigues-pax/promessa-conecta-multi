import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiTileProps {
  icon: LucideIcon;
  /** Estatística exibida em destaque. Omitir (junto com `description`) faz o tile funcionar como atalho de navegação simples, sem número. */
  value?: React.ReactNode;
  label: string;
  /** Texto secundário exibido no lugar de `value`, para tiles que são só atalhos (sem métrica). */
  description?: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  iconClassName?: string;
  iconBgClassName?: string;
  className?: string;
}

/**
 * Tile de KPI compartilhado — mesma aparência em admin, líder e membro.
 * Cada tela mantém sua própria cor de destaque por métrica via iconClassName/iconBgClassName.
 */
export function KpiTile({
  icon: Icon,
  value,
  label,
  description,
  href,
  onClick,
  loading,
  iconClassName = 'text-primary',
  iconBgClassName = 'bg-primary/10',
  className,
}: KpiTileProps) {
  const Wrapper: any = href ? Link : onClick ? 'button' : 'div';
  const wrapperProps = href ? { to: href } : onClick ? { onClick, type: 'button' as const } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'group block w-full text-left rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200',
        (href || onClick) && 'hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', iconBgClassName)}>
        <Icon className={cn('w-6 h-6', iconClassName)} />
      </div>

      {value !== undefined ? (
        <>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3 mb-1" />
          ) : (
            <p className="text-2xl font-bold font-display text-foreground mt-3 leading-none truncate">{value}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1.5">{label}</p>
        </>
      ) : (
        <>
          <p className="font-medium text-foreground mt-3">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </>
      )}
    </Wrapper>
  );
}

export default KpiTile;
