import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOpenTicketsCount() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['open-tickets-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000, // refresh every 30s
  });
}
