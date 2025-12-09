import { useEffect, useState } from 'react';
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

  const fetchNotifications = async () => {
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
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lido: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, lido: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lido: true })
        .eq('voluntario_id', profile.id)
        .eq('lido', false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, lido: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile?.id]);

  // Set up realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notificacoes_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `voluntario_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            tipo: payload.new.tipo as NotificationType
          } as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
