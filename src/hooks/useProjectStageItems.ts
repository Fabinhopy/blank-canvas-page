import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StageItemType = 'task' | 'development' | 'meeting' | 'review' | 'other';

export interface ProjectStageItem {
  id: string;
  stage_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  order_index: number;
  document_id: string | null;
  start_date: string | null;
  end_date: string | null;
  item_type: StageItemType;
  document?: { name: string; file_path: string } | null;
  created_at: string;
  updated_at: string;
}

export function useProjectStageItems(stageId: string | undefined) {
  return useQuery({
    queryKey: ['project-stage-items', stageId],
    queryFn: async (): Promise<ProjectStageItem[]> => {
      if (!stageId) return [];
      const { data, error } = await (supabase as any)
        .from('project_stage_items')
        .select('*, documents(name, file_path)')
        .eq('stage_id', stageId)
        .order('order_index');
      if (error) throw error;
      return (data as any[]).map((item: any) => ({
        ...item,
        document: item.documents || null,
      }));
    },
    enabled: !!stageId,
  });
}

export function useCreateStageItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: { stage_id: string; title: string; order_index?: number; item_type?: StageItemType }) => {
      const { error } = await (supabase as any)
        .from('project_stage_items')
        .insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stage-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-stage-items'] });
    },
  });
}

export function useUpdateStageItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProjectStageItem> }) => {
      const { error } = await (supabase as any)
        .from('project_stage_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stage-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-stage-items'] });
    },
  });
}

export function useDeleteStageItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('project_stage_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stage-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-stage-items'] });
    },
  });
}
