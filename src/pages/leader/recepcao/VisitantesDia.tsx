import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { MessageCircle, UserCheck, Calendar, Loader2, Users, UserPlus, Pencil, Trash2, FileText, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  data_visita: string | null;
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

const PROXIMO_STATUS: Record<string, string> = {
  novo: 'contato_iniciado',
};

const CULTOS = ['Sábado', 'Base', 'Ação Social', 'Outro'];
const HORARIOS = ['Manhã', 'Tarde', 'Noite', 'Qualquer horário'];

const cleanPhone = (phone: string | null) => (phone ?? '').replace(/\D/g, '');
const hasValidPhone = (phone: string | null) => cleanPhone(phone).length >= 10;

const getWhatsAppUrl = (phone: string | null) => {
  const msg = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/55${cleanPhone(phone)}?text=${msg}`;
};

const formVazio = () => ({
  nome: '', telefone: '', email: '', culto: '', melhor_horario: '', observacoes: '',
});

type FormData = ReturnType<typeof formVazio>;

function VisitanteFormFields({
  form,
  onChange,
  showStatus,
  status,
  onStatusChange,
}: {
  form: FormData;
  onChange: (patch: Partial<FormData>) => void;
  showStatus?: boolean;
  status?: string;
  onStatusChange?: (s: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Nome *</Label>
        <Input value={form.nome} onChange={(e) => onChange({ nome: e.target.value })} placeholder="Nome completo" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Telefone</Label>
          <Input value={form.telefone} onChange={(e) => onChange({ telefone: e.target.value })} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="email@exemplo.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Culto que visitou</Label>
          <select
            value={form.culto}
            onChange={(e) => onChange({ culto: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {CULTOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Melhor horário para contato</Label>
          <select
            value={form.melhor_horario}
            onChange={(e) => onChange({ melhor_horario: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {showStatus && onStatusChange && (
        <div>
          <Label>Status</Label>
          <select
            value={status ?? 'novo'}
            onChange={(e) => onStatusChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      )}

      <div>
        <Label>Observações</Label>
        <Textarea value={form.observacoes} onChange={(e) => onChange({ observacoes: e.target.value })} placeholder="Informações adicionais..." rows={3} />
      </div>
    </div>
  );
}

export default function VisitantesDia() {
  const queryClient = useQueryClient();
  const [filtroData, setFiltroData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [avancando, setAvancando] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [novoVisitante, setNovoVisitante] = useState(formVazio());

  const [editando, setEditando] = useState<Visitante | null>(null);
  const [formEdicao, setFormEdicao] = useState<FormData & { status: string }>(
    { ...formVazio(), status: 'novo' }
  );

  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [verObs, setVerObs] = useState<Visitante | null>(null);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['recepcao_visitantes_dia', filtroData] });

  const { data: visitantes, isLoading } = useQuery({
    queryKey: ['recepcao_visitantes_dia', filtroData],
    queryFn: async () => {
      const dataInicio = new Date(`${filtroData}T00:00:00`).toISOString();
      const dataFim = new Date(`${filtroData}T23:59:59`).toISOString();

      const { data, error } = await (supabase as any)
        .from('visitantes')
        .select('id, nome, telefone, email, culto, melhor_horario, observacoes, status, created_at, data_visita')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Visitante[];
    },
  });

  const avancarStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: string }) => {
      const { error } = await (supabase as any).from('visitantes').update({ status: novoStatus }).eq('id', id);
      if (error) throw error;
    },
    onMutate: ({ id }) => setAvancando(id),
    onSuccess: (_, { novoStatus }) => {
      invalidar();
      toast.success(`Status atualizado para "${STATUS_LABELS[novoStatus]}"`);
    },
    onError: () => toast.error('Erro ao atualizar status'),
    onSettled: () => setAvancando(null),
  });

  const registrarMutation = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await (supabase as any).from('visitantes').insert({
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        culto: form.culto || null,
        melhor_horario: form.melhor_horario || null,
        observacoes: form.observacoes.trim() || null,
        status: 'novo',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success('Visitante registrado!');
      setModalAberto(false);
      setNovoVisitante(formVazio());
    },
    onError: () => toast.error('Erro ao registrar visitante'),
  });

  const editarMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormData & { status: string } }) => {
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
      queryClient.invalidateQueries({ queryKey: ['recepcao_visitantes_historico'] });
      toast.success('Visitante atualizado!');
      setEditando(null);
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
      queryClient.invalidateQueries({ queryKey: ['recepcao_visitantes_historico'] });
      toast.success('Visitante removido.');
      setDeletandoId(null);
    },
    onError: () => toast.error('Erro ao remover visitante'),
  });

  function abrirEdicao(v: Visitante) {
    setFormEdicao({
      nome: v.nome,
      telefone: v.telefone ?? '',
      email: v.email ?? '',
      culto: v.culto ?? '',
      melhor_horario: v.melhor_horario ?? '',
      observacoes: v.observacoes ?? '',
      status: v.status ?? 'novo',
    });
    setEditando(v);
  }

  const ehHoje = filtroData === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitantes do Dia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ehHoje ? 'Visitantes de hoje' : `Visitantes de ${format(parseISO(filtroData), "d 'de' MMMM", { locale: ptBR })}`}
            {visitantes && ` · ${visitantes.length} registro${visitantes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="w-44"
          />
          {!ehHoje && (
            <Button variant="outline" size="sm" onClick={() => setFiltroData(format(new Date(), 'yyyy-MM-dd'))}>
              Hoje
            </Button>
          )}
          <Button size="sm" onClick={() => setModalAberto(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Registrar Visitante
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : !visitantes || visitantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {ehHoje ? 'Nenhum visitante registrado hoje.' : 'Nenhum visitante nesta data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitantes.map((v) => {
            const status = v.status ?? 'novo';
            const proximoStatus = PROXIMO_STATUS[status];

            return (
              <Card key={v.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{v.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS['novo']}`}>
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {v.telefone && <span>{v.telefone}</span>}
                        {v.culto && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {v.culto}
                          </span>
                        )}
                        {v.created_at && (
                          <span className="text-xs">
                            {format(new Date(v.created_at), 'HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {v.observacoes && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                          <p className="line-clamp-2 leading-relaxed">{v.observacoes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasValidPhone(v.telefone) && (
                        <a href={getWhatsAppUrl(v.telefone)} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </a>
                      )}
                      {proximoStatus && (
                        <Button
                          size="sm"
                          disabled={avancando === v.id}
                          onClick={() => avancarStatusMutation.mutate({ id: v.id, novoStatus: proximoStatus })}
                        >
                          {avancando === v.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><UserCheck className="w-4 h-4 mr-1" />{STATUS_LABELS[proximoStatus]}</>}
                        </Button>
                      )}
                      {v.observacoes && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setVerObs(v)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletandoId(v.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar */}
      <Dialog open={modalAberto} onOpenChange={(v) => { setModalAberto(v); if (!v) setNovoVisitante(formVazio()); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />Registrar Visitante
            </DialogTitle>
          </DialogHeader>
          <VisitanteFormFields
            form={novoVisitante}
            onChange={(p) => setNovoVisitante((prev) => ({ ...prev, ...p }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              disabled={!novoVisitante.nome.trim() || registrarMutation.isPending}
              onClick={() => registrarMutation.mutate(novoVisitante)}
            >
              {registrarMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editando} onOpenChange={(v) => { if (!v) setEditando(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />Editar Visitante
            </DialogTitle>
          </DialogHeader>
          <VisitanteFormFields
            form={formEdicao}
            onChange={(p) => setFormEdicao((prev) => ({ ...prev, ...p }))}
            showStatus
            status={formEdicao.status}
            onStatusChange={(s) => setFormEdicao((prev) => ({ ...prev, status: s }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button
              disabled={!formEdicao.nome.trim() || editarMutation.isPending}
              onClick={() => editando && editarMutation.mutate({ id: editando.id, form: formEdicao })}
            >
              {editarMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Confirmação: Excluir */}
      <AlertDialog open={!!deletandoId} onOpenChange={(v) => { if (!v) setDeletandoId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover visitante</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const v = visitantes?.find((x) => x.id === deletandoId);
                return `Deseja remover "${v?.nome ?? 'este visitante'}"? Esta ação não pode ser desfeita.`;
              })()}
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
