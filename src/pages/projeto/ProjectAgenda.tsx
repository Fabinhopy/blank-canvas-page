import { useParams, Link } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectRoadmap } from '@/components/projeto/ProjectRoadmap';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProjectAgenda() {
  const { id } = useParams<{ id: string }>();
  const { data: project } = useProject(id);
  const { data: milestones, isLoading } = useProjectMilestones(id);

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
            <h1 className="text-2xl font-bold text-foreground">Agenda de Entregas</h1>
          </div>
        </div>

        <ProjectRoadmap milestones={milestones || []} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
