import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type NotificationType = 'nova_escala' | 'lembrete' | 'status_alterado' | 'sistema' | 'ministerio' | 'aviso_admin' | 'escala';

export interface Notification {
  id: string;
  voluntario_id: string | null;
  escala_id: string | null;
  ministerio_id: string | null;
  tipo: NotificationType;
  titulo: string | null;
  mensagem: string;
  enviado_em: string | null;
  lido: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('voluntario_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as NotificationType
      }));

      setNotifications(typedData);
      setUnreadCount(typedData.filter((n) => !n.lido).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update - atualiza UI imediatamente
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, lido: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lido: true })
        .eq('id', notificationId);

      if (error) {
        // Reverter em caso de erro
        await fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Encontrar a notificação antes de remover para saber se era não lida
    const notification = notifications.find(n => n.id === notificationId);
    const wasUnread = notification?.lido === false;

    // Optimistic update - remove da UI imediatamente
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificationId);

      if (error) {
        // Reverter em caso de erro
        await fetchNotifications();
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [notifications, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return;

    // Optimistic update - marca todas como lidas na UI
    setNotifications((prev) => prev.map((n) => ({ ...n, lido: true })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lido: true })
        .eq('voluntario_id', profile.id)
        .eq('lido', false);

      if (error) {
        // Reverter em caso de erro
        await fetchNotifications();
        throw error;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [profile?.id, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notificacoes_changes_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `voluntario_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = {
              ...payload.new,
              tipo: payload.new.tipo as NotificationType,
            } as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else {
            // UPDATE (mark as read) or DELETE — refetch so all hook instances sync
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
