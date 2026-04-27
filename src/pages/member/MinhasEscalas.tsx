import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, History, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseLocalDate, isDatePast } from '@/lib/dateUtils';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ministerio {
  nome: string;
}

interface Escala {
  id: string;
  data: string;
  horario: string | null;
  funcao: string;
  status: 'pendente' | 'confirmado' | 'ausente';
  justificativa: string | null;
  confirmado_em: string | null;
  ministerio_id: string | null;
  voluntario_id: string | null;
  ministerios: Ministerio | null;
  eventos_escala: { titulo: string } | null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EscalaStatusBadge({ status }: { status: Escala['status'] }) {
  if (status === 'confirmado') {
    return (
      <Badge variant="success">
        <CheckCircle className="w-3 h-3 mr-1" />
        Confirmado
      </Badge>
    );
  }
  if (status === 'ausente') {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Recusado
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Clock className="w-3 h-3 mr-1" />
      Pendente
    </Badge>
  );
}

function EscalaDateBox({ dateStr, compact }: { dateStr: string; compact?: boolean }) {
  const parsed = parseLocalDate(dateStr);
  const day = format(parsed, 'dd');
  const month = format(parsed, 'MMM', { locale: ptBR });

  if (compact) {
    return (
      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold">{day}</span>
        <span className="text-xs uppercase">{month}</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-lg font-bold text-primary">{day}</span>
      <span className="text-xs text-primary uppercase">{month}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MinhasEscalas() {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();

  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecusing, setIsRecusing] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [justificativa, setJustificativa] = useState('');

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchEscalas = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('*, ministerios(nome), eventos_escala(titulo)')
        .eq('voluntario_id', profile.id)
        .order('data', { ascending: true });

      if (error) throw error;
      setEscalas((data ?? []) as Escala[]);
    } catch (err) {
      console.error('fetchEscalas error:', err);
      toast.error('Erro ao carregar escalas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchEscalas();
    }
  }, [profile]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleConfirmar = async (escala: Escala) => {
    if (escala.status !== 'pendente') return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('escalas')
        .update({
          status: 'confirmado',
          confirmado_em: new Date().toISOString(),
        })
        .eq('id', escala.id);

      if (error) throw error;
      toast.success('Escala confirmada com sucesso!');
      await fetchEscalas();
    } catch (err) {
      console.error('handleConfirmar error:', err);
      toast.error('Erro ao confirmar escala');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRecusar = (escala: Escala) => {
    setSelectedEscala(escala);
    setJustificativa('');
    setIsRecusing(true);
  };

  const closeRecusar = () => {
    setIsRecusing(false);
    setSelectedEscala(null);
    setJustificativa('');
  };

  const handleRecusar = async () => {
    if (!selectedEscala) return;
    if (!justificativa.trim()) {
      toast.error('Informe uma justificativa');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('escalas')
        .update({
          status: 'ausente',
          justificativa,
          confirmado_em: new Date().toISOString(),
        })
        .eq('id', selectedEscala.id);

      if (error) throw error;
      toast.success('Resposta registrada');
      closeRecusar();
      await fetchEscalas();
    } catch (err) {
      console.error('handleRecusar error:', err);
      toast.error('Erro ao recusar escala');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Derived state ────────────────────────────────────────────────────────

  const proximas = escalas.filter((e) => !isDatePast(e.data));
  const passadas = escalas.filter((e) => isDatePast(e.data));
  const canSeeVoluntariosDoDia = roles.some((r) =>
    ['admin', 'lider', 'voluntario'].includes(r)
  );

  // ─── Loading skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted rounded-lg animate-pulse" />
                  <div className="h-4 w-48 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Minhas Escalas</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e confirme sua participação nas escalas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canSeeVoluntariosDoDia && (
            <Button
              variant="default"
              size="sm"
              className="shadow-sm"
              onClick={() => navigate('/app/voluntarios-do-dia')}
            >
              <ClipboardCheck className="w-4 h-4 mr-1" />
              Escala do Dia
            </Button>
          )}
          <Link to="/historico-escalas">
            <Button variant="outline" size="sm" className="shadow-sm">
              <History className="w-4 h-4 mr-1" />
              Histórico
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">

        {/* Próximas Escalas */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximas Escalas
          </h2>

          {proximas.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma escala programada</p>
              </CardContent>
            </Card>
          )}

          {proximas.length > 0 && (
            <div className="space-y-3">
              {proximas.map((escala) => (
                <Card key={escala.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                      <div className="flex items-center gap-4">
                        <EscalaDateBox dateStr={escala.data} />
                        <div>
                          <p className="font-display font-semibold">{escala.funcao}</p>
                          <p className="text-sm text-muted-foreground">
                            {escala.ministerios?.nome}
                            {escala.horario ? ` • ${escala.horario}` : ''}
                          </p>
                          {escala.eventos_escala?.titulo && (
                            <p className="text-xs text-primary/70 mt-0.5">{escala.eventos_escala.titulo}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <EscalaStatusBadge status={escala.status} />

                        {escala.status === 'pendente' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={isSubmitting}
                              onClick={() => handleConfirmar(escala)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isSubmitting}
                              onClick={() => openRecusar(escala)}
                              className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Não posso
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Histórico */}
        {passadas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Histórico</h2>
            <div className="space-y-3">
              {passadas.slice(0, 10).map((escala) => (
                <Card key={escala.id} className="shadow-soft opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <EscalaDateBox dateStr={escala.data} compact />
                        <div>
                          <p className="font-medium">{escala.funcao}</p>
                          <p className="text-sm text-muted-foreground">
                            {escala.ministerios?.nome}
                          </p>
                        </div>
                      </div>
                      <EscalaStatusBadge status={escala.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Dialog: Recusar Escala */}
      <Dialog
        open={isRecusing}
        onOpenChange={(open) => {
          if (!open) closeRecusar();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Recusar Escala
            </DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual não poderá participar desta escala.
            </DialogDescription>
          </DialogHeader>

          {selectedEscala !== null && (
            <div className="py-4">
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="font-medium">{selectedEscala.funcao}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedEscala.ministerios?.nome}
                  {' • '}
                  {format(parseLocalDate(selectedEscala.data), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa *</Label>
                <Textarea
                  id="justificativa"
                  placeholder="Ex: Tenho outro compromisso neste horário..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={closeRecusar}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting || !justificativa.trim()}
              onClick={handleRecusar}
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
