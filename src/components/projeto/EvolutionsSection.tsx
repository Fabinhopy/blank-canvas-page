import { useState } from 'react';
import { useProjectEvolutions, useCreateEvolution, useDeleteEvolution, useEvolutionStages, useUpdateEvolutionStage, ProjectEvolution } from '@/hooks/useProjectEvolutions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, TrendingUp, Loader2, Calendar, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  isAdmin: boolean;
  projectCompleted: boolean;
}

export function EvolutionsSection({ projectId, isAdmin, projectCompleted }: Props) {
  const { data: evolutions, isLoading } = useProjectEvolutions(projectId);
  const createEvolution = useCreateEvolution();
  const deleteEvolution = useDeleteEvolution();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '' });

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Informe um título');
      return;
    }
    try {
      await createEvolution.mutateAsync({
        project_id: projectId,
        title: form.title,
        description: form.description,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      toast.success('Evolução criada com 5 etapas padrão');
      setForm({ title: '', description: '', start_date: '', end_date: '' });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evoluções
            </CardTitle>
            <CardDescription>
              Novas demandas após a produção. Cada evolução tem suas próprias 5 etapas.
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!projectCompleted}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Evolução
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Evolução</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Início</Label>
                      <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Término</Label>
                      <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={createEvolution.isPending}>
                    {createEvolution.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isAdmin && !projectCompleted && (
          <p className="text-xs text-muted-foreground mt-2">
            Evoluções só podem ser criadas após o projeto principal estar concluído (todas as 5 etapas).
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !evolutions || evolutions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma evolução cadastrada.
          </p>
        ) : (
          <div className="space-y-2">
            {evolutions.map(evo => (
              <EvolutionItem
                key={evo.id}
                evolution={evo}
                expanded={expanded === evo.id}
                onToggle={() => setExpanded(expanded === evo.id ? null : evo.id)}
                onDelete={async () => {
                  if (!confirm('Excluir esta evolução?')) return;
                  await deleteEvolution.mutateAsync(evo.id);
                  toast.success('Evolução excluída');
                }}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EvolutionItem({ evolution, expanded, onToggle, onDelete, isAdmin }: {
  evolution: ProjectEvolution;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const { data: stages } = useEvolutionStages(expanded ? evolution.id : undefined);
  const updateStage = useUpdateEvolutionStage();

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <TrendingUp className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{evolution.title}</div>
          {evolution.description && (
            <div className="text-xs text-muted-foreground truncate">{evolution.description}</div>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
            {evolution.start_date && (
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(evolution.start_date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
            )}
            {evolution.end_date && (
              <span>→ {format(new Date(evolution.end_date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
            )}
          </div>
        </div>
        <Badge variant="outline">{evolution.status}</Badge>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      {expanded && stages && (
        <div className="border-t p-3 space-y-2 bg-muted/30">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Etapas da Evolução</div>
          {stages.map((s) => {
            const isDone = s.status === 'completed';
            return (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="w-32">{s.order_index + 1}. {s.stage_name}</span>
                {isAdmin && (
                  <>
                    <Input
                      type="date"
                      className="h-7 text-xs w-36"
                      defaultValue={s.started_at ? new Date(s.started_at).toISOString().split('T')[0] : ''}
                      onBlur={(e) => updateStage.mutate({
                        id: s.id,
                        updates: { started_at: e.target.value ? new Date(e.target.value).toISOString() : null }
                      })}
                    />
                    <Input
                      type="date"
                      className="h-7 text-xs w-36"
                      defaultValue={s.completed_at ? new Date(s.completed_at).toISOString().split('T')[0] : ''}
                      onBlur={(e) => {
                        const v = e.target.value;
                        updateStage.mutate({
                          id: s.id,
                          updates: {
                            completed_at: v ? new Date(v).toISOString() : null,
                            status: v ? 'completed' : 'in_progress',
                          }
                        });
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Mini-Gantt */}
          {stages.some(s => s.started_at) && <EvolutionGantt stages={stages} />}
        </div>
      )}
    </div>
  );
}

function EvolutionGantt({ stages }: { stages: any[] }) {
  const dated = stages.filter(s => s.started_at);
  if (dated.length === 0) return null;
  const allDates = dated.flatMap(s => {
    const d = [new Date(s.started_at)];
    if (s.completed_at) d.push(new Date(s.completed_at));
    return d;
  });
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime()), Date.now()));
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);

  return (
    <div className="mt-3 space-y-1.5">
      <div className="text-xs font-semibold text-muted-foreground uppercase">Gantt</div>
      {stages.map(s => {
        if (!s.started_at) return null;
        const start = new Date(s.started_at);
        const end = s.completed_at ? new Date(s.completed_at) : new Date();
        const left = (differenceInDays(start, minDate) / totalDays) * 100;
        const width = Math.max((differenceInDays(end, start) / totalDays) * 100, 2);
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="w-28 text-xs truncate">{s.stage_name}</div>
            <div className="flex-1 h-5 bg-muted rounded relative">
              <div
                className={cn('absolute top-0.5 bottom-0.5 rounded',
                  s.status === 'completed' ? 'bg-primary' : 'bg-warning'
                )}
                style={{ left: `${left}%`, width: `${width}%`, minWidth: '6px' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
