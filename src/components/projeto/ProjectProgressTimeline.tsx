import { ProjectStage } from '@/hooks/useProjectStages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  Database, 
  Code, 
  TestTube, 
  Rocket,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectProgressTimelineProps {
  stages: ProjectStage[];
  isLoading?: boolean;
}

const stageIcons: Record<string, React.ElementType> = {
  'Levantamento': ClipboardList,
  'Modelagem': Database,
  'Desenvolvimento': Code,
  'Homologação': TestTube,
  'Produção': Rocket,
};

export function ProjectProgressTimeline({ stages, isLoading }: ProjectProgressTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!stages || stages.length === 0) {
    return null;
  }

  const completedCount = stages.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);
  const currentStage = stages.find(s => s.status === 'in_progress');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Progresso do Projeto</CardTitle>
          <span className="text-sm font-medium text-primary">{progressPercent}%</span>
        </div>
        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mt-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {currentStage && (
          <p className="text-sm text-muted-foreground mt-1">
            Etapa atual: <span className="font-medium text-foreground">{currentStage.stage_name}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative">
          {stages.map((stage, index) => {
            const Icon = stageIcons[stage.stage_name] || Circle;
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';
            const isPending = stage.status === 'pending';
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex gap-4 pb-6 last:pb-0">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      isInProgress && 'border-primary bg-accent text-primary animate-pulse',
                      isPending && 'border-muted-foreground/30 bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 min-h-[24px]',
                        isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      isCompleted && 'text-foreground',
                      isInProgress && 'text-primary font-semibold',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {stage.stage_name}
                  </p>
                  {stage.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.notes}</p>
                  )}
                  <div className="flex gap-3 mt-0.5">
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
