import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAdminNotifications() {
  const { isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUnreadCount();
    }
  }, [isAdmin]);

  const fetchUnreadCount = async () => {
    if (!isAdmin) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('lido', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching admin notifications count:', error);
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
