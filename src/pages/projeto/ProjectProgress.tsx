import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useProjectStages } from '@/hooks/useProjectStages';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StageChecklist } from '@/components/projeto/StageChecklist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, Database, Code, TestTube, Rocket,
  CheckCircle2, Circle, Loader2, ArrowLeft, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const stageIcons: Record<string, React.ElementType> = {
  'Levantamento': ClipboardList,
  'Modelagem': Database,
  'Desenvolvimento': Code,
  'Homologação': TestTube,
  'Produção': Rocket,
};

export default function ProjectProgress() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: stages, isLoading } = useProjectStages(id);
  const { isAdmin } = useAuth();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const completedCount = stages?.filter(s => s.status === 'completed').length || 0;
  const totalCount = stages?.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const currentStage = stages?.find(s => s.status === 'in_progress');

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/projeto/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground mb-1">
              {project?.name || 'Carregando...'}
            </div>
            <h1 className="text-2xl font-bold text-foreground">Progresso do Projeto</h1>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Visão Geral</CardTitle>
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted mt-2">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {currentStage && (
              <p className="text-sm text-muted-foreground mt-2">
                Etapa atual: <span className="font-medium text-foreground">{currentStage.stage_name}</span>
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Stages */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stages && stages.length > 0 ? (
          <div className="space-y-3">
            {stages.map((stage) => {
              const Icon = stageIcons[stage.stage_name] || Circle;
              const isCompleted = stage.status === 'completed';
              const isInProgress = stage.status === 'in_progress';
              const isExpanded = expandedStage === stage.id;

              return (
                <Card 
                  key={stage.id} 
                  className={cn(
                    'transition-all cursor-pointer',
                    isInProgress && 'border-primary/50 shadow-md',
                    isCompleted && 'border-primary/30'
                  )}
                >
                  <CardHeader 
                    className="pb-2 cursor-pointer"
                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0',
                        isCompleted && 'border-primary bg-primary text-primary-foreground',
                        isInProgress && 'border-primary bg-accent text-primary',
                        !isCompleted && !isInProgress && 'border-muted-foreground/30 bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className={cn(
                            'text-base',
                            isInProgress && 'text-primary',
                            !isCompleted && !isInProgress && 'text-muted-foreground'
                          )}>
                            {stage.stage_name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              isCompleted && 'bg-primary/10 text-primary',
                              isInProgress && 'bg-warning/10 text-warning',
                              !isCompleted && !isInProgress && 'bg-muted text-muted-foreground'
                            )}>
                              {isCompleted ? 'Concluída' : isInProgress ? 'Em Andamento' : 'Pendente'}
                            </span>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        {stage.notes && (
                          <CardDescription className="mt-0.5">{stage.notes}</CardDescription>
                        )}
                        <div className="flex gap-3 mt-1">
                          {stage.started_at && (
                            <span className="text-xs text-muted-foreground">
                              Início: {format(new Date(stage.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {stage.completed_at && (
                            <span className="text-xs text-muted-foreground">
                              Concluído: {format(new Date(stage.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <StageChecklist stageId={stage.id} projectId={id!} isAdmin={isAdmin} />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma etapa cadastrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                As etapas do projeto ainda não foram configuradas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
