import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Escala {
  id: string;
  data: string;
  turno: string | null;
  funcao: string;
  status: string;
  justificativa: string | null;
  ministerios: { nome: string } | null;
}

export default function LeaderEscalas() {
  const { profile } = useAuth();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [isRecusing, setIsRecusing] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchEscalas();
    }
  }, [profile]);

  const fetchEscalas = async () => {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('*, ministerios(nome)')
        .eq('voluntario_id', profile?.id)
        .order('data', { ascending: true });

      if (error) throw error;
      setEscalas(data || []);
    } catch (error) {
      console.error('Error fetching escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalas')
        .update({ status: 'confirmado' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Escala confirmada!');
      fetchEscalas();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao confirmar escala');
    }
  };

  const handleRecusar = async () => {
    if (!selectedEscala) return;
    if (!justificativa.trim()) {
      toast.error('Informe uma justificativa');
      return;
    }

    try {
      const { error } = await supabase
        .from('escalas')
        .update({ status: 'ausente', justificativa })
        .eq('id', selectedEscala.id);

      if (error) throw error;
      toast.success('Escala recusada');
      setSelectedEscala(null);
      setJustificativa('');
      setIsRecusing(false);
      fetchEscalas();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao recusar escala');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'ausente':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const isPast = (date: string) => new Date(date) < new Date();

  const groupedEscalas = {
    proximas: escalas.filter((e) => !isPast(e.data)),
    passadas: escalas.filter((e) => isPast(e.data)),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Minhas Escalas</h1>
        <p className="text-muted-foreground">Gerencie suas escalas de serviço</p>
      </div>

      {/* Próximas Escalas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Próximas Escalas</h2>
        {groupedEscalas.proximas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma escala programada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedEscalas.proximas.map((escala) => (
              <Card key={escala.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {format(new Date(escala.data), 'dd')}
                        </span>
                        <span className="text-xs text-primary uppercase">
                          {format(new Date(escala.data), 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-semibold">{escala.funcao}</p>
                        <p className="text-sm text-muted-foreground">
                          {escala.ministerios?.nome}
                          {escala.turno && ` • ${escala.turno}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(escala.status)}
                      {escala.status === 'pendente' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() => handleConfirmar(escala.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEscala(escala);
                              setIsRecusing(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Recusar
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

      {/* Escalas Passadas */}
      {groupedEscalas.passadas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Histórico</h2>
          <div className="space-y-3 opacity-60">
            {groupedEscalas.passadas.slice(0, 5).map((escala) => (
              <Card key={escala.id} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center">
                        <span className="text-sm font-bold">
                          {format(new Date(escala.data), 'dd')}
                        </span>
                        <span className="text-xs uppercase">
                          {format(new Date(escala.data), 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{escala.funcao}</p>
                        <p className="text-sm text-muted-foreground">
                          {escala.ministerios?.nome}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(escala.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Dialog de Recusa */}
      <Dialog open={isRecusing} onOpenChange={setIsRecusing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Escala</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual não poderá participar desta escala
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">{selectedEscala?.funcao}</p>
                  <p className="text-sm text-yellow-700">
                    {selectedEscala?.data && format(new Date(selectedEscala.data), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Explique o motivo da ausência..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecusing(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRecusar}>
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
