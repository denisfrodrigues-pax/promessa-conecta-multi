import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { FileText, Plus, Download, Trash2, Upload, FileImage, Loader2, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
  descricao: string | null;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tipo: string;
  created_at: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif';
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const FILE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'image/gif': 'GIF',
};

function fileLabel(tipo: string) {
  return FILE_LABELS[tipo] || tipo.split('/')[1]?.toUpperCase() || 'FILE';
}

function FileIcon({ tipo }: { tipo: string }) {
  const Icon = tipo.startsWith('image/') ? FileImage : FileText;
  return <Icon className="w-5 h-5 text-primary" />;
}

export default function LeaderDocumentos() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Documento | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['ministerio_documentos', ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerio_documentos')
        .select('id, nome, descricao, arquivo_url, arquivo_nome, arquivo_tipo, created_at')
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Documento[];
    },
  });

  // ── Add ────────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Selecione um arquivo');

      setUploading(true);
      const ext = selectedFile.name.split('.').pop() || 'bin';
      const filePath = `${ministerioId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('ministerio-docs')
        .upload(filePath, selectedFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ministerio-docs')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('ministerio_documentos')
        .insert({
          ministerio_id: ministerioId,
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          arquivo_url: urlData.publicUrl,
          arquivo_nome: selectedFile.name,
          arquivo_tipo: selectedFile.type,
          criado_por: profile?.id ?? null,
        });

      if (insertError) {
        // limpa o arquivo enviado se o insert falhou
        await supabase.storage.from('ministerio-docs').remove([filePath]);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerio_documentos', ministerioId] });
      toast.success('Documento adicionado!');
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar documento', { description: error.message });
    },
    onSettled: () => setUploading(false),
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (doc: Documento) => {
      // Extrai o path relativo da URL pública
      const url = new URL(doc.arquivo_url);
      const marker = '/ministerio-docs/';
      const idx = url.pathname.indexOf(marker);
      const storagePath = idx >= 0 ? url.pathname.slice(idx + marker.length) : null;

      if (storagePath) {
        await supabase.storage.from('ministerio-docs').remove([storagePath]);
      }

      const { error } = await supabase
        .from('ministerio_documentos')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerio_documentos', ministerioId] });
      toast.success('Documento excluído');
      setDocToDelete(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir documento', { description: error.message });
      setDocToDelete(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido', {
        description: 'Use PDF, DOC, DOCX, PPT, PPTX ou imagens.',
      });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Arquivo muito grande', {
        description: `Máximo ${MAX_SIZE_MB}MB`,
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (!formData.nome) {
      setFormData(prev => ({ ...prev, nome: file.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ nome: '', descricao: '' });
    setSelectedFile(null);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) { toast.error('Nome do documento é obrigatório'); return; }
    if (!selectedFile) { toast.error('Selecione um arquivo'); return; }
    addMutation.mutate();
  };

  const isBusy = uploading || addMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Documentos</h2>
          <p className="text-sm text-muted-foreground">Materiais e arquivos do ministério</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar documento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum documento ainda.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileIcon tipo={doc.arquivo_tipo} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.nome}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono font-semibold uppercase">{fileLabel(doc.arquivo_tipo)}</span>
                      <span className="truncate max-w-[180px]">{doc.arquivo_nome}</span>
                      <span>{format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    {doc.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{doc.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" download={doc.arquivo_nome}>
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDocToDelete(doc)}
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modal Adicionar ─────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Upload area */}
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <label
                htmlFor="doc-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/20'
                }`}
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                {selectedFile ? (
                  <p className="text-sm font-medium text-primary px-4 text-center truncate w-full">
                    {selectedFile.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      PDF, DOC, DOCX, PPT, PPTX, Imagens — máx. {MAX_SIZE_MB}MB
                    </p>
                  </>
                )}
                <input
                  id="doc-upload"
                  type="file"
                  className="hidden"
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileChange}
                  disabled={isBusy}
                />
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-nome">Nome do documento *</Label>
              <Input
                id="doc-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Guia de Louvor Maio 2026"
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-descricao">Descrição (opcional)</Label>
              <Textarea
                id="doc-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o conteúdo..."
                rows={2}
                disabled={isBusy}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isBusy}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isBusy}>
              {isBusy
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                : 'Salvar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmação Exclusão ────────────────────────────────────────────── */}
      <AlertDialog open={!!docToDelete} onOpenChange={(open) => { if (!open) setDocToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>"{docToDelete?.nome}"</strong> será removido permanentemente e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => docToDelete && deleteMutation.mutate(docToDelete)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
