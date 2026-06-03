import { cn } from '@/lib/utils';
import { useIgrejaConfig } from '@/hooks/useIgrejaConfig';
import { Logo } from './Logo';
import { Church } from 'lucide-react';

interface ChurchLogoProps {
  size?: number;
  maxWidth?: number;
  className?: string;
  fallbackText?: string;
  showFallbackIcon?: boolean;
}

export function ChurchLogo({
  size = 40,
  maxWidth = 120,
  className,
  fallbackText,
  showFallbackIcon = true,
}: ChurchLogoProps) {
  const { config, loading } = useIgrejaConfig();

  if (loading) {
    return (
      <div
        className={cn('animate-pulse bg-muted rounded', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (config?.logo_url && !config.logo_url.includes('placeholder')) {
    return (
      <img
        src={config.logo_url}
        alt={config.nome || 'Logo da Igreja'}
        className={cn('object-contain', className)}
        style={{ maxWidth, maxHeight: size, width: 'auto', height: 'auto' }}
      />
    );
  }

  if (showFallbackIcon) return <Logo size={size} className={className} />;

  if (fallbackText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Church className="w-6 h-6" />
        <span className="font-display font-semibold">{fallbackText}</span>
      </div>
    );
  }

  return <Logo size={size} className={className} />;
}
