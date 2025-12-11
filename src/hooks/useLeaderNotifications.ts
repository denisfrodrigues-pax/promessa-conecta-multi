import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useLeaderNotifications() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchUnreadCount();
    }
  }, [profile?.id]);

  const fetchUnreadCount = async () => {
    if (!profile?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // First get my ministry
      const { data: ministry } = await supabase
        .from('ministerios')
        .select('id')
        .eq('lider_id', profile.id)
        .maybeSingle();

      if (!ministry) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Get volunteers from my ministry
      const { data: volunteers } = await supabase
        .from('ministerio_voluntarios')
        .select('user_id')
        .eq('ministerio_id', ministry.id);

      if (!volunteers || volunteers.length === 0) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Get profile IDs for these volunteers
      const userIds = volunteers.map((v) => v.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('user_id', userIds);

      if (!profiles || profiles.length === 0) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const profileIds = profiles.map((p) => p.id);

      // Count unread notifications
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .in('voluntario_id', profileIds)
        .eq('lido', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching leader notifications count:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
