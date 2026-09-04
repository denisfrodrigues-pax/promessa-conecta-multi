import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

/** Estado vazio compartilhado — ícone + título + subtítulo + CTA opcional (padrão de admin/Eventos.tsx). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('py-16 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="rounded-xl">
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
