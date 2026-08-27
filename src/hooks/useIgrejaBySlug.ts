import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IgrejaBasica {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  foto_login_url: string | null;
  subdominio: string | null;
  plano: string | null;
  ativo: boolean;
}

export function useIgrejaBySlug(slug: string | undefined) {
  const [church, setChurch] = useState<IgrejaBasica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('igrejas')
      .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria, foto_login_url, subdominio, plano, ativo')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setChurch(data as IgrejaBasica | null);
        setLoading(false);
      });
  }, [slug]);

  return { church, loading, error };
}
