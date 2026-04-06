import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  milestone_type: string;
  due_date: string;
  status: string;
  created_at: string;
  project_name?: string;
}

export function useAllMilestones() {
  return useQuery({
    queryKey: ['all-milestones'],
    queryFn: async (): Promise<GlobalMilestone[]> => {
      const { data, error } = await (supabase as any)
        .from('project_milestones')
        .select('*, projects(name)')
        .order('due_date');
      if (error) throw error;
      return (data as any[]).map((m: any) => ({
        ...m,
        project_name: m.projects?.name || 'Projeto',
      }));
    },
  });
}
