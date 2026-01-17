import { cn } from '@/lib/utils';
import { Home } from 'lucide-react';

interface FotoCapaProps {
  src?: string | null;
  alt?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function FotoCapa({ 
  src, 
  alt = 'Imagem', 
  aspectRatio = '16/9',
  className,
  fallbackIcon
}: FotoCapaProps) {
  const hasValidSrc = src && !src.includes('placeholder');

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-muted rounded-lg',
        className
      )}
      style={{ aspectRatio }}
    >
      {hasValidSrc ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center text-muted-foreground',
          hasValidSrc && 'hidden'
        )}
      >
        {fallbackIcon || <Home className="w-12 h-12" />}
      </div>
    </div>
  );
}
