import { useState, useRef } from 'react';
import { useProjectStageItems, useCreateStageItem, useUpdateStageItem, useDeleteStageItem, type StageItemType } from '@/hooks/useProjectStageItems';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Upload, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const TYPE_OPTIONS: { value: StageItemType; label: string }[] = [
  { value: 'task', label: 'Tarefa' },
  { value: 'development', label: 'Desenvolvimento' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'review', label: 'Revisão' },
  { value: 'other', label: 'Outro' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t.label])) as Record<string, string>;

interface StageChecklistProps {
  stageId: string;
  projectId: string;
  isAdmin: boolean;
}

export function StageChecklist({ stageId, projectId, isAdmin }: StageChecklistProps) {
  const { data: items, isLoading } = useProjectStageItems(stageId);
  const createItem = useCreateStageItem();
  const updateItem = useUpdateStageItem();
  const deleteItem = useDeleteStageItem();
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<StageItemType>('task');
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    createItem.mutate(
      { stage_id: stageId, title: newItemTitle.trim(), item_type: newItemType, order_index: items?.length || 0 },
      {
        onSuccess: () => {
          setNewItemTitle('');
          setNewItemType('task');
          toast.success('Item adicionado!');
        },
        onError: (err: Error) => toast.error('Erro: ' + err.message),
      }
    );
  };

  const handleToggle = (itemId: string, currentState: boolean) => {
    updateItem.mutate({
      id: itemId,
      updates: {
        is_completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null,
      },
    });
  };

  const handleDelete = (itemId: string) => {
    deleteItem.mutate(itemId, {
      onSuccess: () => toast.success('Item removido!'),
      onError: (err: Error) => toast.error('Erro: ' + err.message),
    });
  };

  const handleUploadClick = (itemId: string) => {
    setActiveItemId(itemId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItemId) return;

    setUploadingItemId(activeItemId);
    try {
      const filePath = `${projectId}/stage-items/${activeItemId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          document_type: 'technical_docs',
        })
        .select('id')
        .single();
      if (docError) throw docError;

      // Link document to checklist item
      const { error: linkError } = await (supabase as any)
        .from('project_stage_items')
        .update({ document_id: doc.id })
        .eq('id', activeItemId);
      if (linkError) throw linkError;

      toast.success('Documento anexado!');
      // Refresh items
      updateItem.mutate({ id: activeItemId, updates: {} });
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setUploadingItemId(null);
      setActiveItemId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Erro ao baixar: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const completedCount = items?.filter(i => i.is_completed).length || 0;
  const totalCount = items?.length || 0;

  return (
    <div className="border-t pt-4 space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Checklist</h4>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} concluídos
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {items?.map((item) => (
          <div key={item.id} className="group">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={() => handleToggle(item.id, item.is_completed)}
                disabled={!isAdmin}
              />
              <span className={cn(
                'text-sm flex-1',
                item.is_completed && 'line-through text-muted-foreground'
              )}>
                {item.title}
              </span>
              {item.completed_at && (
                <span className="text-xs text-muted-foreground hidden group-hover:inline">
                  ✓ {format(new Date(item.completed_at), 'dd/MM', { locale: ptBR })}
                </span>
              )}
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUploadClick(item.id)}
                    disabled={uploadingItemId === item.id}
                  >
                    {uploadingItemId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            {/* Optional dates (admin) */}
            {isAdmin ? (
              <div className="ml-9 mt-1 flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Início:</label>
                <input
                  type="date"
                  value={item.start_date || ''}
                  onChange={(e) => updateItem.mutate({ id: item.id, updates: { start_date: e.target.value || null } as any })}
                  className="bg-transparent border rounded px-1.5 py-0.5 text-xs"
                />
                <label className="text-muted-foreground">Prazo:</label>
                <input
                  type="date"
                  value={item.end_date || ''}
                  onChange={(e) => updateItem.mutate({ id: item.id, updates: { end_date: e.target.value || null } as any })}
                  className="bg-transparent border rounded px-1.5 py-0.5 text-xs"
                />
                {item.completed_at && (
                  <span className="text-success">✓ {format(new Date(item.completed_at), 'dd/MM/yy', { locale: ptBR })}</span>
                )}
              </div>
            ) : (
              (item.start_date || item.end_date) && (
                <div className="ml-9 mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  {item.start_date && <span>Início: {format(new Date(item.start_date + 'T00:00:00'), 'dd/MM/yy')}</span>}
                  {item.end_date && <span>Prazo: {format(new Date(item.end_date + 'T00:00:00'), 'dd/MM/yy')}</span>}
                  {item.completed_at && <span className="text-success">Concluído: {format(new Date(item.completed_at), 'dd/MM/yy')}</span>}
                </div>
              )
            )}
            {/* Show linked document */}
            {item.document_id && item.document && (
              <div className="ml-9 mt-1 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <FileText className="h-3 w-3 text-primary" />
                <span className="truncate flex-1">{item.document.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => handleDownload(item.document!.file_path, item.document!.name)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar item..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            disabled={!newItemTitle.trim() || createItem.isPending}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {totalCount === 0 && !isAdmin && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum item registrado nesta etapa.
        </p>
      )}
    </div>
  );
}
