import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
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
import { LogIn, LogOut, Clock, Users, Baby, Wifi, CalendarDays, Maximize } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useMcaCheckin, todayStr, isVisitanteCheckin, checkinNome,
  type McaSala as Sala, type McaCheckinRow as Checkin,
} from '@/hooks/useMcaCheckin';

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
  const { p } = useIgrejaSlug();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedSala, setSelectedSala] = useState('');

  // Visitor fields
  const [isVisitante, setIsVisitante] = useState(false);
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [responsavelVisitante, setResponsavelVisitante] = useState('');
  const [nascVisitante, setNascVisitante] = useState('');

  // Post-checkin visitor dialogs
  const [visitanteInfo, setVisitanteInfo] = useState<{ nome: string; responsavel: string; nasc: string } | null>(null);
  const [showCadastrarForm, setShowCadastrarForm] = useState(false);

  function resetModal() {
    setSelectedCrianca('');
    setSelectedSala('');
    setIsVisitante(false);
    setNomeVisitante('');
    setResponsavelVisitante('');
    setNascVisitante('');
  }

  const {
    churchId, isToday, realtime, salas, criancasDisponiveis, checkins, isLoading,
    presentes, saidas, porSala, checkinMutation, checkoutMutation, invalidateCriancas,
  } = useMcaCheckin(ministerioId, selectedDate);

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
          <Button variant="outline" asChild>
            <Link to="quiosque">
              <Maximize className="w-4 h-4 mr-2" />Modo Quiosque
            </Link>
          </Button>
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
                        {isVisitanteCheckin(ci) && (
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
                {isVisitanteCheckin(ci) && (
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
                  const c = criancasDisponiveis.find(x => x.id === v);
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
              onClick={() => checkinMutation.mutate({
                salaId: selectedSala,
                criancaId: isVisitante ? undefined : selectedCrianca,
                visitante: isVisitante ? { nome: nomeVisitante, responsavel: responsavelVisitante } : undefined,
              }, {
                onSuccess: () => {
                  setModalOpen(false);
                  if (isVisitante) {
                    setVisitanteInfo({ nome: nomeVisitante.trim(), responsavel: responsavelVisitante.trim(), nasc: nascVisitante });
                  }
                  resetModal();
                },
              })}
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
            invalidateCriancas();
          }}
        />
      )}
    </div>
  );
}
