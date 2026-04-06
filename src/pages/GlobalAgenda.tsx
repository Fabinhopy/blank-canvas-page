import { AppLayout } from '@/components/layout/AppLayout';
import { useAllMilestones } from '@/hooks/useAllMilestones';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, CheckCircle2, Circle, Loader2, FolderKanban } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground', icon: Circle },
  in_progress: { label: 'Em andamento', color: 'bg-warning/10 text-warning', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive', icon: Circle },
};

const typeLabels: Record<string, string> = {
  entrega: '📦 Entrega',
  reuniao: '🤝 Reunião',
  marco: '🏁 Marco',
};

export default function GlobalAgenda() {
  const { data: milestones, isLoading } = useAllMilestones();

  const upcoming = milestones?.filter(m => m.status !== 'completed' && m.status !== 'cancelled') || [];
  const completed = milestones?.filter(m => m.status === 'completed') || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Geral</h1>
          <p className="text-muted-foreground mt-1">Todos os compromissos de todos os projetos</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Upcoming */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Próximos compromissos</h2>
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((m) => {
                    const cfg = statusConfig[m.status] || statusConfig.pending;
                    const date = new Date(m.due_date);
                    const isOverdue = isPast(date) && m.status !== 'completed';

                    return (
                      <Card key={m.id} className={cn(
                        'transition-all',
                        isToday(date) && 'border-primary/50 shadow-md',
                        isOverdue && 'border-destructive/50'
                      )}>
                        <CardContent className="flex items-center gap-4 py-4">
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-lg shrink-0 text-lg',
                            isToday(date) ? 'bg-primary/10' : 'bg-muted'
                          )}>
                            <span className="font-bold text-sm">
                              {format(date, 'dd', { locale: ptBR })}
                              <br />
                              <span className="text-[10px] uppercase">{format(date, 'MMM', { locale: ptBR })}</span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{m.title}</span>
                              {isOverdue && <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>}
                              {isToday(date) && <Badge className="text-[10px] bg-primary">Hoje</Badge>}
                              {isTomorrow(date) && <Badge variant="secondary" className="text-[10px]">Amanhã</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <FolderKanban className="h-3 w-3" />
                                {m.project_name}
                              </span>
                              <span className="text-xs text-muted-foreground">{typeLabels[m.milestone_type] || m.milestone_type}</span>
                            </div>
                            {m.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.description}</p>
                            )}
                          </div>
                          <Badge className={cn('shrink-0', cfg.color)}>{cfg.label}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum compromisso pendente</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Concluídos</h2>
                <div className="space-y-2">
                  {completed.slice(0, 10).map((m) => (
                    <Card key={m.id} className="opacity-60">
                      <CardContent className="flex items-center gap-4 py-3">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium line-through">{m.title}</span>
                          <span className="text-xs text-muted-foreground ml-2">{m.project_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
