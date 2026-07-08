-- Adiciona a coluna role na tabela client_users se não existir
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Atualiza os registros existentes para 'admin' para manter retrocompatibilidade
UPDATE public.client_users SET role = 'admin' WHERE role IS NULL OR role = 'user';

-- Altera o default para 'user' (após atualizar os existentes)
ALTER TABLE public.client_users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE public.client_users ALTER COLUMN role SET NOT NULL;

-- Adiciona a restrição CHECK se não existir
ALTER TABLE public.client_users DROP CONSTRAINT IF EXISTS client_users_role_check;
ALTER TABLE public.client_users ADD CONSTRAINT client_users_role_check CHECK (role IN ('admin', 'user'));

-- Criação da tabela project_users para associar usuários comuns a projetos
CREATE TABLE IF NOT EXISTS public.project_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- Habilitar RLS em project_users
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;

-- Políticas para project_users
DROP POLICY IF EXISTS "Admins can manage project_users" ON public.project_users;
CREATE POLICY "Admins can manage project_users" ON public.project_users
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Client admins can manage project_users" ON public.project_users;
CREATE POLICY "Client admins can manage project_users" ON public.project_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.client_users cu ON cu.client_id = p.client_id
            WHERE p.id = project_users.project_id
              AND cu.user_id = auth.uid()
              AND cu.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.client_users cu ON cu.client_id = p.client_id
            WHERE p.id = project_users.project_id
              AND cu.user_id = auth.uid()
              AND cu.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view project_users" ON public.project_users;
CREATE POLICY "Users can view project_users" ON public.project_users
    FOR SELECT USING (
        public.user_has_project_access(project_id)
    );

-- Políticas adicionais para client_users (permitir gerenciamento por client admins)
DROP POLICY IF EXISTS "Client admins can manage client_users" ON public.client_users;
CREATE POLICY "Client admins can manage client_users" ON public.client_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.client_users admin_cu
            WHERE admin_cu.client_id = client_users.client_id
              AND admin_cu.user_id = auth.uid()
              AND admin_cu.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_users admin_cu
            WHERE admin_cu.client_id = client_users.client_id
              AND admin_cu.user_id = auth.uid()
              AND admin_cu.role = 'admin'
        )
    );

-- Políticas adicionais para profiles (leitura e escrita por client admins da mesma empresa)
DROP POLICY IF EXISTS "Users can view profiles of their company" ON public.profiles;
CREATE POLICY "Users can view profiles of their company" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_users cu1
            JOIN public.client_users cu2 ON cu1.client_id = cu2.client_id
            WHERE cu1.user_id = auth.uid()
              AND cu2.user_id = profiles.user_id
        )
    );

DROP POLICY IF EXISTS "Client admins can update profiles of their company" ON public.profiles;
CREATE POLICY "Client admins can update profiles of their company" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.client_users admin_cu
            JOIN public.client_users user_cu ON admin_cu.client_id = user_cu.client_id
            WHERE admin_cu.user_id = auth.uid()
              AND admin_cu.role = 'admin'
              AND user_cu.user_id = profiles.user_id
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_users admin_cu
            JOIN public.client_users user_cu ON admin_cu.client_id = user_cu.client_id
            WHERE admin_cu.user_id = auth.uid()
              AND admin_cu.role = 'admin'
              AND user_cu.user_id = profiles.user_id
        )
    );

-- Atualiza a política de SELECT em public.projects para restringir por associação
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
CREATE POLICY "Users can view their projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_users cu 
            WHERE cu.client_id = projects.client_id 
              AND cu.user_id = auth.uid() 
              AND cu.role = 'admin'
        ) OR EXISTS (
            SELECT 1 FROM public.project_users pu
            WHERE pu.project_id = projects.id 
              AND pu.user_id = auth.uid()
        ) OR public.is_admin()
    );

-- Redefine a função user_has_project_access para validar ambas as regras de acesso (admin de empresa e usuário de projeto)
CREATE OR REPLACE FUNCTION public.user_has_project_access(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        -- Acesso admin da empresa (visualiza tudo da empresa)
        SELECT 1 FROM public.projects p
        JOIN public.client_users cu ON cu.client_id = p.client_id
        WHERE p.id = _project_id 
          AND cu.user_id = auth.uid() 
          AND cu.role = 'admin'
    ) OR EXISTS (
        -- Acesso usuário da empresa (visualiza apenas projetos atribuídos)
        SELECT 1 FROM public.project_users pu
        WHERE pu.project_id = _project_id 
          AND pu.user_id = auth.uid()
    ) OR public.is_admin()
$$;

-- Atualiza a política de SELECT no storage.objects para o bucket 'documents'
DROP POLICY IF EXISTS "Users can view documents they have access to" ON storage.objects;
CREATE POLICY "Users can view documents they have access to" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'documents' AND (
            public.is_admin() OR 
            EXISTS (
                SELECT 1 FROM public.documents d
                WHERE d.file_path = storage.objects.name 
                  AND public.user_has_project_access(d.project_id)
            )
        )
    );
