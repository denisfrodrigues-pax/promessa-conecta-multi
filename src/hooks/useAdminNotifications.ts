import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

export function useAdminNotifications() {
  const { isAdmin, churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAdmin || !churchId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('lido', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching admin notifications count:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, churchId]);

  useEffect(() => {
    if (isAdmin && churchId) {
      fetchUnreadCount();
    }
  }, [isAdmin, churchId, fetchUnreadCount]);

  // Realtime subscription para atualizar badge quando notificações são criadas/atualizadas/deletadas
  useEffect(() => {
    if (!isAdmin || !churchId) return;

    const channel = supabase
      .channel('admin_notificacoes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `church_id=eq.${churchId}`,
        },
        () => {
          // Refetch count when any change happens
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, churchId, fetchUnreadCount]);

  // Função para decrementar manualmente o contador (para atualizações otimistas)
  const decrementUnread = useCallback((count: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  // Função para zerar o contador (quando marca todas como lidas)
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
    decrementUnread,
    clearUnread,
  };
}
