import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Plus, Trash2, Bell, CheckSquare, ArrowLeft, Calendar, Clock, Loader2,
  ChevronDown, ChevronUp, Pencil, Power,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Periodo {
  id: string;
  nome: string;
  mes: number;
  ano: number;
  status: string;
}

interface Ministerio {
  id: string;
  nome: string;
}

interface EventoMinisterio {
  id: string;
  ministerio_id: string;
  status: string;
  notificacao_enviada: boolean;
  ministerios: { nome: string } | null;
}

interface Evento {
  id: string;
  titulo: string;
  tipo: string;
  data_evento: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  descricao: string | null;
  status: string;
  evento_ministerios: EventoMinisterio[];
}

const TIPOS_EVENTO = ['culto', 'escola_biblica', 'ensaio', 'reuniao', 'conferencia', 'retiro', 'outro'];

export default function AdminEscalasPeriodoDetalhe() {
  const { id: periodoId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // church_id para eventos_escala (NOT NULL) — ministerios não tem essa coluna
  const { data: churchId } = useQuery({
    queryKey: ['church_id_igrejas'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvocacaoModalOpen, setIsConvocacaoModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [toDelete, setToDelete] = useState<Evento | null>(null);
  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set());

  const [eventoForm, setEventoForm] = useState({
    titulo: '',
    tipo: 'culto',
    data_evento: '',
    horario_inicio: '',
    horario_fim: '',
    descricao: '',
  });

  const [selectedMinisterios, setSelectedMinisterios] = useState<string[]>([]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: periodo, isLoading: loadingPeriodo } = useQuery({
    queryKey: ['periodo', periodoId],
    enabled: !!periodoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periodos_escala')
        .select('id, nome, mes, ano, status')
        .eq('id', periodoId!)
        .single();
      if (error) throw error;
      return data as Periodo;
    },
  });

  const { data: eventos = [], isLoading: loadingEventos } = useQuery({
    queryKey: ['eventos_escala', periodoId],
    enabled: !!periodoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos_escala')
        .select(`
          id, titulo, tipo, data_evento, horario_inicio, horario_fim, descricao, status,
          evento_ministerios(id, ministerio_id, status, notificacao_enviada, ministerios(nome))
        `)
        .eq('periodo_id', periodoId!)
        .order('data_evento', { ascending: true });
      if (error) throw error;
      return data as Evento[];
    },
  });

  const { data: ministerios = [] } = useQuery({
    queryKey: ['ministerios_ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data as Ministerio[];
    },
  });

  // ── Create evento ──────────────────────────────────────────────────────────
  const createEventoMutation = useMutation({
    mutationFn: async () => {
      const { data: ev, error } = await supabase
        .from('eventos_escala')
        .insert({
          periodo_id: periodoId!,
          church_id: churchId!,
          titulo: eventoForm.titulo.trim(),
          tipo: eventoForm.tipo,
          data_evento: eventoForm.data_evento,
          horario_inicio: eventoForm.horario_inicio || null,
          horario_fim: eventoForm.horario_fim || null,
          descricao: eventoForm.descricao.trim() || null,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (selectedMinisterios.length > 0) {
        const rows = selectedMinisterios.map((mid) => ({
          evento_id: ev.id,
          ministerio_id: mid,
        }));
        const { error: emErr } = await supabase.from('evento_ministerios').insert(rows);
        if (emErr) throw emErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Evento criado!');
      setIsEventoModalOpen(false);
      resetEventoForm();
    },
    onError: (e: Error) => toast.error('Erro ao criar evento', { description: e.message }),
  });

  // ── Delete evento ──────────────────────────────────────────────────────────
  const deleteEventoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos_escala').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Evento excluído');
      setToDelete(null);
    },
    onError: (e: Error) => {
      toast.error('Erro ao excluir', { description: e.message });
      setToDelete(null);
    },
  });

  // ── Update evento ──────────────────────────────────────────────────────────
  const updateEventoMutation = useMutation({
    mutationFn: async () => {
      if (!editingEvento) return;
      const { error } = await supabase
        .from('eventos_escala')
        .update({
          titulo: eventoForm.titulo.trim(),
          tipo: eventoForm.tipo,
          data_evento: eventoForm.data_evento,
          horario_inicio: eventoForm.horario_inicio || null,
          horario_fim: eventoForm.horario_fim || null,
          descricao: eventoForm.descricao.trim() || null,
        })
        .eq('id', editingEvento.id);
      if (error) throw error;

      // Replace ministerios: delete all then re-insert
      await supabase.from('evento_ministerios').delete().eq('evento_id', editingEvento.id);
      if (selectedMinisterios.length > 0) {
        const rows = selectedMinisterios.map((mid) => ({
          evento_id: editingEvento.id,
          ministerio_id: mid,
        }));
        const { error: emErr } = await supabase.from('evento_ministerios').insert(rows);
        if (emErr) throw emErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Evento atualizado!');
      setIsEditModalOpen(false);
      setEditingEvento(null);
      resetEventoForm();
    },
    onError: (e: Error) => toast.error('Erro ao atualizar evento', { description: e.message }),
  });

  // ── Toggle status ativo/inativo ────────────────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
      const { error } = await supabase
        .from('eventos_escala')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Status do evento atualizado!');
    },
    onError: (e: Error) => toast.error('Erro ao alterar status', { description: e.message }),
  });

  // ── Convocar ministérios ───────────────────────────────────────────────────
  const convocarMutation = useMutation({
    mutationFn: async ({ evento, ministerioIds }: { evento: Evento; ministerioIds: string[] }) => {
      const existingIds = evento.evento_ministerios.map((em) => em.ministerio_id);
      const novos = ministerioIds.filter((id) => !existingIds.includes(id));

      if (novos.length === 0) throw new Error('Todos esses ministérios já foram convocados.');

      const rows = novos.map((mid) => ({ evento_id: evento.id, ministerio_id: mid }));
      const { error } = await supabase.from('evento_ministerios').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Ministérios convocados!');
      setIsConvocacaoModalOpen(false);
      setSelectedMinisterios([]);
      setSelectedEvento(null);
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });

  // ── Send notification ──────────────────────────────────────────────────────
  const notificarMutation = useMutation({
    mutationFn: async (em: EventoMinisterio & { evento: Evento }) => {
      await supabase.functions.invoke('send-notification', {
        body: {
          target: 'ministerio',
          ministerio_id: em.ministerio_id,
          title: `Convocação: ${em.evento.titulo}`,
          body: `Você foi convocado para ${em.evento.titulo} em ${format(new Date(em.evento.data_evento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}. Acesse o app para criar a escala.`,
        },
      });
      const { error } = await supabase
        .from('evento_ministerios')
        .update({ notificacao_enviada: true })
        .eq('id', em.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos_escala', periodoId] });
      toast.success('Notificação enviada!');
    },
    onError: (e: Error) => toast.error('Erro ao notificar', { description: e.message }),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetEventoForm = () => {
    setEventoForm({ titulo: '', tipo: 'culto', data_evento: '', horario_inicio: '', horario_fim: '', descricao: '' });
    setSelectedMinisterios([]);
  };

  const openEditModal = (ev: Evento) => {
    setEditingEvento(ev);
    setEventoForm({
      titulo: ev.titulo,
      tipo: ev.tipo,
      data_evento: ev.data_evento,
      horario_inicio: ev.horario_inicio ?? '',
      horario_fim: ev.horario_fim ?? '',
      descricao: ev.descricao ?? '',
    });
    setSelectedMinisterios(ev.evento_ministerios.map((em) => em.ministerio_id));
    setIsEditModalOpen(true);
  };

  const toggleMinisterio = (id: string) => {
    setSelectedMinisterios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExpandEvento = (id: string) => {
    setExpandedEventos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'concluido') return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
    if (status === 'escala_criada') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Escala criada</Badge>;
    return <Badge variant="outline">Pendente</Badge>;
  };

  if (loadingPeriodo) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!periodo) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Período não encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/admin/escalas/periodos">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/escalas/periodos">
            <ArrowLeft className="w-4 h-4 mr-2" />Períodos
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold">{periodo.nome}</h2>
            <Badge variant={periodo.status === 'aberto' ? 'default' : 'secondary'}>
              {periodo.status === 'aberto' ? 'Aberto' : 'Fechado'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][periodo.mes - 1]} de {periodo.ano}
          </p>
        </div>
        {periodo.status === 'aberto' && (
          <Button onClick={() => setIsEventoModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo evento
          </Button>
        )}
      </div>

      {/* Eventos */}
      {loadingEventos ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : eventos.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum evento neste período.</p>
            {periodo.status === 'aberto' && (
              <Button variant="outline" onClick={() => setIsEventoModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro evento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventos.map((ev) => {
            const expanded = expandedEventos.has(ev.id);
            const isInativo = ev.status === 'inativo';
            return (
              <Card key={ev.id} className={isInativo ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{ev.titulo}</p>
                        <Badge variant="outline" className="text-xs capitalize">{ev.tipo.replace('_', ' ')}</Badge>
                        {isInativo && <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(ev.data_evento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {ev.horario_inicio && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ev.horario_inicio}{ev.horario_fim ? ` – ${ev.horario_fim}` : ''}
                          </span>
                        )}
                        <span>{ev.evento_ministerios.length} ministério(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {periodo.status === 'aberto' && !isInativo && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvento(ev);
                            setSelectedMinisterios([]);
                            setIsConvocacaoModalOpen(true);
                          }}
                        >
                          <Bell className="w-4 h-4 mr-1" />
                          Convocar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Editar evento"
                        onClick={() => openEditModal(ev)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title={isInativo ? 'Ativar evento' : 'Inativar evento'}
                        className={isInativo ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}
                        onClick={() => toggleStatusMutation.mutate({ id: ev.id, currentStatus: ev.status })}
                        disabled={toggleStatusMutation.isPending}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpandEvento(ev.id)}
                      >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setToDelete(ev)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Ministérios convocados */}
                  {expanded && ev.evento_ministerios.length > 0 && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ministérios convocados</p>
                      {ev.evento_ministerios.map((em) => (
                        <div key={em.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-muted-foreground" />
                            <span>{em.ministerios?.nome ?? em.ministerio_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(em.status)}
                            {!em.notificacao_enviada && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => notificarMutation.mutate({ ...em, evento: ev })}
                                disabled={notificarMutation.isPending}
                              >
                                <Bell className="w-3 h-3 mr-1" />
                                Notificar
                              </Button>
                            )}
                            {em.notificacao_enviada && (
                              <span className="text-xs text-muted-foreground">Notificado</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal Criar Evento ──────────────────────────────────────────────── */}
      <Dialog open={isEventoModalOpen} onOpenChange={(open) => { if (!open) { setIsEventoModalOpen(false); resetEventoForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo evento — {periodo.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={eventoForm.titulo}
                onChange={(e) => setEventoForm({ ...eventoForm, titulo: e.target.value })}
                placeholder="Ex: Culto de Domingo"
                disabled={createEventoMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={eventoForm.tipo} onValueChange={(v) => setEventoForm({ ...eventoForm, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={eventoForm.data_evento}
                  onChange={(e) => setEventoForm({ ...eventoForm, data_evento: e.target.value })}
                  disabled={createEventoMutation.isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário início</Label>
                <Input
                  type="time"
                  value={eventoForm.horario_inicio}
                  onChange={(e) => setEventoForm({ ...eventoForm, horario_inicio: e.target.value })}
                  disabled={createEventoMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário fim</Label>
                <Input
                  type="time"
                  value={eventoForm.horario_fim}
                  onChange={(e) => setEventoForm({ ...eventoForm, horario_fim: e.target.value })}
                  disabled={createEventoMutation.isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={eventoForm.descricao}
                onChange={(e) => setEventoForm({ ...eventoForm, descricao: e.target.value })}
                placeholder="Informações adicionais..."
                rows={2}
                disabled={createEventoMutation.isPending}
              />
            </div>
            {/* Ministérios */}
            <div className="space-y-2">
              <Label>Convocar ministérios (opcional)</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {ministerios.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedMinisterios.includes(m.id)}
                      onChange={() => toggleMinisterio(m.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{m.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEventoModalOpen(false); resetEventoForm(); }} disabled={createEventoMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!eventoForm.titulo.trim()) { toast.error('Informe o título'); return; }
                if (!eventoForm.data_evento) { toast.error('Informe a data'); return; }
                createEventoMutation.mutate();
              }}
              disabled={createEventoMutation.isPending}
            >
              {createEventoMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
                : 'Criar evento'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar Evento ─────────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { if (!open) { setIsEditModalOpen(false); setEditingEvento(null); resetEventoForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={eventoForm.titulo}
                onChange={(e) => setEventoForm({ ...eventoForm, titulo: e.target.value })}
                disabled={updateEventoMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={eventoForm.tipo} onValueChange={(v) => setEventoForm({ ...eventoForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={eventoForm.data_evento}
                  onChange={(e) => setEventoForm({ ...eventoForm, data_evento: e.target.value })}
                  disabled={updateEventoMutation.isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário início</Label>
                <Input type="time" value={eventoForm.horario_inicio} onChange={(e) => setEventoForm({ ...eventoForm, horario_inicio: e.target.value })} disabled={updateEventoMutation.isPending} />
              </div>
              <div className="space-y-2">
                <Label>Horário fim</Label>
                <Input type="time" value={eventoForm.horario_fim} onChange={(e) => setEventoForm({ ...eventoForm, horario_fim: e.target.value })} disabled={updateEventoMutation.isPending} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={eventoForm.descricao} onChange={(e) => setEventoForm({ ...eventoForm, descricao: e.target.value })} rows={2} disabled={updateEventoMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label>Ministérios convocados</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                {ministerios.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedMinisterios.includes(m.id)}
                      onChange={() => toggleMinisterio(m.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{m.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingEvento(null); resetEventoForm(); }} disabled={updateEventoMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!eventoForm.titulo.trim()) { toast.error('Informe o título'); return; }
                if (!eventoForm.data_evento) { toast.error('Informe a data'); return; }
                updateEventoMutation.mutate();
              }}
              disabled={updateEventoMutation.isPending}
            >
              {updateEventoMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                : 'Salvar alterações'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Convocar ──────────────────────────────────────────────────── */}
      <Dialog open={isConvocacaoModalOpen} onOpenChange={(open) => { if (!open) { setIsConvocacaoModalOpen(false); setSelectedMinisterios([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convocar ministérios — {selectedEvento?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">Selecione os ministérios a convocar para este evento:</p>
            <div className="border rounded-lg p-3 max-h-52 overflow-y-auto space-y-1">
              {ministerios.map((m) => {
                const jaConvocado = selectedEvento?.evento_ministerios.some((em) => em.ministerio_id === m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded ${jaConvocado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMinisterios.includes(m.id) || jaConvocado}
                      disabled={jaConvocado}
                      onChange={() => !jaConvocado && toggleMinisterio(m.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{m.nome}</span>
                    {jaConvocado && <span className="text-xs text-muted-foreground ml-auto">já convocado</span>}
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsConvocacaoModalOpen(false); setSelectedMinisterios([]); }} disabled={convocarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedEvento && convocarMutation.mutate({ evento: selectedEvento, ministerioIds: selectedMinisterios })}
              disabled={convocarMutation.isPending || selectedMinisterios.length === 0}
            >
              {convocarMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Convocando...</>
                : `Convocar ${selectedMinisterios.length > 0 ? `(${selectedMinisterios.length})` : ''}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar Exclusão ───────────────────────────────────────────────── */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento <strong>"{toDelete?.titulo}"</strong> e todas as escalas vinculadas serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEventoMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteEventoMutation.mutate(toDelete.id)}
              disabled={deleteEventoMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEventoMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
