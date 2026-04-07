## Changes

### 1. DB Migration
- Add `recurrence` column (text, nullable) to `project_milestones` — values: null (one-time), 'weekly', 'monthly'

### 2. Sidebar Cleanup
- Remove Comunicados, Versões, Configurações from project sub-menu
- Keep only: Visão Geral, Agenda, Progresso, Documentos, Treinamentos

### 3. ProjectOverview Cleanup
- Remove Comunicados summary card and Versões quick link
- Keep: Progresso, Agenda, Documentos, Treinamentos

### 4. GlobalAgenda Upgrade
- Full calendar view with admin create/edit inline
- Auto-status computation (before=pending, today=in_progress, after=completed)
- Admin "Novo Marco" button directly on the page

### 5. ProjectAgenda Upgrade
- Admin can create milestones directly from project agenda page
- Auto-status computation

### 6. Auto-status
- Computed client-side based on due_date vs today — no manual status needed
- Status field removed from create form (auto-computed)

### 7. Routes
- Remove /projeto/:id/comunicados, /projeto/:id/versoes, /projeto/:id/configuracoes routes
