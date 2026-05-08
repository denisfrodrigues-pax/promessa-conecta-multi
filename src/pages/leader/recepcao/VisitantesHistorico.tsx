import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { MessageCircle, Search, Users, Calendar, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  culto: string | null;
  melhor_horario: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

const CULTOS = ['Sábado', 'Base', 'Ação Social', 'Outro'];
const HORARIOS = ['Manhã', 'Tarde', 'Noite', 'Qualquer horário'];

const cleanPhone = (phone: string | null) => (phone ?? '').replace(/\D/g, '');
const hasValidPhone = (phone: string | null) => cleanPhone(phone).length >= 10;

const getWhatsAppUrl = (phone: string | null) => {
  const msg = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/55${cleanPhone(phone)}?text=${msg}`;
};

const POR_PAGINA = 20;
const sanitize = (s: string) => s.replace(/[%_\\]/g, '\\$&').trim();

type FormData = {
  nome: string; telefone: string; email: string;
  culto: string; melhor_horario: string; observacoes: string; status: string;
};

const formDeVisitante = (v: Visitante): FormData => ({
  nome: v.nome,
  telefone: v.telefone ?? '',
  email: v.email ?? '',
  culto: v.culto ?? '',
  melhor_horario: v.melhor_horario ?? '',
  observacoes: v.observacoes ?? '',
  status: v.status ?? 'novo',
});

export default function VisitantesHistorico() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pagina, setPagina] = useState(1);

  const [editando, setEditando] = useState<Visitante | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormData | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [deletandoNome, setDeletandoNome] = useState('');
  const [verObs, setVerObs] = useState<Visitante | null>(null);

  const queryKey = ['recepcao_visitantes_historico', busca, filtroStatus, pagina];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const from = (pagina - 1) * POR_PAGINA;
      const to = from + POR_PAGINA - 1;

      let q = (supabase as any)
        .from('visitantes')
        .select('id, nome, telefone, email, culto, melhor_horario, observacoes, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (busca) {
        const s = sanitize(busca);
        q = q.or(`nome.ilike.%${s}%,telefone.ilike.%${s}%`);
      }
      if (filtroStatus) q = q.eq('status', filtroStatus);

      const { data: rows, count, error } = await q;
      if (error) throw error;
      return { rows: (rows ?? []) as Visitante[], total: count ?? 0 };
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['recepcao_visitantes_historico'] });

  const editarMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormData }) => {
      const { error } = await (supabase as any).from('visitantes').update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        culto: form.culto || null,
        melhor_horario: form.melhor_horario || null,
        observacoes: form.observacoes.trim() || null,
        status: form.status,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success('Visitante atualizado!');
      setEditando(null);
      setFormEdicao(null);
    },
    onError: () => toast.error('Erro ao atualizar visitante'),
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('visitantes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success('Visitante removido.');
      setDeletandoId(null);
    },
    onError: () => toast.error('Erro ao remover visitante'),
  });

  function abrirEdicao(v: Visitante) {
    setFormEdicao(formDeVisitante(v));
    setEditando(v);
  }

  function abrirDelecao(v: Visitante) {
    setDeletandoId(v.id);
    setDeletandoNome(v.nome);
  }

  const totalPaginas = Math.ceil((data?.total ?? 0) / POR_PAGINA);

  const handleBusca = (val: string) => { setBusca(val); setPagina(1); };
  const handleStatus = (val: string) => { setFiltroStatus(val); setPagina(1); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Visitantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.total} visitante${data.total !== 1 ? 's' : ''}` : '…'}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou telefone…"
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          value={filtroStatus}
          onChange={(e) => handleStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(busca || filtroStatus) && (
          <Button variant="ghost" size="sm" onClick={() => { setBusca(''); setFiltroStatus(''); setPagina(1); }}>
            Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : !data?.rows.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca || filtroStatus ? 'Nenhum visitante encontrado.' : 'Nenhum visitante cadastrado.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.rows.map((v) => {
              const status = v.status ?? 'novo';
              return (
                <Card key={v.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{v.nome}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS['novo']}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {v.telefone && <span>{v.telefone}</span>}
                          {v.culto && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{v.culto}
                            </span>
                          )}
                          {v.created_at && (
                            <span>{format(new Date(v.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}</span>
                          )}
                        </div>
                        {v.observacoes && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <FileText className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/70" />
                            <p className="line-clamp-2 leading-relaxed">{v.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasValidPhone(v.telefone) && (
                          <a href={getWhatsAppUrl(v.telefone)} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                              <MessageCircle className="w-4 h-4 mr-1" />WhatsApp
                            </Button>
                          </a>
                        )}
                        {v.observacoes && (
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setVerObs(v)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(v)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => abrirDelecao(v)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                  Próxima<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Ver observações */}
      <Dialog open={!!verObs} onOpenChange={(v) => { if (!v) setVerObs(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações — {verObs?.nome}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{verObs?.observacoes}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerObs(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); setFormEdicao(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />Editar Visitante
            </DialogTitle>
          </DialogHeader>
          {formEdicao && (
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={formEdicao.nome} onChange={(e) => setFormEdicao((p) => p && ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={formEdicao.telefone} onChange={(e) => setFormEdicao((p) => p && ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={formEdicao.email} onChange={(e) => setFormEdicao((p) => p && ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Culto que visitou</Label>
                  <select
                    value={formEdicao.culto}
                    onChange={(e) => setFormEdicao((p) => p && ({ ...p, culto: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Selecione</option>
                    {CULTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Melhor horário</Label>
                  <select
                    value={formEdicao.melhor_horario}
                    onChange={(e) => setFormEdicao((p) => p && ({ ...p, melhor_horario: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Selecione</option>
                    {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={formEdicao.status}
                  onChange={(e) => setFormEdicao((p) => p && ({ ...p, status: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={formEdicao.observacoes} onChange={(e) => setFormEdicao((p) => p && ({ ...p, observacoes: e.target.value }))} placeholder="Informações adicionais..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditando(null); setFormEdicao(null); }}>Cancelar</Button>
            <Button
              disabled={!formEdicao?.nome.trim() || editarMutation.isPending}
              onClick={() => editando && formEdicao && editarMutation.mutate({ id: editando.id, form: formEdicao })}
            >
              {editarMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação: Excluir */}
      <AlertDialog open={!!deletandoId} onOpenChange={(v) => { if (!v) setDeletandoId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover visitante</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deletandoNome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletarMutation.isPending}
              onClick={() => deletandoId && deletarMutation.mutate(deletandoId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
