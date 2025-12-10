import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

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
        'logo-shadow object-contain',
        variant === 'white' && 'brightness-[100]',
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
