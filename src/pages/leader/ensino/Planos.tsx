import { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, ChevronRight, Trash2, BookOpen, Calendar, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Turma { id: string; nome: string }
interface Plano {
  id: string;
  turma_id: string;
  titulo: string;
  data_aula: string;
  objetivos: string | null;
  ensino_turmas: { nome: string } | null;
}

interface PlanoForm { titulo: string; data_aula: string; turma_id: string }
const EMPTY: PlanoForm = { titulo: '', data_aula: '', turma_id: '' };

export default function Planos() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [turmaFilter, setTurmaFilter] = useState('todas');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<PlanoForm>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);

  const { data: turmas = [] } = useQuery({
    queryKey: ['ensino_turmas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_turmas').select('id, nome').eq('ministerio_id', ministerioId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Turma[];
    },
    enabled: !!ministerioId,
  });

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['ensino_planos', ministerioId, turmaFilter],
    queryFn: async () => {
      const turmaIds = turmas.map(t => t.id);
      if (!turmaIds.length) return [];
      let q = (supabase as any)
        .from('ensino_planos_aula')
        .select('*, ensino_turmas(nome)')
        .in('turma_id', turmaIds)
        .order('data_aula', { ascending: false });
      if (turmaFilter !== 'todas') q = q.eq('turma_id', turmaFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Plano[];
    },
    enabled: turmas.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (v: PlanoForm) => {
      const { data, error } = await (supabase as any)
        .from('ensino_planos_aula')
        .insert({ titulo: v.titulo.trim(), data_aula: v.data_aula, turma_id: v.turma_id, professor_id: user?.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['ensino_planos', ministerioId] });
      toast.success('Plano criado');
      setModal(false);
      navigate(`/leader/${slug}/planos/${id}`);
    },
    onError: () => toast.error('Erro ao criar plano'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('ensino_planos_aula').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_planos', ministerioId] });
      toast.success('Plano removido');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-promessa-900">Espaço do Professor</h1>
          <p className="text-muted-foreground text-sm mt-1">Planos de aula e materiais por turma</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Plano
        </Button>
      </div>

      <Select value={turmaFilter} onValueChange={setTurmaFilter}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Filtrar por turma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as turmas</SelectItem>
          {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : turmas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Cadastre uma turma antes de criar planos de aula.
          </CardContent>
        </Card>
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{format(new Date(p.data_aula + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        <Badge variant="outline" className="text-xs py-0">{p.ensino_turmas?.nome}</Badge>
                      </div>
                      {p.objetivos && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {p.objetivos.length > 80 ? p.objetivos.slice(0, 80) + '…' : p.objetivos}
                        </p>
                      )}
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
          <form onSubmit={e => {
            e.preventDefault();
            if (!form.titulo.trim()) { toast.error('Título obrigatório'); return; }
            if (!form.data_aula) { toast.error('Data obrigatória'); return; }
            if (!form.turma_id) { toast.error('Turma obrigatória'); return; }
            createMutation.mutate(form);
          }} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Frutos do Espírito — Aula 1" />
            </div>
            <div>
              <Label>Data da Aula *</Label>
              <Input type="date" value={form.data_aula}
                onChange={e => setForm(p => ({ ...p, data_aula: e.target.value }))} />
            </div>
            <div>
              <Label>Turma *</Label>
              <Select value={form.turma_id} onValueChange={v => setForm(p => ({ ...p, turma_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar turma" /></SelectTrigger>
                <SelectContent>
                  {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
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
