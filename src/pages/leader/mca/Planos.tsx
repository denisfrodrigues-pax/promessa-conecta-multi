import { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, ChevronRight, Pencil, Trash2, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sala { id: string; nome: string }
interface Plano {
  id: string;
  sala_id: string;
  titulo: string;
  data_aula: string;
  objetivos: string | null;
  mca_salas: { nome: string } | null;
}

interface PlanoForm { titulo: string; data_aula: string; sala_id: string }
const EMPTY: PlanoForm = { titulo: '', data_aula: '', sala_id: '' };

export default function Planos() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [salaFilter, setSalaFilter] = useState('todas');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<PlanoForm>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);

  const { data: salas = [] } = useQuery({
    queryKey: ['mca_salas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_salas').select('id, nome').eq('ministerio_id', ministerioId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Sala[];
    },
    enabled: !!ministerioId,
  });

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['mca_planos', ministerioId, salaFilter],
    queryFn: async () => {
      let q = (supabase as any)
        .from('mca_planos_aula')
        .select('*, mca_salas(nome)')
        .in('sala_id', salas.map(s => s.id))
        .order('data_aula', { ascending: false });
      if (salaFilter !== 'todas') q = q.eq('sala_id', salaFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Plano[];
    },
    enabled: salas.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (v: PlanoForm) => {
      const { data, error } = await (supabase as any)
        .from('mca_planos_aula')
        .insert({ titulo: v.titulo.trim(), data_aula: v.data_aula, sala_id: v.sala_id, professor_id: user?.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['mca_planos', ministerioId] });
      toast.success('Plano criado');
      setModal(false);
      navigate(`/leader/${slug}/planos/${id}`);
    },
    onError: () => toast.error('Erro ao criar plano'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('mca_planos_aula').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_planos', ministerioId] });
      toast.success('Plano removido');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) { toast.error('Título obrigatório'); return; }
    if (!form.data_aula) { toast.error('Data obrigatória'); return; }
    if (!form.sala_id) { toast.error('Sala obrigatória'); return; }
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-promessa-900">Planos de Aula</h1>
          <p className="text-muted-foreground text-sm mt-1">Planejamento de conteúdo por sala</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Plano
        </Button>
      </div>

      <Select value={salaFilter} onValueChange={setSalaFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por sala" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as salas</SelectItem>
          {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : planos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum plano de aula cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {planos.map(p => (
            <Card key={p.id} className="cursor-pointer hover:border-promessa-300 transition-colors"
              onClick={() => navigate(`/leader/${slug}/planos/${p.id}`)}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="w-4 h-4 text-promessa-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.titulo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(p.data_aula + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        <Badge variant="outline" className="text-xs py-0">{p.mca_salas?.nome}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(p); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Plano de Aula</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: O Bom Pastor" />
            </div>
            <div>
              <Label>Data da Aula *</Label>
              <Input type="date" value={form.data_aula}
                onChange={e => setForm(p => ({ ...p, data_aula: e.target.value }))} />
            </div>
            <div>
              <Label>Sala *</Label>
              <Select value={form.sala_id} onValueChange={v => setForm(p => ({ ...p, sala_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar sala" /></SelectTrigger>
                <SelectContent>
                  {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar e Editar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteTarget?.titulo}"? Os arquivos anexados também serão excluídos.
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
