import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Baby } from 'lucide-react';

interface Sala {
  id: string;
  nome: string;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  capacidade: number | null;
  ativo: boolean;
}

interface FormData {
  nome: string;
  faixa_etaria_min: string;
  faixa_etaria_max: string;
  capacidade: string;
  ativo: boolean;
}

const EMPTY_FORM: FormData = { nome: '', faixa_etaria_min: '', faixa_etaria_max: '', capacidade: '', ativo: true };

export default function Salas({ ministerioId: propMid }: { ministerioId?: string } = {}) {
  const ctx = useOutletContext<{ ministerioId: string } | null>();
  const ministerioId = propMid ?? ctx?.ministerioId ?? '';
  const qc = useQueryClient();

  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Sala | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sala | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const { data: salas = [], isLoading } = useQuery({
    queryKey: ['mca_salas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_salas')
        .select('*')
        .eq('ministerio_id', ministerioId)
        .order('nome');
      if (error) throw error;
      return data as Sala[];
    },
    enabled: !!ministerioId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        nome: values.nome.trim(),
        faixa_etaria_min: values.faixa_etaria_min ? Number(values.faixa_etaria_min) : null,
        faixa_etaria_max: values.faixa_etaria_max ? Number(values.faixa_etaria_max) : null,
        capacidade: values.capacidade ? Number(values.capacidade) : null,
        ativo: values.ativo,
      };
      if (editing) {
        const { error } = await (supabase as any).from('mca_salas').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('mca_salas').insert({
          ...payload, church_id: churchId, ministerio_id: ministerioId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_salas', ministerioId] });
      toast.success(editing ? 'Sala atualizada' : 'Sala criada');
      setModal(null);
    },
    onError: () => toast.error('Erro ao salvar sala'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('mca_salas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_salas', ministerioId] });
      toast.success('Sala removida');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover sala'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('create');
  }

  function openEdit(sala: Sala) {
    setEditing(sala);
    setForm({
      nome: sala.nome,
      faixa_etaria_min: sala.faixa_etaria_min?.toString() ?? '',
      faixa_etaria_max: sala.faixa_etaria_max?.toString() ?? '',
      capacidade: sala.capacidade?.toString() ?? '',
      ativo: sala.ativo,
    });
    setModal('edit');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-promessa-900">Salas</h1>
          <p className="text-muted-foreground text-sm mt-1">Salas do ministério infantil</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova Sala</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : salas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma sala cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map(sala => (
            <Card key={sala.id} className={sala.ativo ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{sala.nome}</CardTitle>
                  <Badge variant={sala.ativo ? 'default' : 'secondary'}>
                    {sala.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {(sala.faixa_etaria_min != null || sala.faixa_etaria_max != null) && (
                  <div className="flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5" />
                    {sala.faixa_etaria_min ?? '?'} – {sala.faixa_etaria_max ?? '?'} anos
                  </div>
                )}
                {sala.capacidade != null && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Capacidade: {sala.capacidade}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(sala)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" />Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(sala)}>
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
            <DialogTitle>{editing ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Maternal, Jardim, Primários..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Faixa etária min (anos)</Label>
                <Input type="number" min={0} max={18} value={form.faixa_etaria_min}
                  onChange={e => setForm(p => ({ ...p, faixa_etaria_min: e.target.value }))}
                  placeholder="0" />
              </div>
              <div>
                <Label>Faixa etária max (anos)</Label>
                <Input type="number" min={0} max={18} value={form.faixa_etaria_max}
                  onChange={e => setForm(p => ({ ...p, faixa_etaria_max: e.target.value }))}
                  placeholder="12" />
              </div>
            </div>
            <div>
              <Label>Capacidade</Label>
              <Input type="number" min={1} value={form.capacidade}
                onChange={e => setForm(p => ({ ...p, capacidade: e.target.value }))}
                placeholder="Ex: 20" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sala-ativo" checked={form.ativo}
                onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
              <Label htmlFor="sala-ativo">Sala ativa</Label>
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
            <AlertDialogTitle>Remover Sala</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
