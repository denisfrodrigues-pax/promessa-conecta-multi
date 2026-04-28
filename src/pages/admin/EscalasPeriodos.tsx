import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, ChevronRight, Lock, LockOpen, Trash2, Calendar, Loader2 } from 'lucide-react';

interface Periodo {
  id: string;
  nome: string;
  mes: number;
  ano: number;
  status: string;
  created_at: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const ANOS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

export default function AdminEscalasPeriodos() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Periodo | null>(null);
  const [form, setForm] = useState({
    nome: '',
    mes: String(new Date().getMonth() + 1),
    ano: String(currentYear),
  });

  // Fetch church_id from igrejas — profiles.church_id is not in the schema cache
  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase
        .from('igrejas')
        .select('id')
        .limit(1)
        .maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: periodos = [], isLoading } = useQuery({
    queryKey: ['periodos_escala', churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodos_escala')
        .select('id, nome, mes, ano, status, created_at')
        .eq('church_id', churchId!)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      if (error) throw error;
      return data as Periodo[];
    },
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('periodos_escala').insert({
        church_id: churchId!,
        nome: form.nome.trim(),
        mes: parseInt(form.mes),
        ano: parseInt(form.ano),
        criado_por: profile?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos_escala', churchId] });
      toast.success('Período criado!');
      setIsModalOpen(false);
      setForm({ nome: '', mes: String(new Date().getMonth() + 1), ano: String(currentYear) });
    },
    onError: (e: Error) => toast.error('Erro ao criar período', { description: e.message }),
  });

  // ── Toggle status ──────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async (p: Periodo) => {
      const { error } = await supabase
        .from('periodos_escala')
        .update({ status: p.status === 'aberto' ? 'fechado' : 'aberto' })
        .eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos_escala', churchId] });
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('periodos_escala').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos_escala', churchId] });
      toast.success('Período excluído');
      setToDelete(null);
    },
    onError: (e: Error) => {
      toast.error('Erro ao excluir', { description: e.message });
      setToDelete(null);
    },
  });

  const handleSubmit = () => {
    if (!form.nome.trim()) { toast.error('Informe o nome do período'); return; }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Períodos de Escala</h2>
          <p className="text-sm text-muted-foreground">Organize as escalas por período mensal</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo período
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : periodos.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum período criado ainda.</p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro período
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {periodos.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{p.nome}</p>
                      <Badge variant={p.status === 'aberto' ? 'default' : 'secondary'}>
                        {p.status === 'aberto' ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {MESES[p.mes - 1]} de {p.ano}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate(p)}
                      disabled={toggleMutation.isPending}
                      title={p.status === 'aberto' ? 'Fechar período' : 'Reabrir período'}
                    >
                      {p.status === 'aberto'
                        ? <><Lock className="w-4 h-4 mr-1" />Fechar</>
                        : <><LockOpen className="w-4 h-4 mr-1" />Reabrir</>
                      }
                    </Button>
                    <Button size="sm" variant="default" asChild>
                      <Link to={`/admin/escalas/periodos/${p.id}`}>
                        Gerenciar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setToDelete(p)}
                      title="Excluir período"
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

      {/* ── Modal Criar ──────────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo período de escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do período *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Escalas Maio 2026"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mês *</Label>
                <Select value={form.mes} onValueChange={(v) => setForm({ ...form, mes: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Select value={form.ano} onValueChange={(v) => setForm({ ...form, ano: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
                : 'Criar período'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar Exclusão ───────────────────────────────────────────────── */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir período?</AlertDialogTitle>
            <AlertDialogDescription>
              O período <strong>"{toDelete?.nome}"</strong> e todos os seus eventos serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
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
