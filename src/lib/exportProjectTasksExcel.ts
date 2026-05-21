import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

function fmt(d: string | null | undefined): string {
  if (!d) return '';
  try { return format(new Date(d.length <= 10 ? d + 'T00:00:00' : d), 'dd/MM/yyyy HH:mm'); } catch { return d as string; }
}

const TYPE_LABEL: Record<string, string> = {
  task: 'Tarefa',
  development: 'Desenvolvimento',
  meeting: 'Reunião',
  review: 'Revisão',
  other: 'Outro',
};

/** Export a single-sheet .xlsx with all project tasks + support tickets in one big table. */
export async function exportProjectTasksExcel(projectId: string) {
  const [proj, stages, items, milestones, tickets] = await Promise.all([
    (supabase as any).from('projects').select('id,name').eq('id', projectId).single(),
    (supabase as any).from('project_stages').select('id,stage_name,order_index,status').eq('project_id', projectId),
    (supabase as any).from('project_stage_items')
      .select('*, project_stages!inner(project_id, stage_name, order_index)')
      .eq('project_stages.project_id', projectId),
    (supabase as any).from('project_milestones').select('*').eq('project_id', projectId),
    (supabase as any).from('support_tickets').select('*').eq('project_id', projectId),
  ]);

  if (proj.error) throw proj.error;
  const projectName = proj.data.name;

  type Row = Record<string, any>;
  const rows: Row[] = [];

  (items.data || []).forEach((i: any) => {
    rows.push({
      'Projeto': projectName,
      'Vínculo': 'Projeto',
      'Origem': 'Checklist / Etapa',
      'Etapa': i.project_stages?.stage_name || '',
      'Título / Assunto': i.title,
      'Tipo': TYPE_LABEL[i.item_type] || i.item_type || 'Tarefa',
      'Prioridade': '',
      'Status': i.is_completed ? 'Concluído' : 'Pendente',
      'Início': fmt(i.start_date),
      'Fim / Prazo': fmt(i.end_date),
      'Concluído em': fmt(i.completed_at),
      'Categoria': '',
      'Observação / Resposta': '',
      'Criado em': fmt(i.created_at),
    });
  });

  (milestones.data || []).forEach((m: any) => {
    rows.push({
      'Projeto': projectName,
      'Vínculo': 'Projeto',
      'Origem': 'Agenda',
      'Etapa': '',
      'Título / Assunto': m.title,
      'Tipo': m.milestone_type || '',
      'Prioridade': '',
      'Status': m.status || '',
      'Início': '',
      'Fim / Prazo': fmt(m.due_date),
      'Concluído em': '',
      'Categoria': m.recurrence || '',
      'Observação / Resposta': m.description || '',
      'Criado em': fmt(m.created_at),
    });
  });

  (tickets.data || []).forEach((t: any) => {
    rows.push({
      'Projeto': projectName,
      'Vínculo': t.project_id ? 'Projeto' : 'Tarefa avulsa',
      'Origem': 'Suporte',
      'Etapa': '',
      'Título / Assunto': t.subject,
      'Tipo': TYPE_LABEL[t.ticket_type] || t.ticket_type || '',
      'Prioridade': t.priority || '',
      'Status': t.status || '',
      'Início': fmt(t.start_at || t.start_date),
      'Fim / Prazo': fmt(t.end_at || t.end_date),
      'Concluído em': fmt(t.responded_at),
      'Categoria': t.category || '',
      'Observação / Resposta': t.resolution_notes || t.admin_response || t.message || '',
      'Criado em': fmt(t.created_at),
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([['(sem registros)']]);
  XLSX.utils.book_append_sheet(wb, ws, 'Tarefas & Suporte');

  const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}-tarefas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
