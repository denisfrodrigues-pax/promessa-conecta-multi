import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Retorna o churchId do usuário autenticado.
 * Se o usuário não tiver uma igreja associada após o carregamento, redireciona
 * para /onboarding para que ele configure sua igreja.
 */
export function useIgreja() {
  const { churchId, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && churchId === null) {
      navigate('/onboarding', { replace: true });
    }
  }, [churchId, loading, navigate]);

  return {
    /** UUID da igreja do usuário. Vazio enquanto loading ou null (redireciona). */
    churchId: churchId ?? '',
    loading,
  };
}
