import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogIn, LogOut, Clock, Users, Baby, Wifi, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sala { id: string; nome: string }
interface Crianca { id: string; nome: string; sala_id: string | null }
interface Checkin {
  id: string;
  crianca_id: string | null;
  sala_id: string;
  checkin_at: string;
  checkout_at: string | null;
  visitante: boolean;
  nome_visitante: string | null;
  responsavel_visitante: string | null;
  mca_criancas: { nome: string } | null;
  mca_salas: { nome: string } | null;
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

function checkinNome(ci: Checkin): string {
  return ci.visitante && ci.nome_visitante ? ci.nome_visitante : (ci.mca_criancas?.nome ?? '–');
}

// ── Cadastrar visitante como membro ──────────────────────────────────────────

interface CadastrarProps {
  open: boolean;
  nome: string;
  responsavel: string;
  nasc: string;
  salas: Sala[];
  churchId: string;
  onClose: () => void;
  onSaved: () => void;
}

function CadastrarVisitanteForm({ open, nome, responsavel, nasc, salas, churchId, onClose, onSaved }: CadastrarProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', data_nascimento: '', sala_id: 'none', observacoes: '' });

  useEffect(() => {
    if (open) {
      setForm({
        nome,
        data_nascimento: nasc,
        sala_id: 'none',
        observacoes: responsavel ? `Responsável: ${responsavel}` : '',
      });
    }
  }, [open, nome, nasc, responsavel]);

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('mca_criancas').insert({
        church_id: churchId,
        nome: form.nome.trim(),
        data_nascimento: form.data_nascimento || null,
        sala_id: form.sala_id === 'none' ? null : form.sala_id || null,
        observacoes: form.observacoes.trim() || null,
        ativo: true,
      });
      if (error) throw error;
      toast.success(`${form.nome.trim()} cadastrada com sucesso!`);
      onSaved();
    } catch {
      toast.error('Erro ao cadastrar criança');
    } finally {
      setSaving(false);
    }
  };

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar como Membro Kids</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setF('nome', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => setF('data_nascimento', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Sala</Label>
            <Select value={form.sala_id} onValueChange={v => setF('sala_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar sala" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem sala</SelectItem>
                {salas.filter(s => s.id).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Input
              value={form.observacoes}
              onChange={e => setF('observacoes', e.target.value)}
              placeholder="Responsável, contato..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Checkin({ ministerioId: propMid }: { ministerioId?: string } = {}) {
  const ctx = useOutletContext<{ ministerioId: string } | null>();
  const ministerioId = propMid ?? ctx?.ministerioId ?? '';
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedSala, setSelectedSala] = useState('');
  const [realtime, setRealtime] = useState(true);

  // Visitor fields
  const [isVisitante, setIsVisitante] = useState(false);
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [responsavelVisitante, setResponsavelVisitante] = useState('');
  const [nascVisitante, setNascVisitante] = useState('');

  // Post-checkin visitor dialogs
  const [visitanteInfo, setVisitanteInfo] = useState<{ nome: string; responsavel: string; nasc: string } | null>(null);
  const [showCadastrarForm, setShowCadastrarForm] = useState(false);

  const isToday = selectedDate === todayStr();

  function resetModal() {
    setSelectedCrianca('');
    setSelectedSala('');
    setIsVisitante(false);
    setNomeVisitante('');
    setResponsavelVisitante('');
    setNascVisitante('');
  }

  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

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

  const { data: criancas = [] } = useQuery({
    queryKey: ['mca_criancas', churchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_criancas').select('id, nome, sala_id').eq('church_id', churchId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Crianca[];
    },
    enabled: !!churchId,
  });

  const { data: checkins = [], isLoading } = useQuery({
    queryKey: ['mca_checkins_dia', churchId, selectedDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_checkins')
        .select('*, mca_criancas(nome), mca_salas(nome)')
        .eq('church_id', churchId)
        .gte('checkin_at', `${selectedDate}T00:00:00`)
        .lte('checkin_at', `${selectedDate}T23:59:59`)
        .order('checkin_at', { ascending: false });
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!churchId,
  });

  useEffect(() => {
    if (!churchId || !isToday) return;
    const channel = supabase
      .channel('mca_checkins_realtime')
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'mca_checkins',
        filter: `church_id=eq.${churchId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      })
      .subscribe((status: string) => {
        setRealtime(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [churchId, isToday, selectedDate, qc]);

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSala) throw new Error('Selecione a sala');
      if (isVisitante) {
        if (!nomeVisitante.trim()) throw new Error('Nome da criança é obrigatório');
        if (!responsavelVisitante.trim()) throw new Error('Nome do responsável é obrigatório');
      } else {
        if (!selectedCrianca) throw new Error('Selecione a criança');
      }
      const checkinAt = isToday
        ? new Date().toISOString()
        : `${selectedDate}T12:00:00.000Z`;

      const payload: Record<string, any> = {
        sala_id: selectedSala,
        church_id: churchId,
        registrado_por: user?.id,
        checkin_at: checkinAt,
        visitante: isVisitante,
        crianca_id: isVisitante ? null : selectedCrianca,
      };
      if (isVisitante) {
        payload.nome_visitante = nomeVisitante.trim();
        payload.responsavel_visitante = responsavelVisitante.trim();
      }

      const { error } = await (supabase as any).from('mca_checkins').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      toast.success('Check-in realizado!');
      setModalOpen(false);
      if (isVisitante) {
        setVisitanteInfo({ nome: nomeVisitante.trim(), responsavel: responsavelVisitante.trim(), nasc: nascVisitante });
      }
      resetModal();
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar check-in'),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const checkoutAt = isToday
        ? new Date().toISOString()
        : `${selectedDate}T13:00:00.000Z`;
      const { error } = await (supabase as any)
        .from('mca_checkins').update({ checkout_at: checkoutAt }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      toast.success('Checkout registrado');
    },
    onError: () => toast.error('Erro ao registrar checkout'),
  });

  const presentes = checkins.filter(c => !c.checkout_at);
  const saidas = checkins.filter(c => c.checkout_at);

  const porSala: Record<string, Checkin[]> = {};
  presentes.forEach(c => {
    if (!porSala[c.sala_id]) porSala[c.sala_id] = [];
    porSala[c.sala_id].push(c);
  });

  function openCheckin(c: Crianca) {
    resetModal();
    setSelectedCrianca(c.id);
    setSelectedSala(c.sala_id ?? '');
    setModalOpen(true);
  }

  const criancasPresentes = new Set(presentes.filter(c => c.crianca_id).map(c => c.crianca_id!));
  const criancasDisponiveis = criancas.filter(c => !criancasPresentes.has(c.id));

  const canConfirm = isVisitante
    ? (!!selectedSala && !!nomeVisitante.trim() && !!responsavelVisitante.trim())
    : (!!selectedCrianca && !!selectedSala);

  const dataFormatada = format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-promessa-900">Check-in</h1>
            {isToday && (
              <div className={`flex items-center gap-1 text-xs ${realtime ? 'text-green-600' : 'text-amber-500'}`}>
                <Wifi className="w-3.5 h-3.5" />
                {realtime ? 'Ao vivo' : 'Reconectando...'}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{dataFormatada}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-8 w-40 text-sm"
            />
          </div>
          <Button onClick={() => { resetModal(); setModalOpen(true); }}>
            <LogIn className="w-4 h-4 mr-2" />Check-in
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-promessa-700">{presentes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Presentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-neutral-500">{saidas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Saídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-neutral-700">{checkins.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Por sala */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : presentes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isToday ? 'Nenhuma criança presente ainda hoje.' : 'Nenhum check-in registrado nesta data.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(porSala).map(([salaId, items]) => {
            const sala = salas.find(s => s.id === salaId);
            return (
              <Card key={salaId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-promessa-600" />
                    {sala?.nome ?? 'Sala'} — {items.length} criança{items.length !== 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map(ci => (
                    <div key={ci.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Baby className="w-4 h-4 text-promessa-400 shrink-0" />
                        <span className="text-sm font-medium">{checkinNome(ci)}</span>
                        {ci.visitante && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-1.5 py-0">
                            Visitante
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ci.checkin_at), 'HH:mm')}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkoutMutation.mutate(ci.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1" />Saída
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Histórico de saídas */}
      {saidas.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Saídas {isToday ? 'de hoje' : 'do dia'}
          </h2>
          <div className="space-y-1">
            {saidas.map(ci => (
              <div key={ci.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 text-sm">
                <Baby className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="flex-1 text-neutral-500 line-through">{checkinNome(ci)}</span>
                {ci.visitante && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Visitante</Badge>
                )}
                <Badge variant="secondary" className="text-xs shrink-0">
                  {ci.mca_salas?.nome} · saiu {format(new Date(ci.checkout_at!), 'HH:mm')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal check-in */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) { setModalOpen(false); resetModal(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrar Check-in
              {!isToday && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({format(new Date(selectedDate + 'T12:00:00'), 'dd/MM/yyyy')})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle visitante */}
            <div className="flex items-center gap-3 pb-3 border-b">
              <Switch
                id="visitante-toggle"
                checked={isVisitante}
                onCheckedChange={v => {
                  setIsVisitante(v);
                  setSelectedCrianca('');
                  setSelectedSala('');
                }}
              />
              <Label htmlFor="visitante-toggle" className="cursor-pointer font-medium">
                É visitante?
              </Label>
            </div>

            {isVisitante ? (
              <>
                <div>
                  <Label className="text-sm font-medium">Nome da criança *</Label>
                  <Input
                    className="mt-1"
                    value={nomeVisitante}
                    onChange={e => setNomeVisitante(e.target.value)}
                    placeholder="Nome completo"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nome do responsável *</Label>
                  <Input
                    className="mt-1"
                    value={responsavelVisitante}
                    onChange={e => setResponsavelVisitante(e.target.value)}
                    placeholder="Pai, mãe ou responsável"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de nascimento</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={nascVisitante}
                    onChange={e => setNascVisitante(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium">Criança *</label>
                <Select value={selectedCrianca} onValueChange={v => {
                  setSelectedCrianca(v);
                  const c = criancas.find(x => x.id === v);
                  if (c?.sala_id) setSelectedSala(c.sala_id);
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar criança" />
                  </SelectTrigger>
                  <SelectContent>
                    {criancasDisponiveis.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                    {criancasDisponiveis.length === 0 && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Todas as crianças já fizeram check-in.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Sala *</label>
              <Select value={selectedSala} onValueChange={setSelectedSala}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar sala" />
                </SelectTrigger>
                <SelectContent>
                  {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetModal(); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isPending || !canConfirm}
            >
              {checkinMutation.isPending ? 'Registrando...' : 'Confirmar Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: "Deseja cadastrar como membro?" */}
      <Dialog
        open={!!visitanteInfo && !showCadastrarForm}
        onOpenChange={open => { if (!open) setVisitanteInfo(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar como membro?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-1">
            Deseja cadastrar <strong>{visitanteInfo?.nome}</strong> como membro Kids?
          </p>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setVisitanteInfo(null)}>
              Agora não
            </Button>
            <Button onClick={() => setShowCadastrarForm(true)}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulário de cadastro do visitante */}
      {visitanteInfo && (
        <CadastrarVisitanteForm
          open={showCadastrarForm}
          nome={visitanteInfo.nome}
          responsavel={visitanteInfo.responsavel}
          nasc={visitanteInfo.nasc}
          salas={salas}
          churchId={churchId ?? ''}
          onClose={() => { setShowCadastrarForm(false); setVisitanteInfo(null); }}
          onSaved={() => {
            setShowCadastrarForm(false);
            setVisitanteInfo(null);
            qc.invalidateQueries({ queryKey: ['mca_criancas', churchId] });
          }}
        />
      )}
    </div>
  );
}
