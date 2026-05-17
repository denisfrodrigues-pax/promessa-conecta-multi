import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar, Clock, Users, Plus, Trash2, Bell, CheckCircle,
  AlertCircle, XCircle, Loader2, CalendarDays, Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Voluntario {
  id: string;
  nome: string;
}

interface Funcao {
  id: string;
  nome: string;
}

interface EventoMinisterio {
  id: string;
  evento_id: string;
  ministerio_id: string;
  status: string;
  notificacao_enviada: boolean;
  eventos_escala: {
    id: string;
    titulo: string;
    tipo: string;
    data_evento: string;
    horario_inicio: string | null;
    horario_fim: string | null;
    descricao: string | null;
    periodos_escala: { nome: string } | null;
  } | null;
}

interface Escala {
  id: string;
  data: string;
  horario: string | null;
  funcao: string;
  status: string;
  justificativa: string | null;
  evento_escala_id: string | null;
  voluntario: { nome: string } | null;
  eventos_escala: { titulo: string } | null;
}

interface EscalaRow {
  funcao: string;
  voluntario_id: string;
  horario: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusIcon(status: string) {
  if (status === 'confirmado') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'ausente') return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-yellow-500" />;
}

function eventoStatusBadge(status: string) {
  if (status === 'concluido') return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
  if (status === 'escala_criada') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Escala criada</Badge>;
  return <Badge variant="outline">Pendente</Badge>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function LeaderEscalas() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Modal state — event-based escala creation/edit
  const [eventoParaCriar, setEventoParaCriar] = useState<EventoMinisterio | null>(null);
  const [escalasRows, setEscalasRows] = useState<EscalaRow[]>([{ funcao: '', voluntario_id: '', horario: '' }]);
  const [enviarNotificacao, setEnviarNotificacao] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingEscalasEvento, setLoadingEscalasEvento] = useState(false);

  // Modal state — direct escala creation (legacy)
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [directForm, setDirectForm] = useState({ data: '', horario: '', funcao: '', voluntario_id: '' });

  // Delete state
  const [toDelete, setToDelete] = useState<Escala | null>(null);
  const [deleteEscalaConfirm, setDeleteEscalaConfirm] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: eventosConvocados = [], isLoading: loadingEventos } = useQuery({
    queryKey: ['evento_ministerios_lider', ministerioId],
    enabled: !!ministerioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_ministerios')
        .select(`
          id, evento_id, ministerio_id, status, notificacao_enviada,
          eventos_escala(
            id, titulo, tipo, data_evento, horario_inicio, horario_fim, descricao,
            periodos_escala(nome)
          )
        `)
        .eq('ministerio_id', ministerioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EventoMinisterio[];
    },
  });

  const { data: escalas = [], isLoading: loadingEscalas } = useQuery({
    queryKey: ['escalas_lider', ministerioId],
    enabled: !!ministerioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          id, data, horario, funcao, status, justificativa, evento_escala_id,
          voluntario:profiles!escalas_voluntario_id_fkey(nome),
          eventos_escala(titulo)
        `)
        .eq('ministerio_id', ministerioId)
        .order('data', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Escala[];
    },
  });

  const { data: voluntarios = [] } = useQuery({
    queryKey: ['voluntarios_ministerio', ministerioId],
    enabled: !!ministerioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerio_usuarios')
        .select('profiles(id, nome)')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true);
      if (error) throw error;
      return (data ?? []).flatMap((d) => (d.profiles ? [d.profiles as Voluntario] : []));
    },
  });

  const { data: funcoes = [] } = useQuery({
    queryKey: ['funcoes_ministerio', ministerioId],
    enabled: !!ministerioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, nome')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data as Funcao[];
    },
  });

  // ── Create escalas from event ──────────────────────────────────────────────

  const criarEscalaMutation = useMutation({
    mutationFn: async () => {
      if (!eventoParaCriar?.eventos_escala) throw new Error('Evento inválido');
      const ev = eventoParaCriar.eventos_escala;

      const rows = escalasRows.filter((r) => r.funcao && r.voluntario_id);
      if (rows.length === 0) throw new Error('Adicione pelo menos um voluntário com função');

      // In edit mode: delete existing escalas for this event first
      if (isEditMode) {
        const { error: delErr } = await supabase
          .from('escalas')
          .delete()
          .eq('ministerio_id', ministerioId)
          .eq('evento_escala_id', ev.id);
        if (delErr) throw delErr;
      }

      const agora = new Date().toISOString();
      const inserts = rows.map((r) => {
        const isLider = r.voluntario_id === profile?.id;
        return {
          ministerio_id: ministerioId,
          evento_escala_id: ev.id,
          data: ev.data_evento,
          horario: r.horario || ev.horario_inicio || null,
          funcao: r.funcao,
          voluntario_id: r.voluntario_id,
          responsavel_id: profile?.id ?? null,
          status: isLider ? 'confirmado' : 'pendente',
          confirmado_em: isLider ? agora : null,
        };
      });

      const { error: insertErr } = await supabase.from('escalas').insert(inserts);
      if (insertErr) throw insertErr;

      // Only update evento_ministerios status when creating (not editing — already escala_criada)
      if (!isEditMode) {
        const { error: updErr } = await supabase
          .from('evento_ministerios')
          .update({ status: 'escala_criada' })
          .eq('id', eventoParaCriar.id);
        if (updErr) throw updErr;
      }

      if (enviarNotificacao) {
        await supabase.functions.invoke('send-notification', {
          body: {
            titulo: isEditMode ? `Escala atualizada: ${ev.titulo}` : `Nova escala: ${ev.titulo}`,
            mensagem: `A escala para ${ev.titulo} (${format(new Date(ev.data_evento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}) foi ${isEditMode ? 'atualizada' : 'criada'}. Verifique sua convocação.`,
            tipo: 'nova_escala',
            send_to_ministerio: ministerioId,
            url: '/app/escalas',
          },
        });
        await supabase
          .from('evento_ministerios')
          .update({ notificacao_enviada: true })
          .eq('id', eventoParaCriar.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento_ministerios_lider', ministerioId] });
      queryClient.invalidateQueries({ queryKey: ['escalas_lider', ministerioId] });
      toast.success(isEditMode ? 'Escala atualizada!' : 'Escala criada!');
      setEventoParaCriar(null);
      setEscalasRows([{ funcao: '', voluntario_id: '', horario: '' }]);
      setEnviarNotificacao(true);
      setIsEditMode(false);
    },
    onError: (e: Error) => toast.error(isEditMode ? 'Erro ao atualizar escala' : 'Erro ao criar escala', { description: e.message }),
  });

  // ── Create direct escala (legacy) ──────────────────────────────────────────

  const directMutation = useMutation({
    mutationFn: async () => {
      const isLider = directForm.voluntario_id === profile?.id;
      const agora = new Date().toISOString();
      const { error } = await supabase.from('escalas').insert({
        ministerio_id: ministerioId,
        data: directForm.data,
        horario: directForm.horario || null,
        funcao: directForm.funcao,
        voluntario_id: directForm.voluntario_id || null,
        responsavel_id: profile?.id ?? null,
        status: isLider ? 'confirmado' : 'pendente',
        confirmado_em: isLider ? agora : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas_lider', ministerioId] });
      toast.success('Escala criada!');
      setIsDirectModalOpen(false);
      setDirectForm({ data: '', horario: '', funcao: '', voluntario_id: '' });
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });

  // ── Delete escala ──────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('escalas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalas_lider', ministerioId] });
      toast.success('Escala excluída');
      setToDelete(null);
    },
    onError: (e: Error) => {
      toast.error('Erro', { description: e.message });
      setToDelete(null);
    },
  });

  // ── Delete full escala for an event ───────────────────────────────────────

  const excluirEscalaMutation = useMutation({
    mutationFn: async () => {
      if (!eventoParaCriar?.eventos_escala) throw new Error('Evento inválido');
      const evId = eventoParaCriar.eventos_escala.id;
      const { error: delErr } = await supabase
        .from('escalas')
        .delete()
        .eq('ministerio_id', ministerioId)
        .eq('evento_escala_id', evId);
      if (delErr) throw delErr;
      const { error: updErr } = await supabase
        .from('evento_ministerios')
        .update({ status: 'pendente' })
        .eq('id', eventoParaCriar.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento_ministerios_lider', ministerioId] });
      queryClient.invalidateQueries({ queryKey: ['escalas_lider', ministerioId] });
      toast.success('Escala excluída');
      setDeleteEscalaConfirm(false);
      setEventoParaCriar(null);
      setEscalasRows([{ funcao: '', voluntario_id: '', horario: '' }]);
      setIsEditMode(false);
    },
    onError: (e: Error) => toast.error('Erro ao excluir escala', { description: e.message }),
  });

  // ── Edit existing escala ───────────────────────────────────────────────────

  const openEditModal = async (em: EventoMinisterio) => {
    if (!em.eventos_escala) return;
    setLoadingEscalasEvento(true);
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('id, funcao, voluntario_id, horario')
        .eq('ministerio_id', ministerioId)
        .eq('evento_escala_id', em.eventos_escala.id);
      if (error) throw error;
      const rows: EscalaRow[] = (data ?? []).map((e) => ({
        funcao: e.funcao ?? '',
        voluntario_id: e.voluntario_id ?? '',
        horario: e.horario ?? '',
      }));
      setEscalasRows(rows.length > 0 ? rows : [{ funcao: '', voluntario_id: '', horario: '' }]);
      setIsEditMode(true);
      setEnviarNotificacao(false);
      setEventoParaCriar(em);
    } catch {
      toast.error('Erro ao carregar escala existente');
    } finally {
      setLoadingEscalasEvento(false);
    }
  };

  // ── Row helpers ────────────────────────────────────────────────────────────

  const addRow = () => setEscalasRows((r) => [...r, { funcao: '', voluntario_id: '', horario: '' }]);

  const updateRow = (idx: number, field: keyof EscalaRow, value: string) => {
    setEscalasRows((rows) => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRow = (idx: number) => {
    if (escalasRows.length === 1) return;
    setEscalasRows((rows) => rows.filter((_, i) => i !== idx));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Escalas</h2>
          <p className="text-sm text-muted-foreground">Gerencie as escalas do ministério</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsDirectModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Escala avulsa
        </Button>
      </div>

      <Tabs defaultValue="eventos">
        <TabsList>
          <TabsTrigger value="eventos">
            Eventos convocados
            {eventosConvocados.filter((e) => e.status === 'pendente').length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-promessa-500 text-white">
                {eventosConvocados.filter((e) => e.status === 'pendente').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico de escalas</TabsTrigger>
        </TabsList>

        {/* ── Tab: Eventos convocados ─────────────────────────────────────── */}
        <TabsContent value="eventos" className="mt-4">
          {loadingEventos ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : eventosConvocados.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center space-y-2">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhuma convocação recebida ainda.</p>
                <p className="text-sm text-muted-foreground/70">Quando o admin convocar seu ministério para um evento, ele aparecerá aqui.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {eventosConvocados.map((em) => {
                const ev = em.eventos_escala;
                if (!ev) return null;
                return (
                  <Card key={em.id} className={em.status === 'pendente' ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{ev.titulo}</p>
                            <Badge variant="outline" className="text-xs capitalize">{ev.tipo}</Badge>
                            {eventoStatusBadge(em.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(ev.data_evento + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            {ev.horario_inicio && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ev.horario_inicio}{ev.horario_fim ? ` – ${ev.horario_fim}` : ''}
                              </span>
                            )}
                            {ev.periodos_escala && (
                              <span className="text-muted-foreground/70">{ev.periodos_escala.nome}</span>
                            )}
                          </div>
                          {ev.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">{ev.descricao}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {em.status === 'pendente' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setEventoParaCriar(em);
                                setEscalasRows([{ funcao: '', voluntario_id: '', horario: '' }]);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Criar escala
                            </Button>
                          )}
                          {em.status === 'escala_criada' && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-600 font-medium">Escala enviada</span>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={loadingEscalasEvento}
                                onClick={() => openEditModal(em)}
                              >
                                {loadingEscalasEvento
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <><Pencil className="w-4 h-4 mr-1" />Editar</>
                                }
                              </Button>
                            </div>
                          )}
                          {em.status === 'concluido' && (
                            <span className="text-sm text-green-600 font-medium">Concluído</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Histórico ──────────────────────────────────────────────── */}
        <TabsContent value="historico" className="mt-4">
          {loadingEscalas ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : escalas.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center space-y-2">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhuma escala criada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {escalas.map((e) => (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {statusIcon(e.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{e.voluntario?.nome ?? 'Voluntário'}</p>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{e.funcao}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span>{format(new Date(e.data + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          {e.horario && <span>{e.horario}</span>}
                          {e.eventos_escala && (
                            <span className="text-primary/70">{e.eventos_escala.titulo}</span>
                          )}
                          <Badge variant={e.status === 'confirmado' ? 'default' : e.status === 'ausente' ? 'destructive' : 'secondary'} className="text-xs">
                            {e.status}
                          </Badge>
                        </div>
                        {e.justificativa && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Justificativa: "{e.justificativa}"
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setToDelete(e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modal: Criar Escala para Evento ─────────────────────────────────── */}
      <Dialog
        open={!!eventoParaCriar}
        onOpenChange={(open) => { if (!open) { setEventoParaCriar(null); setEscalasRows([{ funcao: '', voluntario_id: '', horario: '' }]); setIsEditMode(false); } }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar escala' : 'Criar escala'} — {eventoParaCriar?.eventos_escala?.titulo}
            </DialogTitle>
            {eventoParaCriar?.eventos_escala && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(eventoParaCriar.eventos_escala.data_evento + 'T12:00:00'), 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                {eventoParaCriar.eventos_escala.horario_inicio && ` · ${eventoParaCriar.eventos_escala.horario_inicio}`}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {escalasRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_100px_36px] gap-2 items-end">
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Função *</Label>}
                  <Select value={row.funcao} onValueChange={(v) => updateRow(idx, 'funcao', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Função..." />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                      <SelectItem value="__outro__">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Voluntário *</Label>}
                  <Select value={row.voluntario_id} onValueChange={(v) => updateRow(idx, 'voluntario_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Voluntário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {voluntarios.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Horário</Label>}
                  <Input
                    type="time"
                    value={row.horario}
                    onChange={(e) => updateRow(idx, 'horario', e.target.value)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeRow(idx)}
                  disabled={escalasRows.length === 1}
                  style={{ marginTop: idx === 0 ? '22px' : '0' }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addRow} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar voluntário
            </Button>

            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="notif"
                checked={enviarNotificacao}
                onChange={(e) => setEnviarNotificacao(e.target.checked)}
                className="accent-primary"
              />
              <label htmlFor="notif" className="text-sm cursor-pointer">
                <Bell className="w-4 h-4 inline mr-1 text-muted-foreground" />
                Notificar membros do ministério ao criar a escala
              </label>
            </div>
          </div>

          <DialogFooter className="flex-row items-center gap-2">
            {isEditMode && (
              <Button
                variant="destructive"
                onClick={() => setDeleteEscalaConfirm(true)}
                disabled={criarEscalaMutation.isPending || excluirEscalaMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir escala
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => { setEventoParaCriar(null); setEscalasRows([{ funcao: '', voluntario_id: '', horario: '' }]); setIsEditMode(false); }}
              disabled={criarEscalaMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={() => criarEscalaMutation.mutate()} disabled={criarEscalaMutation.isPending}>
              {criarEscalaMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditMode ? 'Salvando...' : 'Criando...'}</>
                : isEditMode ? 'Salvar alterações' : 'Publicar escala'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Escala Avulsa ─────────────────────────────────────────────── */}
      <Dialog open={isDirectModalOpen} onOpenChange={(open) => { if (!open) setIsDirectModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escala avulsa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={directForm.data}
                  onChange={(e) => setDirectForm({ ...directForm, data: e.target.value })}
                  disabled={directMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={directForm.horario}
                  onChange={(e) => setDirectForm({ ...directForm, horario: e.target.value })}
                  disabled={directMutation.isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Função *</Label>
              <Select value={directForm.funcao} onValueChange={(v) => setDirectForm({ ...directForm, funcao: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {funcoes.map((f) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}
                  <SelectItem value="Geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voluntário</Label>
              <Select value={directForm.voluntario_id} onValueChange={(v) => setDirectForm({ ...directForm, voluntario_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {voluntarios.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDirectModalOpen(false)} disabled={directMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!directForm.data) { toast.error('Informe a data'); return; }
                if (!directForm.funcao) { toast.error('Informe a função'); return; }
                directMutation.mutate();
              }}
              disabled={directMutation.isPending}
            >
              {directMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
                : 'Criar'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar Exclusão de Escala Completa ───────────────────────────── */}
      <AlertDialog open={deleteEscalaConfirm} onOpenChange={(open) => { if (!open) setDeleteEscalaConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala completa?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os voluntários escalados para <strong>{eventoParaCriar?.eventos_escala?.titulo}</strong> serão removidos e o evento voltará ao status pendente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirEscalaMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluirEscalaMutation.mutate()}
              disabled={excluirEscalaMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirEscalaMutation.isPending ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirmar Exclusão ───────────────────────────────────────────────── */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir escala?</AlertDialogTitle>
            <AlertDialogDescription>
              A escala de <strong>{toDelete?.voluntario?.nome}</strong> ({toDelete?.funcao}) será excluída permanentemente.
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
