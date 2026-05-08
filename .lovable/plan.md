# Redesenho do Sistema PMO

## Visão Geral

Atualmente, "Suporte" e "Evolução" estão como etapas 6 e 7 do projeto, junto com Levantamento → Produção. Vamos separar:

- **Projeto Principal** (etapas 1–5): Levantamento, Modelagem, Desenvolvimento, Homologação, Produção. Quando todas concluídas → projeto **Concluído**.
- **Suporte**: tickets independentes do projeto, cada um com data início, data término e nível de prioridade.
- **Evoluções**: cada evolução é um "mini-projeto" com suas próprias 5 etapas (Levantamento → Produção). Um projeto pode ter várias evoluções.

## Mudanças no Banco de Dados

### 1. Remover Suporte/Evolução do `project_stages`

Migration para deletar registros com `stage_name IN ('Suporte', 'Evolução')` e ajustar `useCreateDefaultStages` para criar apenas 5 etapas.

### 2. `support_tickets` — adicionar campos

- `start_date` (date)
- `end_date` (date)
- `priority` (text: 'low' | 'medium' | 'high' | 'critical', default 'medium')

### 3. Nova tabela `project_evolutions`

```
id uuid PK
project_id uuid (FK projects)
title text
description text
status text ('pending' | 'in_progress' | 'completed')
created_at, updated_at
```

RLS: admin gerencia, usuários veem via `user_has_project_access`.

### 4. Nova tabela `evolution_stages` (espelha project_stages)

```
id uuid PK
evolution_id uuid (FK project_evolutions)
stage_name text (Levantamento, Modelagem, Desenvolvimento, Homologação, Produção)
status, order_index, started_at, completed_at, notes
```

RLS via join com project_evolutions → projects.

### 5. Nova tabela `evolution_stage_items` (espelha project_stage_items)

Checklist por etapa de evolução. Mesmas colunas de `project_stage_items` mas com `evolution_stage_id`.

## Mudanças na UI

### Gantt e Progresso do Projeto (`ProjectProgress.tsx`)

- Gantt e Timeline mostram **apenas etapas 1–5**.
- Aba/seção separada "Evoluções" lista evoluções com botão "Nova Evolução" (admin).
- Cada evolução exibe seu próprio mini-Gantt + checklist.

### Status do projeto (`useProjects.ts`)

Quando todas as 5 etapas principais concluídas → `status = 'completed'`.

### Página de Suporte (`Support.tsx` + `AdminSupport`)

- Form de novo ticket: campo prioridade (Baixa/Média/Alta) + data início.
- Admin pode definir/editar data término ao responder/encerrar.
- Listagem com badges coloridos por prioridade.

### Visão Geral (`ProjectOverview.tsx`)

- Timeline de 5 etapas (não 7).
- Card "Evoluções": contagem ativas/concluídas + link.
- Card "Suporte": tickets abertos do projeto com prioridade.

### Admin

- `AdminProjectStages`: remover linhas Suporte/Evolução.
- Nova página `AdminProjectEvolutions` para CRUD de evoluções e suas etapas.

## Arquivos Principais

**Novos:**

- `sql/redesign_pmo.sql` (migration completa)
- `src/hooks/useProjectEvolutions.ts`
- `src/hooks/useEvolutionStages.ts`
- `src/hooks/useEvolutionStageItems.ts`
- `src/components/projeto/EvolutionsSection.tsx`
- `src/components/projeto/EvolutionGantt.tsx`
- `src/pages/admin/AdminProjectEvolutions.tsx`

**Editados:**

- `src/hooks/useProjectStages.ts` — remover Suporte/Evolução do default
- `src/hooks/useSupportTickets.ts` — campos prioridade/datas
- `src/pages/projeto/ProjectProgress.tsx` — Gantt sem 6/7 + seção evoluções
- `src/pages/projeto/ProjectOverview.tsx` — timeline 5 etapas
- `src/pages/Support.tsx` + admin — prioridade e datas
- `src/components/projeto/ProjectProgressTimeline.tsx` — só 1–5
- `src/pages/admin/AdminProjectStages.tsx` — sem complementares

## Migração de Dados Existentes

- Etapas "Suporte" e "Evolução" existentes em `project_stages` serão **removidas** (com seus checklists). Se algum projeto já tem dados nelas, eles serão perdidos. Confirmar antes.
- `support_tickets` existentes recebem `priority='medium'` e datas nulas.

## Pergunta Antes de Executar

Posso **deletar** as etapas existentes "Suporte" e "Evolução" do banco (com seus checklists)? Ou prefere que eu mantenha como histórico e só esconda da UI?