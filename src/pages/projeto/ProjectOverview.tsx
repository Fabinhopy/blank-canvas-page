import { useParams, Link } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useDocuments } from '@/hooks/useDocuments';
import { useVideos } from '@/hooks/useVideos';
import { useProjectStages } from '@/hooks/useProjectStages';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { useProjectAnnouncements } from '@/hooks/useProjectAnnouncements';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLinksSection } from '@/components/projeto/DashboardLinksSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, Database, Video, Settings, ArrowRight, Loader2, Calendar,
  BarChart3, CalendarDays, CheckCircle2, Clock, Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: documents } = useDocuments(id);
  const { data: videos } = useVideos(id);
  const { data: stages } = useProjectStages(id);
  const { data: milestones } = useProjectMilestones(id);
  const { data: announcements } = useProjectAnnouncements(id);

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <p className="text-muted-foreground mt-2">O projeto solicitado não existe ou você não tem permissão para acessá-lo.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const completedStages = stages?.filter(s => s.status === 'completed').length || 0;
  const totalStages = stages?.length || 1;
  const progressPercent = Math.round((completedStages / totalStages) * 100);
  const currentStage = stages?.find(s => s.status === 'in_progress');
  
  const upcomingMilestones = milestones
    ?.filter(m => m.status !== 'completed' && m.status !== 'cancelled')
    .slice(0, 3) || [];

  const quickLinks = [
    { title: 'Documentos', description: `${documents?.length || 0} arquivos`, icon: FileText, path: 'documentos' },
    { title: 'Modelagem', description: `${documents?.filter(d => d.document_type === 'data_modeling').length || 0} documentos`, icon: Database, path: 'modelagem' },
    { title: 'Treinamentos', description: `${videos?.length || 0} arquivos`, icon: Video, path: 'treinamentos' },
    { title: 'Configurações', description: 'Detalhes do projeto', icon: Settings, path: 'configuracoes' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Project Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className={`text-xs px-2 py-1 rounded-full ${
              project.status === 'active' 
                ? 'bg-success/10 text-success' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {project.status === 'active' ? 'Ativo' : project.status}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Criado em {format(new Date(project.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Progress, Agenda & Comunicados Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Progress Summary */}
          <Card className="hover:shadow-md transition-shadow group">
            <Link to={`/projeto/${id}/progresso`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Progresso
                  </CardTitle>
                  <span className="text-xl font-bold text-primary">{progressPercent}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mb-2">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
                {currentStage ? (
                  <p className="text-sm text-muted-foreground">
                    Etapa atual: <span className="font-medium text-foreground">{currentStage.stage_name}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{completedStages}/{totalStages} etapas concluídas</p>
                )}
                <div className="flex items-center text-primary text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Agenda Summary */}
          <Card className="hover:shadow-md transition-shadow group">
            <Link to={`/projeto/${id}/agenda`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Agenda
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{upcomingMilestones.length} próximos</span>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingMilestones.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMilestones.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        {m.status === 'in_progress' ? (
                          <Clock className="h-3.5 w-3.5 text-warning shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1">{m.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(m.due_date), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
                )}
                <div className="flex items-center text-primary text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver agenda <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Comunicados Summary */}
          <Card className="hover:shadow-md transition-shadow group">
            <Link to={`/projeto/${id}/comunicados`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    Comunicados
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{announcements?.length || 0} posts</span>
                </div>
              </CardHeader>
              <CardContent>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-2">
                    {announcements.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-sm">
                        <Megaphone className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                        <span className="truncate flex-1">{a.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(a.created_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum comunicado</p>
                )}
                <div className="flex items-center text-primary text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver comunicados <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Card key={item.path} className="hover:shadow-md transition-shadow cursor-pointer group">
              <Link to={`/projeto/${id}/${item.path}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center text-primary text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Dashboard Links */}
        <DashboardLinksSection projectId={id} />

        {/* Content Preview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Documentos Recentes</CardTitle>
                  <CardDescription>Últimos documentos adicionados</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/projeto/${id}/documentos`}>Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                      <FileText className="h-8 w-8 text-primary/70" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(doc.created_at), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento disponível</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Treinamentos Recentes</CardTitle>
                  <CardDescription>Últimos treinamentos adicionados</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/projeto/${id}/treinamentos`}>Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {videos && videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.slice(0, 3).map((video) => (
                    <div key={video.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                      <Video className="h-8 w-8 text-primary/70" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.name}</p>
                        <p className="text-xs text-muted-foreground">{video.theme || 'Sem tema definido'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum vídeo disponível</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
