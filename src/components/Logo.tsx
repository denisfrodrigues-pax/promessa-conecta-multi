import { cn } from '@/lib/utils';
import { Church } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'white';
}

/**
 * Marca genérica de fallback — usada quando não há logo de igreja
 * cadastrada (ou o contexto não tem uma igreja específica, ex.:
 * ResetPassword, InstallPWA). Nunca deve ser a logo de uma igreja real.
 */
export function Logo({ size = 32, className, variant = 'default' }: LogoProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg shrink-0',
        variant === 'white' ? 'bg-white/15 text-white' : 'bg-muted text-muted-foreground',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Church style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}
