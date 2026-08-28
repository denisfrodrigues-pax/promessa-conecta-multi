import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

export interface PixInfo {
  chave: string;
  nome: string;
  banco: string;
}

/** Dados de PIX e WhatsApp para contribuições, por igreja (configuracoes_instituicao.church_id). */
export function usePixInfo() {
  const { churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;

  const [pixInfo, setPixInfo] = useState<PixInfo | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setPixInfo(null);
      setWhatsapp(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('configuracoes_instituicao')
      .select('pix_info, chave_whatsapp')
      .eq('church_id', churchId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Erro ao carregar dados de PIX/WhatsApp:', error);
          setPixInfo(null);
          setWhatsapp(null);
        } else {
          const info = data?.pix_info as Partial<PixInfo> | null | undefined;
          const chave = info?.chave?.trim();
          setPixInfo(chave ? { chave, nome: info?.nome?.trim() || '', banco: info?.banco?.trim() || '' } : null);
          setWhatsapp(data?.chave_whatsapp?.trim() || null);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [churchId]);

  return { pixInfo, whatsapp, loading };
}
