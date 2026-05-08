import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Paperclip, Trash2, Download, Upload, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Turma { id: string; nome: string }
interface Plano {
  id: string;
  titulo: string;
  data_aula: string;
  turma_id: string;
  objetivos: string | null;
  conteudo: string | null;
  anotacoes: string | null;
  ensino_turmas: { nome: string } | null;
}
interface Arquivo {
  id: string;
  nome: string;
  arquivo_url: string;
  arquivo_tipo: string;
  tamanho_bytes: number | null;
}

function formatBytes(b: number | null): string {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function PlanoDetalhe() {
  const { planoId } = useParams<{ planoId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    titulo: string; data_aula: string; turma_id: string;
    objetivos: string; conteudo: string; anotacoes: string;
  } | null>(null);
  const [deleteArquivo, setDeleteArquivo] = useState<Arquivo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState<'objetivos' | 'conteudo' | 'completo' | null>(null);

  const { data: turmasList = [] } = useQuery({
    queryKey: ['ensino_turmas_all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_turmas').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Turma[];
    },
  });

  const { data: plano, isLoading } = useQuery({
    queryKey: ['ensino_plano', planoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_planos_aula').select('*, ensino_turmas(nome)').eq('id', planoId).single();
      if (error) throw error;
      return data as Plano;
    },
    enabled: !!planoId,
  });

  // Sync form when plano loads (including from cache on navigation)
  useEffect(() => {
    if (plano) {
      setForm({
        titulo: plano.titulo, data_aula: plano.data_aula, turma_id: plano.turma_id,
        objetivos: plano.objetivos ?? '', conteudo: plano.conteudo ?? '', anotacoes: plano.anotacoes ?? '',
      });
    }
  }, [plano?.id]);

  const { data: arquivos = [] } = useQuery({
    queryKey: ['ensino_plano_arquivos', planoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_plano_arquivos').select('*').eq('plano_id', planoId).order('created_at');
      if (error) throw error;
      return data as Arquivo[];
    },
    enabled: !!planoId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await (supabase as any).from('ensino_planos_aula').update({
        titulo: form.titulo.trim(),
        data_aula: form.data_aula,
        turma_id: form.turma_id,
        objetivos: form.objetivos.trim() || null,
        conteudo: form.conteudo.trim() || null,
        anotacoes: form.anotacoes.trim() || null,
      }).eq('id', planoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_plano', planoId] });
      qc.invalidateQueries({ queryKey: ['ensino_planos'] });
      toast.success('Plano salvo');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteArquivoMutation = useMutation({
    mutationFn: async (arq: Arquivo) => {
      const path = new URL(arq.arquivo_url).pathname.split('/ensino-planos/')[1];
      if (path) await supabase.storage.from('ensino-planos').remove([path]);
      const { error } = await (supabase as any).from('ensino_plano_arquivos').delete().eq('id', arq.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_plano_arquivos', planoId] });
      toast.success('Arquivo removido');
      setDeleteArquivo(null);
    },
    onError: () => toast.error('Erro ao remover arquivo'),
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !planoId) return;
    setUploading(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${planoId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from('ensino-planos').upload(path, file);
        if (upErr) throw new Error(`Erro no upload: ${upErr.message}`);
        const { data: { publicUrl } } = supabase.storage.from('ensino-planos').getPublicUrl(path);
        const { error: dbErr } = await (supabase as any).from('ensino_plano_arquivos').insert({
          plano_id: planoId, nome: file.name,
          arquivo_url: publicUrl,
          arquivo_tipo: file.type || 'application/octet-stream',
          tamanho_bytes: file.size,
        });
        if (dbErr) throw new Error(`Erro ao salvar: ${dbErr.message}`);
      }
      qc.invalidateQueries({ queryKey: ['ensino_plano_arquivos', planoId] });
      toast.success(`${files.length} arquivo${files.length > 1 ? 's' : ''} enviado${files.length > 1 ? 's' : ''}`);
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo', { description: err?.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function gerarComIA(secao: 'objetivos' | 'conteudo' | 'completo') {
    if (!form) return;
    if (!form.titulo.trim()) { toast.error('Preencha o título antes de usar a IA'); return; }
    setAiLoading(secao);
    try {
      const turma = turmasList.find(t => t.id === form.turma_id);
      const { data, error } = await supabase.functions.invoke('gera-plano-aula', {
        body: {
          titulo: form.titulo,
          turma_nome: turma?.nome ?? '',
          data_aula: form.data_aula,
          secao,
        },
      });
      if (error) throw error;
      if (secao === 'completo') {
        setForm(f => f && ({
          ...f,
          objetivos: data.objetivos ?? f.objetivos,
          conteudo: data.conteudo ?? f.conteudo,
          anotacoes: data.anotacoes ?? f.anotacoes,
        }));
        toast.success('Plano gerado pela IA! Revise e salve.');
      } else {
        setForm(f => f && ({ ...f, [secao]: data.text ?? '' }));
        toast.success('Texto gerado! Revise e salve.');
      }
    } catch (err: any) {
      toast.error('Erro ao gerar com IA', { description: err?.message });
    } finally {
      setAiLoading(null);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-promessa-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {plano?.ensino_turmas?.nome} · {format(new Date(plano!.data_aula + 'T12:00:00'), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => gerarComIA('completo')}
          disabled={!!aiLoading}
          className="text-promessa-700 border-promessa-300 hover:bg-promessa-50"
        >
          {aiLoading === 'completo'
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Wand2 className="w-4 h-4 mr-2" />}
          Gerar com IA
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(p => p && ({ ...p, titulo: e.target.value }))} />
            </div>
            <div>
              <Label>Data da Aula *</Label>
              <Input type="date" value={form.data_aula}
                onChange={e => setForm(p => p && ({ ...p, data_aula: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Turma *</Label>
            <Select value={form.turma_id} onValueChange={v => setForm(p => p && ({ ...p, turma_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {turmasList.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Objetivos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Objetivos</Label>
              <Button
                type="button" variant="ghost" size="sm"
                className="h-6 text-xs text-promessa-600 hover:text-promessa-700 px-2"
                onClick={() => gerarComIA('objetivos')}
                disabled={!!aiLoading}
              >
                {aiLoading === 'objetivos'
                  ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  : <Sparkles className="w-3 h-3 mr-1" />}
                Gerar com IA
              </Button>
            </div>
            <Textarea value={form.objetivos}
              onChange={e => setForm(p => p && ({ ...p, objetivos: e.target.value }))}
              placeholder="O que os alunos aprenderão nesta aula..." rows={3} />
          </div>

          {/* Conteúdo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Conteúdo / Desenvolvimento</Label>
              <Button
                type="button" variant="ghost" size="sm"
                className="h-6 text-xs text-promessa-600 hover:text-promessa-700 px-2"
                onClick={() => gerarComIA('conteudo')}
                disabled={!!aiLoading}
              >
                {aiLoading === 'conteudo'
                  ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  : <Sparkles className="w-3 h-3 mr-1" />}
                Gerar com IA
              </Button>
            </div>
            <Textarea value={form.conteudo}
              onChange={e => setForm(p => p && ({ ...p, conteudo: e.target.value }))}
              placeholder="Texto bíblico, dinâmicas, perguntas para reflexão..." rows={6} />
          </div>

          <div>
            <Label>Anotações</Label>
            <Textarea value={form.anotacoes}
              onChange={e => setForm(p => p && ({ ...p, anotacoes: e.target.value }))}
              placeholder="Materiais necessários, observações..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Arquivos */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4" />Materiais Anexados
            </CardTitle>
            <div>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Enviando...</>
                  : <><Upload className="w-3.5 h-3.5 mr-1" />Enviar</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {arquivos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum material anexado. Envie slides, apostilas ou outros arquivos.
            </p>
          ) : (
            <div className="space-y-2">
              {arquivos.map(arq => (
                <div key={arq.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-promessa-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{arq.nome}</p>
                      {arq.tamanho_bytes && (
                        <p className="text-xs text-muted-foreground">{formatBytes(arq.tamanho_bytes)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={arq.arquivo_url} download={arq.nome} target="_blank" rel="noreferrer">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteArquivo(arq)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteArquivo} onOpenChange={() => setDeleteArquivo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Material</AlertDialogTitle>
            <AlertDialogDescription>Deseja remover "{deleteArquivo?.nome}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteArquivo && deleteArquivoMutation.mutate(deleteArquivo)}
              disabled={deleteArquivoMutation.isPending}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
