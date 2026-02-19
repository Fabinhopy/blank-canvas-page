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
  admin_response: string | null;
  responded_at: string | null;
  responded_by: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: { full_name: string; avatar_url: string | null } | null;
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
        }));
      }

      return tickets;
    },
    enabled: !!user,
  });

  return ticketsQuery;
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, message, category, attachmentUrl }: { subject: string; message: string; category: string; attachmentUrl?: string | null }) => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .insert({ user_id: user?.id, subject, message, category, attachment_url: attachmentUrl || null } as any)
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
    mutationFn: async ({ ticketId, response }: { ticketId: string; response: string }) => {
      const { data, error } = await supabase
        .from('support_tickets' as any)
        .update({
          admin_response: response,
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
          status: 'answered',
          updated_at: new Date().toISOString(),
        } as any)
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
