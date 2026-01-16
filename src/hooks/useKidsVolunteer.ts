import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para verificar se o usuário logado é voluntário do Ministério Kids
 * Usado para controlar acesso ao Check-in Kids no topbar
 */
export function useKidsVolunteer() {
  const { user, profile } = useAuth();
  const [isKidsVolunteer, setIsKidsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkKidsMinistry() {
      if (!user) {
        setIsKidsVolunteer(false);
        setLoading(false);
        return;
      }

      try {
        // Buscar o ministério Kids pelo nome
        const { data: ministerioKids, error: ministerioError } = await supabase
          .from('ministerios')
          .select('id')
          .ilike('nome', '%kids%')
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();

        if (ministerioError || !ministerioKids) {
          setIsKidsVolunteer(false);
          setLoading(false);
          return;
        }

        // Verificar se o usuário é voluntário deste ministério
        const { data: voluntario, error: voluntarioError } = await supabase
          .from('ministerio_voluntarios')
          .select('id')
          .eq('ministerio_id', ministerioKids.id)
          .eq('user_id', user.id)
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();

        if (voluntarioError) {
          console.error('Erro ao verificar voluntário Kids:', voluntarioError);
          setIsKidsVolunteer(false);
        } else {
          setIsKidsVolunteer(!!voluntario);
        }
      } catch (error) {
        console.error('Erro ao verificar ministério Kids:', error);
        setIsKidsVolunteer(false);
      } finally {
        setLoading(false);
      }
    }

    checkKidsMinistry();
  }, [user]);

  return { isKidsVolunteer, loading };
}
