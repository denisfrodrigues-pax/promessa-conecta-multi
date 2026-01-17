import { cn } from '@/lib/utils';

interface AvatarFotoProps {
  src?: string | null;
  nome?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const getInitials = (nome?: string): string => {
  if (!nome) return '?';
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export function AvatarFoto({ src, nome, size = 'md', className }: AvatarFotoProps) {
  const hasValidSrc = src && !src.includes('placeholder');

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {hasValidSrc ? (
        <img
          src={src}
          alt={nome || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span
        className={cn(
          'font-medium text-muted-foreground',
          hasValidSrc && 'hidden'
        )}
      >
        {getInitials(nome)}
      </span>
    </div>
  );
}
