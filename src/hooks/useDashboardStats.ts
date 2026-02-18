import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  const documentsQuery = useQuery({
    queryKey: ['dashboard-documents-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const trainingsQuery = useQuery({
    queryKey: ['dashboard-trainings-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  return {
    documentsCount: documentsQuery.data ?? 0,
    trainingsCount: trainingsQuery.data ?? 0,
    isLoading: documentsQuery.isLoading || trainingsQuery.isLoading,
  };
}
