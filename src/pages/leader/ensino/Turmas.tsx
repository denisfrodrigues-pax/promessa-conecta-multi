import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookOpen, User } from 'lucide-react';

interface Turma {
  id: string;
  nome: string;
  descricao: string | null;
  professor_id: string | null;
  ativo: boolean;
  professor_nome?: string;
}

interface FormData {
  nome: string;
  descricao: string;
  ativo: boolean;
}

const EMPTY: FormData = { nome: '', descricao: '', ativo: true };

export default function Turmas() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { profile, user } = useAuth();
  const churchId = (profile as any)?.igreja_id as string | undefined;
  const qc = useQueryClient();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Turma | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);

  const { data: turmas = [], isLoading } = useQuery({
    queryKey: ['ensino_turmas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_turmas')
        .select('*')
        .eq('ministerio_id', ministerioId)
        .order('nome');
      if (error) throw error;
      return data as Turma[];
    },
    enabled: !!ministerioId,
  });

  const saveMutation = useMutation({
    mutationFn: async (v: FormData) => {
      const payload = {
        nome: v.nome.trim(),
        descricao: v.descricao.trim() || null,
        ativo: v.ativo,
      };
      if (editing) {
        const { error } = await (supabase as any).from('ensino_turmas').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('ensino_turmas').insert({
          ...payload,
          church_id: churchId,
          ministerio_id: ministerioId,
          professor_id: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_turmas', ministerioId] });
      toast.success(editing ? 'Turma atualizada' : 'Turma criada');
      setModal(null);
    },
    onError: (e: Error) => toast.error('Erro ao salvar turma', { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('ensino_turmas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_turmas', ministerioId] });
      toast.success('Turma removida');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover turma'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModal('create');
  }

  function openEdit(t: Turma) {
    setEditing(t);
    setForm({ nome: t.nome, descricao: t.descricao ?? '', ativo: t.ativo });
    setModal('edit');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-promessa-900">Turmas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciamento das turmas de ensino</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova Turma</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : turmas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma turma cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map(t => (
            <Card key={t.id} className={t.ativo ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-promessa-600" />
                    {t.nome}
                  </CardTitle>
                  <Badge variant={t.ativo ? 'default' : 'secondary'}>
                    {t.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {t.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{t.descricao}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(t)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
            saveMutation.mutate(form);
          }} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Escola Bíblica, Discipulado, Pré-adolescentes..." />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Objetivo e público-alvo da turma..." rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="turma-ativo" checked={form.ativo}
                onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
              <Label htmlFor="turma-ativo">Turma ativa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteTarget?.nome}"? Todos os planos e chamadas serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
