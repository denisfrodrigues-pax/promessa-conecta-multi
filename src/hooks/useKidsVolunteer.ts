import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para verificar se o usuário logado é voluntário do Ministério Kids
 * Usado para controlar acesso ao Check-in Kids no topbar.
 *
 * A tela de check-in só existe em /leader/:slug/checkin, atrás de um
 * PrivateRoute com allowedRoles=["lider","admin"] — não há rota alternativa
 * acessível por quem só tem o papel global "voluntario". Por isso, além de
 * checar o vínculo ativo em ministerio_usuarios, também exigimos que o
 * usuário tenha um dos papéis que passam por aquele guard; do contrário o
 * atalho apareceria para gente que seria redirecionada ao clicar nele.
 */
export function useKidsVolunteer() {
  const { user, churchId, roles } = useAuth();
  const [isKidsVolunteer, setIsKidsVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkKidsMinistry() {
      const canReachCheckinRoute = roles.includes('lider') || roles.includes('admin') || roles.includes('superadmin');
      if (!user || !churchId || !canReachCheckinRoute) {
        setIsKidsVolunteer(false);
        setLoading(false);
        return;
      }

      try {
        // Ministério Kids da igreja do usuário — tipo='mca' é o identificador estável
        // (slug/nome podem variar; ilike por nome misturaria igrejas na mesma consulta).
        const { data: ministerioKids, error: ministerioError } = await supabase
          .from('ministerios')
          .select('id')
          .eq('church_id', churchId)
          .eq('tipo', 'mca')
          .eq('ativo', true)
          .limit(1)
          .maybeSingle();

        if (ministerioError || !ministerioKids) {
          setIsKidsVolunteer(false);
          setLoading(false);
          return;
        }

        // Verificar se o usuário é voluntário ativo deste ministério
        const { data: voluntario, error: voluntarioError } = await supabase
          .from('ministerio_usuarios')
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
  }, [user, churchId, roles]);

  return { isKidsVolunteer, loading };
}
