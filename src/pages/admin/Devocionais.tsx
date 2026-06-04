import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookOpen, Lock, LockOpen, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Devocional {
  id: string;
  titulo: string;
  subtitulo: string | null;
  versiculo_texto: string;
  versiculo_referencia: string;
  reflexao: string;
  para_pensar: string;
  oracao: string;
  serie: string | null;
  semana: number | null;
  data_publicacao: string;
  ativo: boolean;
  church_id: string | null;
}

interface FormData {
  titulo: string;
  subtitulo: string;
  versiculo_texto: string;
  versiculo_referencia: string;
  reflexao: string;
  para_pensar: string;
  oracao: string;
  serie: string;
  semana: string;
  data_publicacao: string;
  ativo: boolean;
}

const EMPTY_FORM: FormData = {
  titulo: '', subtitulo: '', versiculo_texto: '', versiculo_referencia: '',
  reflexao: '', para_pensar: '', oracao: '', serie: '', semana: '',
  data_publicacao: new Date().toISOString().split('T')[0], ativo: false,
};

export default function AdminDevocionais() {
  const qc = useQueryClient();
  const { churchId: authChurchId } = useAuth();
  const { church } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [toDelete, setToDelete] = useState<Devocional | null>(null);

  const { data: devocionais = [], isLoading } = useQuery({
    queryKey: ['admin_devocionais', churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('devocionais')
        .select('*')
        .eq('church_id', churchId)
        .order('data_publicacao', { ascending: true });
      if (error) throw error;
      return data as Devocional[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim() || null,
        versiculo_texto: form.versiculo_texto.trim(),
        versiculo_referencia: form.versiculo_referencia.trim(),
        reflexao: form.reflexao.trim(),
        para_pensar: form.para_pensar.trim(),
        oracao: form.oracao.trim(),
        serie: form.serie.trim() || null,
        semana: form.semana ? parseInt(form.semana) : null,
        data_publicacao: form.data_publicacao,
        ativo: form.ativo,
        church_id: churchId,
      };
      if (editingId) {
        const { error } = await (supabase as any).from('devocionais').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('devocionais').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_devocionais'] });
      qc.invalidateQueries({ queryKey: ['devocional-semana'] });
      toast.success(editingId ? 'Devocional atualizado' : 'Devocional criado');
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast.error('Erro ao salvar', { description: e.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (d: Devocional) => {
      const { error } = await (supabase as any)
        .from('devocionais')
        .update({ ativo: !d.ativo })
        .eq('id', d.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_devocionais'] });
      qc.invalidateQueries({ queryKey: ['devocional-semana'] });
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('devocionais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_devocionais'] });
      qc.invalidateQueries({ queryKey: ['devocional-semana'] });
      toast.success('Devocional excluído');
      setToDelete(null);
    },
    onError: (e: Error) => toast.error('Erro ao excluir', { description: e.message }),
  });

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(d: Devocional) {
    setEditingId(d.id);
    setForm({
      titulo: d.titulo, subtitulo: d.subtitulo ?? '',
      versiculo_texto: d.versiculo_texto, versiculo_referencia: d.versiculo_referencia,
      reflexao: d.reflexao, para_pensar: d.para_pensar, oracao: d.oracao,
      serie: d.serie ?? '', semana: d.semana ? String(d.semana) : '',
      data_publicacao: d.data_publicacao, ativo: d.ativo,
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.titulo.trim()) { toast.error('Título obrigatório'); return; }
    if (!form.versiculo_texto.trim()) { toast.error('Versículo obrigatório'); return; }
    if (!form.versiculo_referencia.trim()) { toast.error('Referência obrigatória'); return; }
    if (!form.reflexao.trim()) { toast.error('Reflexão obrigatória'); return; }
    if (!form.para_pensar.trim()) { toast.error('Campo "Para pensar" obrigatório'); return; }
    if (!form.oracao.trim()) { toast.error('Oração obrigatória'); return; }
    if (!form.data_publicacao) { toast.error('Data de publicação obrigatória'); return; }
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Devocionais</h2>
          <p className="text-sm text-muted-foreground">Gerencie os devocionais semanais da igreja</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Devocional
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : devocionais.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum devocional cadastrado.</p>
            <Button variant="outline" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />Criar primeiro devocional
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {devocionais.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-promessa-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-promessa-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{d.titulo}</p>
                      <Badge variant={d.ativo ? 'default' : 'secondary'} className="shrink-0">
                        {d.ativo ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {d.serie && <span className="text-xs text-muted-foreground">{d.serie}{d.semana ? ` · Sem. ${d.semana}` : ''}</span>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(d.data_publicacao + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline"
                      onClick={() => toggleMutation.mutate(d)}
                      disabled={toggleMutation.isPending}
                      title={d.ativo ? 'Despublicar' : 'Publicar'}
                    >
                      {d.ativo
                        ? <><Lock className="w-4 h-4 mr-1" />Despublicar</>
                        : <><LockOpen className="w-4 h-4 mr-1" />Publicar</>
                      }
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setToDelete(d)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Devocional' : 'Novo Devocional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Você não é sua linhagem" />
              </div>
              <div className="col-span-2">
                <Label>Subtítulo / Tema do sermão</Label>
                <Input value={form.subtitulo} onChange={e => setForm(p => ({ ...p, subtitulo: e.target.value }))}
                  placeholder="Ex: Famílias Imperfeitas: A Graça que Transforma" />
              </div>
              <div>
                <Label>Série</Label>
                <Input value={form.serie} onChange={e => setForm(p => ({ ...p, serie: e.target.value }))}
                  placeholder="Ex: Família de Mentirinha" />
              </div>
              <div>
                <Label>Semana</Label>
                <Input type="number" min={1} value={form.semana}
                  onChange={e => setForm(p => ({ ...p, semana: e.target.value }))} placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label>Versículo *</Label>
                <Textarea value={form.versiculo_texto}
                  onChange={e => setForm(p => ({ ...p, versiculo_texto: e.target.value }))}
                  placeholder="Texto do versículo..." rows={2} />
              </div>
              <div>
                <Label>Referência *</Label>
                <Input value={form.versiculo_referencia}
                  onChange={e => setForm(p => ({ ...p, versiculo_referencia: e.target.value }))}
                  placeholder="Ex: João 3.16" />
                <div className="mt-2">
                  <Label>Data de publicação *</Label>
                  <Input type="date" value={form.data_publicacao}
                    onChange={e => setForm(p => ({ ...p, data_publicacao: e.target.value }))} />
                </div>
              </div>
            </div>

            <div>
              <Label>Reflexão * <span className="text-xs text-muted-foreground font-normal">(use linha em branco para separar parágrafos)</span></Label>
              <Textarea value={form.reflexao}
                onChange={e => setForm(p => ({ ...p, reflexao: e.target.value }))}
                placeholder="Texto da reflexão..." rows={8} />
            </div>

            <div>
              <Label>Para pensar hoje *</Label>
              <Textarea value={form.para_pensar}
                onChange={e => setForm(p => ({ ...p, para_pensar: e.target.value }))}
                placeholder="Pergunta ou reflexão para o dia..." rows={3} />
            </div>

            <div>
              <Label>Oração *</Label>
              <Textarea value={form.oracao}
                onChange={e => setForm(p => ({ ...p, oracao: e.target.value }))}
                placeholder="Texto da oração..." rows={4} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="ativo" className="cursor-pointer">Publicar imediatamente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); }}
              disabled={saveMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editingId ? 'Salvando...' : 'Criando...'}</>
                : editingId ? 'Salvar' : 'Criar devocional'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir devocional?</AlertDialogTitle>
            <AlertDialogDescription>
              O devocional <strong>"{toDelete?.titulo}"</strong> será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
