import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupportTickets, useCreateTicket, useRespondTicket, SupportTicket } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageSquarePlus,
  Clock,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Send,
  Loader2,
  Inbox,
  MessageSquare,
  ImagePlus,
  X,
} from 'lucide-react';

const categoryLabels: Record<string, { label: string; icon: typeof HelpCircle }> = {
  question: { label: 'Pergunta', icon: HelpCircle },
  suggestion: { label: 'Sugestão', icon: Lightbulb },
  problem: { label: 'Problema', icon: AlertCircle },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Aberto', variant: 'default' },
  answered: { label: 'Respondido', variant: 'secondary' },
  closed: { label: 'Fechado', variant: 'outline' },
};

export default function Support() {
  const { isAdmin } = useAuth();
  const { data: tickets, isLoading } = useSupportTickets();
  const createTicket = useCreateTicket();
  const respondTicket = useRespondTicket();

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('question');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
        return;
      }
      if (file.size > 10485760) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB.', variant: 'destructive' });
        return;
      }
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      let attachmentUrl: string | null = null;

      if (attachmentFile) {
        const sanitizedName = attachmentFile.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `support/${Date.now()}-${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, attachmentFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        attachmentUrl = filePath;
      }

      await createTicket.mutateAsync({ subject, message, category, attachmentUrl });
      toast({ title: 'Ticket enviado!', description: 'Sua solicitação foi registrada com sucesso.' });
      setSubject('');
      setMessage('');
      setCategory('question');
      removeAttachment();
      setShowForm(false);
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !adminResponse.trim()) return;

    try {
      await respondTicket.mutateAsync({ ticketId: selectedTicket.id, response: adminResponse });
      toast({ title: 'Resposta enviada!' });
      setAdminResponse('');
      setSelectedTicket(null);
    } catch {
      toast({ title: 'Erro ao responder', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isAdmin ? 'Central de Suporte' : 'Suporte'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? 'Gerencie os chamados dos clientes' : 'Envie suas dúvidas e sugestões'}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Novo Chamado
            </Button>
          )}
        </div>

        {/* New Ticket Form (client only) */}
        {!isAdmin && showForm && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Novo Chamado</CardTitle>
              <CardDescription>Preencha os campos abaixo para enviar sua solicitação</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Assunto</label>
                    <Input
                      placeholder="Descreva brevemente..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Categoria</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question">❓ Pergunta</SelectItem>
                        <SelectItem value="suggestion">💡 Sugestão</SelectItem>
                        <SelectItem value="problem">⚠️ Problema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mensagem</label>
                  <Textarea
                    placeholder="Descreva sua dúvida, sugestão ou problema em detalhes..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Anexar Imagem (opcional)</label>
                  {attachmentPreview ? (
                    <div className="relative inline-block">
                      <img src={attachmentPreview} alt="Preview" className="max-h-32 rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeAttachment}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed rounded-lg p-3">
                      <ImagePlus className="h-5 w-5" />
                      <span>Clique para selecionar uma imagem</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAttachmentChange} />
                    </label>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTicket.isPending} className="gap-2">
                    {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum chamado ainda</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isAdmin
                  ? 'Nenhum cliente enviou chamados por enquanto.'
                  : 'Clique em "Novo Chamado" para enviar sua primeira solicitação.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const cat = categoryLabels[ticket.category] || categoryLabels.question;
              const status = statusLabels[ticket.status] || statusLabels.open;
              const CatIcon = cat.icon;

              return (
                <Dialog key={ticket.id} onOpenChange={async (open) => {
                  if (open) {
                    setSelectedTicket(ticket);
                    setAdminResponse(ticket.admin_response || '');
                    // Load attachment image if exists
                    if (ticket.attachment_url) {
                      const { data } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(ticket.attachment_url, 3600);
                      setTicketImageUrl(data?.signedUrl || null);
                    } else {
                      setTicketImageUrl(null);
                    }
                  } else {
                    setSelectedTicket(null);
                    setAdminResponse('');
                    setTicketImageUrl(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <CatIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                                <Badge variant={status.variant} className="text-xs shrink-0">
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{ticket.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(ticket.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                {isAdmin && ticket.profiles && (
                                  <span>por {(ticket.profiles as any)?.full_name || 'Usuário'}</span>
                                )}
                                {ticket.status === 'answered' && (
                                  <span className="flex items-center gap-1 text-success">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Respondido
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CatIcon className="h-5 w-5 text-primary" />
                        {ticket.subject}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant="outline">{cat.label}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {isAdmin && ticket.profiles && (
                        <p className="text-sm text-muted-foreground">
                          Enviado por: <strong>{(ticket.profiles as any)?.full_name}</strong>
                        </p>
                      )}

                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {ticketImageUrl && (
                        <div className="rounded-lg overflow-hidden border">
                          <img src={ticketImageUrl} alt="Anexo" className="max-h-64 w-auto object-contain" />
                        </div>
                      )}

                      {ticket.admin_response && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Resposta da equipe
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.admin_response}</p>
                          {ticket.responded_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(ticket.responded_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="space-y-3 border-t pt-4">
                          <label className="text-sm font-medium text-foreground">Responder</label>
                          <Textarea
                            placeholder="Escreva a resposta para o cliente..."
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            rows={3}
                          />
                          <Button
                            onClick={handleRespond}
                            disabled={respondTicket.isPending || !adminResponse.trim()}
                            className="w-full gap-2"
                          >
                            {respondTicket.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Enviar Resposta
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
