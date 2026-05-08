import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  admin_response: string | null;
  responded_at: string | null;
  responded_by: string | null;
  attachment_url: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: { full_name: string; avatar_url: string | null } | null;
  project_name?: string | null;
}

export function useSupportTickets() {
  const { user, isAdmin } = useAuth();

  const ticketsQuery = useQuery({
    queryKey: ['support-tickets', isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      const tickets = (data || []) as unknown as SupportTicket[];

      // Fetch project names for tickets with project_id
      const projectIds = [...new Set(tickets.filter(t => t.project_id).map(t => t.project_id!))];
      let projectMap = new Map<string, string>();
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        projectMap = new Map((projects || []).map(p => [p.id, p.name]));
      }

      // For admin, fetch profile names for each unique user_id
      if (isAdmin && tickets.length > 0) {
        const userIds = [...new Set(tickets.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        return tickets.map(t => ({
          ...t,
          profiles: profileMap.get(t.user_id) || null,
          project_name: t.project_id ? projectMap.get(t.project_id) || null : null,
        }));
      }

      return tickets.map(t => ({
        ...t,
        project_name: t.project_id ? projectMap.get(t.project_id) || null : null,
      }));
    },
    enabled: !!user,
  });

  return ticketsQuery;
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, message, category, attachmentUrl, projectId, priority, startDate }: { subject: string; message: string; category: string; attachmentUrl?: string | null; projectId?: string | null; priority?: string; startDate?: string | null }) => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .insert({
          user_id: user?.id,
          subject, message, category,
          attachment_url: attachmentUrl || null,
          project_id: projectId || null,
          priority: priority || 'medium',
          start_date: startDate || new Date().toISOString().split('T')[0],
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useRespondTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ticketId, response, endDate, status, priority }: { ticketId: string; response?: string; endDate?: string | null; status?: string; priority?: string }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (response !== undefined) {
        updates.admin_response = response;
        updates.responded_at = new Date().toISOString();
        updates.responded_by = user?.id;
        updates.status = status || 'answered';
      }
      if (endDate !== undefined) updates.end_date = endDate;
      if (status !== undefined) updates.status = status;
      if (priority !== undefined) updates.priority = priority;

      const { data, error } = await supabase
        .from('support_tickets' as any)
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
