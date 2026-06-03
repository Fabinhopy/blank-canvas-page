import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgendaEvent {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  kind: 'start' | 'end';
  source: 'progress' | 'evolution';
  item_type: string;
  stage_name: string;
  project_id: string;
  project_name: string;
  is_completed: boolean;
}

function buildEvents(
  rows: any[],
  source: 'progress' | 'evolution',
  stageKey: string,
): AgendaEvent[] {
  const out: AgendaEvent[] = [];
  for (const it of rows || []) {
    if (it.item_type === 'support') continue;
    const stage = it[stageKey];
    if (!stage) continue;
    // For evolution: stage -> project_evolutions -> projects
    const projectInfo =
      source === 'evolution'
        ? stage?.project_evolutions?.projects
        : stage?.projects;
    const projectId =
      source === 'evolution'
        ? stage?.project_evolutions?.project_id
        : stage?.project_id;
    if (!projectId) continue;
    const base = {
      id: it.id,
      title: it.title as string,
      source,
      item_type: it.item_type as string,
      stage_name: stage.stage_name as string,
      project_id: projectId as string,
      project_name: (projectInfo?.name as string) || 'Projeto',
      is_completed: !!it.is_completed,
    };
    if (it.start_date) {
      out.push({ ...base, date: it.start_date, kind: 'start' });
    }
    if (it.end_date) {
      out.push({ ...base, date: it.end_date, kind: 'end' });
    }
  }
  return out;
}

async function fetchProgressEvents(projectId?: string): Promise<AgendaEvent[]> {
  let q = (supabase as any)
    .from('project_stage_items')
    .select(
      'id, title, item_type, is_completed, start_date, end_date, project_stages!inner(stage_name, project_id, projects(name))'
    )
    .or('start_date.not.is.null,end_date.not.is.null');
  if (projectId) q = q.eq('project_stages.project_id', projectId);
  const { data, error } = await q;
  if (error) throw error;
  return buildEvents(data as any[], 'progress', 'project_stages');
}

async function fetchEvolutionEvents(projectId?: string): Promise<AgendaEvent[]> {
  let q = (supabase as any)
    .from('evolution_stage_items')
    .select(
      'id, title, item_type, is_completed, start_date, end_date, evolution_stages!inner(stage_name, project_evolutions!inner(project_id, projects(name)))'
    )
    .or('start_date.not.is.null,end_date.not.is.null');
  if (projectId) q = q.eq('evolution_stages.project_evolutions.project_id', projectId);
  const { data, error } = await q;
  if (error) throw error;
  return buildEvents(data as any[], 'evolution', 'evolution_stages');
}

export function useProjectAgendaEvents(projectId: string | undefined) {
  return useQuery({
    queryKey: ['agenda-events', projectId],
    queryFn: async (): Promise<AgendaEvent[]> => {
      if (!projectId) return [];
      const [a, b] = await Promise.all([
        fetchProgressEvents(projectId),
        fetchEvolutionEvents(projectId),
      ]);
      return [...a, ...b];
    },
    enabled: !!projectId,
  });
}

export function useAllAgendaEvents() {
  return useQuery({
    queryKey: ['agenda-events', 'all'],
    queryFn: async (): Promise<AgendaEvent[]> => {
      const [a, b] = await Promise.all([
        fetchProgressEvents(),
        fetchEvolutionEvents(),
      ]);
      return [...a, ...b];
    },
  });
}
