import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAllMilestones } from '@/hooks/useAllMilestones';
import { 
  FolderKanban, 
  FileText, 
  GraduationCap, 
  ArrowRight,
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, userRole } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const { documentsCount, trainingsCount } = useDashboardStats();
  const { data: milestones } = useAllMilestones();

  const upcomingMilestones = milestones
    ?.filter(m => m.status !== 'completed' && m.status !== 'cancelled')
    .slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'admin' 
              ? 'Gerencie os projetos e conteúdos dos seus clientes.'
              : 'Acesse seus projetos e materiais técnicos.'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projetos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                projetos disponíveis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentsCount}</div>
              <p className="text-xs text-muted-foreground">
                arquivos no total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Treinamentos</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingsCount}</div>
              <p className="text-xs text-muted-foreground">
                treinamentos disponíveis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Milestones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Próximos Compromissos
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/agenda">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length > 0 ? (
              <div className="space-y-3">
                {upcomingMilestones.map((m) => {
                  const date = new Date(m.due_date);
                  const isOverdue = isPast(date) && m.status !== 'completed';
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 text-center">
                        <span className="text-xs font-bold leading-tight">
                          {format(date, 'dd', { locale: ptBR })}
                          <br />
                          <span className="text-[9px] uppercase text-muted-foreground">{format(date, 'MMM', { locale: ptBR })}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.project_name}</p>
                      </div>
                      {isOverdue && <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>}
                      {isToday(date) && <Badge className="text-[10px] bg-primary">Hoje</Badge>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum compromisso pendente</p>
            )}
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Seus Projetos</h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <span className="truncate">{project.name}</span>
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {project.status === 'active' ? 'Ativo' : project.status}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projeto/${project.id}`}>
                          Acessar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">Nenhum projeto disponível</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  {userRole === 'admin' 
                    ? 'Crie um novo projeto para começar.'
                    : 'Entre em contato com a Smartest Solution para obter acesso a projetos.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
