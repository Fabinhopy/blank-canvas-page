## Changes

### 1. DB Migration
- Add `document_id` (uuid, nullable, FK to documents) to `project_stage_items`

### 2. Sidebar Restructure
- Remove Modelagem from project sub-menu
- Reorder: Visão Geral → Agenda → Progresso → Documentos → Treinamentos → Versões → Comunicados → Configurações
- Add global "Agenda" item in main nav (outside projects)
- Keep contextual project items only when inside a project

### 3. Routes
- Remove `/projeto/:id/modelagem` route
- Add `/agenda` global route

### 4. New Pages
- `GlobalAgenda.tsx` - shows milestones from all projects
- Hook `useAllMilestones.ts` - fetches all milestones across projects

### 5. Dashboard
- Add upcoming milestones summary widget

### 6. ProjectProgress (checklist)
- Add document upload button per checklist item
- Show linked document with download option

### 7. ProjectOverview
- Remove Modelagem from quick links
