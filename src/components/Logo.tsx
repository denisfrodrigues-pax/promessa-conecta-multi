import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo-igreja.png';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'white';
}

export function Logo({ size = 32, className, variant = 'default' }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="Logo Igreja da Promessa"
      loading="lazy"
      width={size}
      height={size}
      className={cn(
        'object-contain',
        variant === 'white' && 'brightness-0 invert',
        className
      )}
      style={{ width: size, height: size }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.textContent = 'Igreja da Promessa';
        fallback.className = 'font-display font-semibold text-sm';
        target.parentNode?.appendChild(fallback);
      }}
    />
  );
}
