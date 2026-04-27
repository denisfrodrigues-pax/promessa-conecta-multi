import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogIn, LogOut, Clock, Users, Baby, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sala { id: string; nome: string }
interface Crianca { id: string; nome: string; sala_id: string | null }
interface Checkin {
  id: string;
  crianca_id: string;
  sala_id: string;
  checkin_at: string;
  checkout_at: string | null;
  mca_criancas: { nome: string } | null;
  mca_salas: { nome: string } | null;
}

const hoje = new Date();
const hojeStr = format(hoje, 'yyyy-MM-dd');

export default function Checkin() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { profile, user } = useAuth();
  const churchId = (profile as any)?.church_id as string | undefined;
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedSala, setSelectedSala] = useState('');
  const [realtime, setRealtime] = useState(true);

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
    queryKey: ['mca_checkins_hoje', churchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_checkins')
        .select('*, mca_criancas(nome), mca_salas(nome)')
        .eq('church_id', churchId)
        .gte('checkin_at', `${hojeStr}T00:00:00`)
        .lte('checkin_at', `${hojeStr}T23:59:59`)
        .order('checkin_at', { ascending: false });
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!churchId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!churchId) return;
    const channel = supabase
      .channel('mca_checkins_realtime')
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'mca_checkins',
        filter: `church_id=eq.${churchId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['mca_checkins_hoje', churchId] });
      })
      .subscribe((status: string) => {
        setRealtime(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [churchId, qc]);

  const checkinMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCrianca || !selectedSala) throw new Error('Selecione a criança e a sala');
      const { error } = await (supabase as any).from('mca_checkins').insert({
        crianca_id: selectedCrianca,
        sala_id: selectedSala,
        church_id: churchId,
        registrado_por: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_hoje', churchId] });
      toast.success('Check-in realizado!');
      setModalOpen(false);
      setSelectedCrianca('');
      setSelectedSala('');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar check-in'),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('mca_checkins').update({ checkout_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_hoje', churchId] });
      toast.success('Checkout registrado');
    },
    onError: () => toast.error('Erro ao registrar checkout'),
  });

  const presentes = checkins.filter(c => !c.checkout_at);
  const saidas = checkins.filter(c => c.checkout_at);

  // Group presentes by sala
  const porSala: Record<string, Checkin[]> = {};
  presentes.forEach(c => {
    const salaId = c.sala_id;
    if (!porSala[salaId]) porSala[salaId] = [];
    porSala[salaId].push(c);
  });

  function openCheckin(c: Crianca) {
    setSelectedCrianca(c.id);
    setSelectedSala(c.sala_id ?? '');
    setModalOpen(true);
  }

  const criancasPresentes = new Set(presentes.map(c => c.crianca_id));
  const criancasDisponiveis = criancas.filter(c => !criancasPresentes.has(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-promessa-900">Check-in</h1>
            <div className={`flex items-center gap-1 text-xs ${realtime ? 'text-green-600' : 'text-amber-500'}`}>
              <Wifi className="w-3.5 h-3.5" />
              {realtime ? 'Ao vivo' : 'Reconectando...'}
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => { setSelectedCrianca(''); setSelectedSala(''); setModalOpen(true); }}>
          <LogIn className="w-4 h-4 mr-2" />Check-in
        </Button>
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
            Nenhuma criança presente ainda hoje.
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
                      <div className="flex items-center gap-2">
                        <Baby className="w-4 h-4 text-promessa-400" />
                        <span className="text-sm font-medium">{ci.mca_criancas?.nome}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ci.checkin_at), 'HH:mm')}
                        </span>
                      </div>
                      <Button size="sm" variant="outline"
                        onClick={() => checkoutMutation.mutate(ci.id)}
                        disabled={checkoutMutation.isPending}>
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
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Saídas de hoje</h2>
          <div className="space-y-1">
            {saidas.map(ci => (
              <div key={ci.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 text-sm">
                <Baby className="w-3.5 h-3.5 text-neutral-400" />
                <span className="flex-1 text-neutral-500 line-through">{ci.mca_criancas?.nome}</span>
                <Badge variant="secondary" className="text-xs">
                  {ci.mca_salas?.nome} · saiu {format(new Date(ci.checkout_at!), 'HH:mm')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal check-in */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Check-in</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => checkinMutation.mutate()} disabled={checkinMutation.isPending || !selectedCrianca || !selectedSala}>
              {checkinMutation.isPending ? 'Registrando...' : 'Confirmar Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
