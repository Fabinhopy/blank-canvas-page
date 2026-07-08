import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Users,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  FolderKanban,
  UserCheck,
  ShieldCheck,
  User,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyUser {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  profile?: {
    full_name: string;
  };
  assignedProjectsCount?: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function CompanyUsers() {
  const { userCompanyId } = useAuth();
  const queryClient = useQueryClient();

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user' as 'admin' | 'user',
  });
  const [editForm, setEditForm] = useState({
    fullName: '',
    role: 'admin' as 'admin' | 'user',
  });

  // State to track project assignments for the selected user in the dialog
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  // 1. Fetch Company Users
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['company-users', userCompanyId],
    enabled: !!userCompanyId,
    queryFn: async () => {
      const { data: clientUsers, error: cuError } = await supabase
        .from('client_users')
        .select('id, user_id, role, created_at')
        .eq('client_id', userCompanyId);

      if (cuError) throw cuError;

      const usersWithProfiles = await Promise.all(
        clientUsers.map(async (cu) => {
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', cu.user_id)
            .single();

          // Fetch count of assigned projects
          const { count } = await supabase
            .from('project_users')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', cu.user_id);

          return {
            id: cu.id,
            user_id: cu.user_id,
            role: cu.role as 'admin' | 'user',
            created_at: cu.created_at,
            profile: profile ? { full_name: profile.full_name } : undefined,
            assignedProjectsCount: count || 0,
          };
        })
      );

      return usersWithProfiles as CompanyUser[];
    },
  });

  // 2. Fetch Company Projects
  const { data: projects } = useQuery({
    queryKey: ['company-projects', userCompanyId],
    enabled: !!userCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('client_id', userCompanyId)
        .order('name');

      if (error) throw error;
      return data as Project[];
    },
  });

  // Mutations
  // A. Create User (via Edge Function)
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const { data: result, error } = await supabase.functions.invoke('create-client-user', {
        body: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          clientId: userCompanyId,
          role: data.role,
        },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', userCompanyId] });
      toast.success('Usuário criado com sucesso!');
      setIsCreateOpen(false);
      setCreateForm({ email: '', password: '', fullName: '', role: 'user' });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  // B. Update User Profile and Role
  const updateUserMutation = useMutation({
    mutationFn: async (data: { clientUserId: string; userId: string; fullName: string; role: 'admin' | 'user' }) => {
      // 1. Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('user_id', data.userId);

      if (profileError) throw profileError;

      // 2. Update role in client_users
      const { error: cuError } = await supabase
        .from('client_users')
        .update({ role: data.role })
        .eq('id', data.clientUserId);

      if (cuError) throw cuError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', userCompanyId] });
      toast.success('Usuário atualizado com sucesso!');
      setIsEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    },
  });

  // C. Delete User (Remove association from client)
  const deleteUserMutation = useMutation({
    mutationFn: async (clientUserId: string) => {
      const { error } = await supabase
        .from('client_users')
        .delete()
        .eq('id', clientUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', userCompanyId] });
      toast.success('Usuário removido da empresa com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover usuário: ' + error.message);
    },
  });

  // D. Update Project Assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async ({ userId, projectIds }: { userId: string; projectIds: string[] }) => {
      // 1. Get current database assignments
      const { data: currentAssignments, error: getError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', userId);

      if (getError) throw getError;

      const currentIds = currentAssignments?.map(a => a.project_id) || [];

      // 2. Determine which to add and which to remove
      const toAdd = projectIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !projectIds.includes(id));

      // 3. Add new assignments
      if (toAdd.length > 0) {
        const insertRows = toAdd.map(projId => ({
          project_id: projId,
          user_id: userId,
        }));
        const { error: insertError } = await supabase
          .from('project_users')
          .insert(insertRows);
        
        if (insertError) throw insertError;
      }

      // 4. Remove assignments
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('project_users')
          .delete()
          .eq('user_id', userId)
          .in('project_id', toRemove);

        if (deleteError) throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', userCompanyId] });
      toast.success('Atribuição de projetos atualizada!');
      setIsProjectsOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar atribuições: ' + error.message);
    },
  });

  // Dialog Handlers
  const handleOpenEdit = (user: CompanyUser) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.profile?.full_name || '',
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const handleOpenProjects = async (user: CompanyUser) => {
    setSelectedUser(user);
    setIsProjectsOpen(true);
    setAssignedProjectIds([]);

    // Fetch current user assignments from db
    const { data, error } = await supabase
      .from('project_users')
      .select('project_id')
      .eq('user_id', user.user_id);

    if (!error && data) {
      setAssignedProjectIds(data.map(d => d.project_id));
    }
  };

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    setAssignedProjectIds(prev => 
      checked 
        ? [...prev, projectId] 
        : prev.filter(id => id !== projectId)
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.password.trim() || !createForm.fullName.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      toast.error('Nome completo é obrigatório.');
      return;
    }
    if (selectedUser) {
      updateUserMutation.mutate({
        clientUserId: selectedUser.id,
        userId: selectedUser.user_id,
        fullName: editForm.fullName,
        role: editForm.role,
      });
    }
  };

  const handleProjectsSubmit = () => {
    if (selectedUser) {
      updateAssignmentsMutation.mutate({
        userId: selectedUser.user_id,
        projectIds: assignedProjectIds,
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in p-1 md:p-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground">
              Crie, edite e configure as permissões de acesso dos colaboradores da sua empresa.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Users Card */}
        <Card className="border border-border/40 shadow-sm bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              Lista de Colaboradores
            </CardTitle>
            <CardDescription>
              Administradores visualizam todos os projetos. Usuários comuns visualizam apenas os projetos atribuídos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Carregando usuários...</p>
              </div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nome</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Projetos Atribuídos</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          {u.profile?.full_name || 'Sem nome'}
                        </TableCell>
                        <TableCell>
                          {u.role === 'admin' ? (
                            <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 flex w-fit items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Administrador
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border flex w-fit items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              Usuário
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.role === 'admin' ? (
                            <span className="text-xs text-indigo-400 font-medium">Acesso Total</span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenProjects(u)}
                              className="text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
                            >
                              <FolderKanban className="h-3.5 w-3.5" />
                              {u.assignedProjectsCount === 0
                                ? 'Nenhum projeto'
                                : u.assignedProjectsCount === 1
                                ? '1 projeto'
                                : `${u.assignedProjectsCount} projetos`}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(u)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(`Deseja realmente remover o acesso de ${u.profile?.full_name || 'este usuário'} da empresa?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-lg bg-muted/10">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Nenhum usuário cadastrado</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Adicione colaboradores para que eles possam acompanhar e gerenciar projetos.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="mt-4">
                  Adicionar Primeiro Usuário
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOG 1: Create User */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie as credenciais e defina o nível de acesso do colaborador. Ele receberá acesso imediato.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha de Acesso *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Permissão</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(val: 'admin' | 'user') => setCreateForm({ ...createForm, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário Comum (Visualização de projetos selecionados)</SelectItem>
                      <SelectItem value="admin">Administrador (Visualização de todos os projetos da empresa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cadastrar Usuário
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: Edit User */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize o nome e as permissões organizacionais do colaborador.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editFullName">Nome Completo</Label>
                  <Input
                    id="editFullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRole">Nível de Permissão</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(val: 'admin' | 'user') => setEditForm({ ...editForm, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário Comum (Apenas projetos específicos)</SelectItem>
                      <SelectItem value="admin">Administrador (Todos os projetos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: Manage Project Assignments */}
        <Dialog open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Atribuir Projetos
              </DialogTitle>
              <DialogDescription>
                Selecione os projetos que <strong>{selectedUser?.profile?.full_name}</strong> terá permissão para visualizar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {projects && projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={assignedProjectIds.includes(project.id)}
                        onCheckedChange={(checked) => handleProjectToggle(project.id, !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`project-${project.id}`}
                          className="text-sm font-semibold text-foreground cursor-pointer"
                        >
                          {project.name}
                        </Label>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado nesta empresa.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProjectsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleProjectsSubmit} disabled={updateAssignmentsMutation.isPending}>
                {updateAssignmentsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Atribuições
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
