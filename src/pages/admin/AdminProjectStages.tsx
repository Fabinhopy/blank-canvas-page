import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStages, useUpdateProjectStage, useCreateDefaultStages, ProjectStage } from '@/hooks/useProjectStages';
import { useProject } from '@/hooks/useProjects';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Loader2, 
  BarChart3,
  Plus,
  Save,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { ProjectProgressTimeline } from '@/components/projeto/ProjectProgressTimeline';

export default function AdminProjectStages() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { data: stages, isLoading } = useProjectStages(projectId);
  const updateStage = useUpdateProjectStage();
  const createDefaults = useCreateDefaultStages();
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const handleStatusChange = (stage: ProjectStage, newStatus: string) => {
    const updates: Partial<ProjectStage> = { status: newStatus as ProjectStage['status'] };
    
    if (newStatus === 'in_progress' && !stage.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (!stage.started_at) {
        updates.started_at = new Date().toISOString();
      }
    }
    if (newStatus === 'pending') {
      updates.started_at = null;
      updates.completed_at = null;
    }

    updateStage.mutate(
      { id: stage.id, updates },
      {
        onSuccess: () => toast.success(`Etapa "${stage.stage_name}" atualizada!`),
        onError: (err: Error) => toast.error('Erro: ' + err.message),
      }
    );
  };

  const handleSaveNotes = (stage: ProjectStage) => {
    const notes = editingNotes[stage.id];
    if (notes === undefined) return;

    updateStage.mutate(
      { id: stage.id, updates: { notes: notes || null } },
      {
        onSuccess: () => {
          toast.success('Observação salva!');
          setEditingNotes(prev => {
            const next = { ...prev };
            delete next[stage.id];
            return next;
          });
        },
        onError: (err: Error) => toast.error('Erro: ' + err.message),
      }
    );
  };

  const handleCreateDefaults = () => {
    if (!projectId) return;
    createDefaults.mutate(projectId, {
      onSuccess: () => toast.success('Etapas padrão criadas!'),
      onError: (err: Error) => toast.error('Erro: ' + err.message),
    });
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (status === 'in_progress') return <Clock className="h-4 w-4 text-warning" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/admin/empresas`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">
              {project?.name || 'Carregando...'}
            </div>
            <h1 className="text-2xl font-bold text-foreground">Etapas do Projeto</h1>
          </div>
        </div>

        {stages && stages.length > 0 && (
          <ProjectProgressTimeline stages={stages} />
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gerenciar Etapas
                </CardTitle>
                <CardDescription>
                  Atualize o status e observações de cada etapa do projeto. Inclui Evolução e Suporte pós-produção.
                </CardDescription>
              </div>
              {stages && stages.length === 0 && (
                <Button onClick={handleCreateDefaults} disabled={createDefaults.isPending}>
                  {createDefaults.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Etapas Padrão
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stages && stages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="w-[180px]">Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages.map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell className="text-muted-foreground">
                        {stage.order_index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(stage.status)}
                          <span className="font-medium">{stage.stage_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={stage.status}
                          onValueChange={(val) => handleStatusChange(stage, val)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          className="min-h-[36px] h-9 resize-none text-sm"
                          placeholder="Adicionar observação..."
                          value={editingNotes[stage.id] ?? stage.notes ?? ''}
                          onChange={(e) => setEditingNotes(prev => ({ ...prev, [stage.id]: e.target.value }))}
                          rows={1}
                        />
                      </TableCell>
                      <TableCell>
                        {editingNotes[stage.id] !== undefined && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveNotes(stage)}
                            disabled={updateStage.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma etapa cadastrada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Criar Etapas Padrão" para iniciar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
