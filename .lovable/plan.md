
## Correções e Novas Funcionalidades

### 1. Fix Calendar Auto-Status (Concluído em vez de Atrasado)
- Fix `computeStatus()` em GlobalAgenda e ProjectAgenda para usar "completed" após a data
- Fix Dashboard milestones para não mostrar "Atrasado", mostrar "Concluído"
- Fix ProjectRoadmap upcoming filter para usar auto-status

### 2. Upload direto em Documentos e Treinamentos
- Adicionar formulário inline para admin subir documentos na página ProjectDocuments
- Adicionar formulário inline para admin subir treinamentos na página ProjectTrainings

### 3. Suporte com Projeto Obrigatório
- DB: Adicionar coluna `project_id` (nullable) à tabela `support_tickets`
- Adicionar campo Select de projeto (obrigatório) no formulário de ticket com opção "Dúvida Geral"
- Atualizar hook `useCreateTicket` para incluir project_id

### 4. Layout do Cliente
- Remover espaçamentos desnecessários no sidebar
- Limpar Dashboard, Agenda Geral e Treinamentos

### 5. Foto de Perfil - Aspect Ratio
- Usar `object-cover` no Avatar e manter aspect-ratio correto

### 6. Chat em Tempo Real
- DB: Criar tabelas `chat_conversations` e `chat_messages`
- Criar componente de chat com Supabase Realtime
- Adicionar na sidebar e como página
