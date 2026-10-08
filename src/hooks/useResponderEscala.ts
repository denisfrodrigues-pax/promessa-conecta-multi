import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isDatePast } from '@/lib/dateUtils';

// Extraído de MinhasEscalas.tsx (confirmar/recusar a própria escala) pra ser
// reaproveitado em qualquer lugar que mostre "minha confirmação" — hoje
// MinhasEscalas.tsx e o "Detalhes da Escala" de admin/Escalas.tsx (este
// último embutido no painel de voluntário de todo ministério não-música via
// VolunteerMinisterioDashboard). Mesmas mensagens de toast e mesma forma de
// update de MinhasEscalas original — não muda o comportamento de lá.

interface UseResponderEscalaOptions {
  /** Chamado depois de um confirmar/recusar com sucesso — recarregar lista, ressincronizar diálogo aberto, etc. */
  onResponded?: () => void | Promise<void>;
}

export function useResponderEscala({ onResponded }: UseResponderEscalaOptions = {}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRecusing, setIsRecusing] = useState(false);

  const confirmar = async (escalaId: string): Promise<boolean> => {
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from('escalas')
        .update({ status: 'confirmado', confirmado_em: new Date().toISOString() })
        .eq('id', escalaId);

      if (error) throw error;
      toast.success('Escala confirmada com sucesso!');
      await onResponded?.();
      return true;
    } catch (err) {
      console.error('useResponderEscala.confirmar error:', err);
      toast.error('Erro ao confirmar escala');
      return false;
    } finally {
      setIsConfirming(false);
    }
  };

  const recusar = async (escalaId: string, justificativa: string): Promise<boolean> => {
    if (!justificativa.trim()) {
      toast.error('Informe uma justificativa');
      return false;
    }
    setIsRecusing(true);
    try {
      const { error } = await supabase
        .from('escalas')
        .update({ status: 'ausente', justificativa, confirmado_em: new Date().toISOString() })
        .eq('id', escalaId);

      if (error) throw error;
      toast.success('Resposta registrada');
      await onResponded?.();
      return true;
    } catch (err) {
      console.error('useResponderEscala.recusar error:', err);
      toast.error('Erro ao recusar escala');
      return false;
    } finally {
      setIsRecusing(false);
    }
  };

  return { confirmar, recusar, isConfirming, isRecusing, isSubmitting: isConfirming || isRecusing };
}

/**
 * Quem (dentre os voluntários de um grupo de escala) é o usuário logado, e se
 * ele pode confirmar/recusar agora — só quando é a própria linha, o status
 * está pendente e a data não já passou.
 *
 * Usa isDatePast (src/lib/dateUtils) em vez de `new Date(dataStr) < new Date(...)`
 * cru: esse padrão parseia 'YYYY-MM-DD' como UTC — pra quem está num fuso
 * atrás de UTC (Brasil, UTC-3), isso marca escalas de HOJE como "passadas"
 * já a partir de ~21h local, horas antes do evento de fato acontecer. Era
 * exatamente esse o bug em admin/Escalas.tsx: a escala de hoje à noite
 * escondia os botões de confirmar/recusar mais cedo do que devia.
 */
export function getMinhaConfirmacaoInfo<
  V extends { voluntario_id: string; status: string },
>(voluntarios: V[], myProfileId: string | null | undefined, dataEscala: string): { myEntry: V | null; podeResponder: boolean } {
  const myEntry = voluntarios.find((v) => v.voluntario_id === myProfileId) ?? null;
  if (!myEntry) return { myEntry: null, podeResponder: false };
  const podeResponder = myEntry.status === 'pendente' && !isDatePast(dataEscala);
  return { myEntry, podeResponder };
}
