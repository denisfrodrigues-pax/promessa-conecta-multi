import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

export interface IgrejaPublicContent {
  missao: string | null;
  visao: string | null;
  historia: string | null;
  cidade: string | null;
}

/** Conteúdo institucional (missão/visão/história/cidade) da igreja do slug atual.
 *  Funciona também para visitante não-autenticado (páginas públicas). */
export function useIgrejaPublicContent() {
  const { churchId } = useIgrejaSlug();
  const [content, setContent] = useState<IgrejaPublicContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setContent(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('igrejas')
      .select('missao, visao, historia, cidade')
      .eq('id', churchId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Erro ao carregar conteúdo institucional:', error);
          setContent(null);
        } else {
          setContent(data);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [churchId]);

  return { content, loading };
}
