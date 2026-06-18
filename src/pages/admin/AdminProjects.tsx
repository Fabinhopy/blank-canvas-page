import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderKanban,
  Loader2,
  Building2,
  FileUp,
  GraduationCap,
  BarChart3,
  CalendarDays,
  Search,
  X,
} from 'lucide-react';

interface ProjectWithClient {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  project_type: 'bi' | 'automation' | 'sql' | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  client_id: string;
  clients: { name: string } | null;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  bi: 'BI',
  automation: 'Automação',
  sql: 'SQL',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  archived: 'Arquivado',
};

export default function AdminProjects() {
  const [clientFilter, setClientFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['all-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .order('name');
      
      if (error) throw error;
      return data as unknown as ProjectWithClient[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter((project) => {
      const matchesClient = clientFilter === 'all' || project.client_id === clientFilter;
      const matchesSearch = !searchQuery || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesClient && matchesSearch;
    });
  }, [projects, clientFilter, searchQuery]);

  const clearFilters = () => {
    setClientFilter('all');
    setSearchQuery('');
  };

  const hasFilters = clientFilter !== 'all' || searchQuery !== '';

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie todos os projetos de todos os clientes.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="sm:w-64">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
            {hasFilters && (
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Listagem de Projetos
            </CardTitle>
            <CardDescription>
              Todos os projetos cadastrados no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{project.clients?.name || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          project.project_type === 'automation'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : project.project_type === 'sql'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {PROJECT_TYPE_LABELS[project.project_type || 'bi']}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {project.description || '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'active' 
                            ? 'bg-success/10 text-success' 
                            : project.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {STATUS_LABELS[project.status || 'active']}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(project.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild title="Documentos">
                            <Link to={`/admin/projetos/${project.id}/documentos`}>
                              <FileUp className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Treinamentos">
                            <Link to={`/admin/projetos/${project.id}/treinamentos`}>
                              <GraduationCap className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Etapas do Projeto">
                            <Link to={`/admin/projetos/${project.id}/etapas`}>
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Agenda">
                            <Link to={`/admin/projetos/${project.id}/agenda`}>
                              <CalendarDays className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {hasFilters ? 'Nenhum projeto encontrado com os filtros aplicados.' : 'Nenhum projeto cadastrado.'}
                </p>
                {hasFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
