import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface RequireMinistryProps {
  slug: string;
  children: React.ReactNode;
}

export default function RequireMinistry({ slug, children }: RequireMinistryProps) {
  const { roles } = useAuth();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  // Admins bypass ministry check
  const isAdmin = roles?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      setStatus('allowed');
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await supabase.rpc('get_my_ministries');
        if (error) throw error;
        const ministries = (data ?? []) as { slug: string | null }[];
        const has = ministries.some((m) => m.slug === slug);
        if (!has) {
          toast({
            title: 'Sem permissão',
            description: 'Você não tem acesso a este módulo.',
            variant: 'destructive',
          });
        }
        setStatus(has ? 'allowed' : 'denied');
      } catch {
        setStatus('denied');
      }
    };

    check();
  }, [slug, isAdmin]);

  if (status === 'loading') {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/voluntario" replace />;
  }

  return <>{children}</>;
}
