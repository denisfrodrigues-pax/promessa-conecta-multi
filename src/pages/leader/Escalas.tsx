import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Escala {
  id: string;
  data: string;
  turno: string | null;
  horario: string | null;
  funcao: string;
  status: string;
  status_geral: string | null;
  justificativa: string | null;
  ministerio_id: string | null;
  voluntario_id: string | null;
  responsavel_id: string | null;
  ministerios: { nome: string } | null;
  voluntario: { nome: string } | null;
}

interface EscalaGroup {
  key: string;
  ministerio_id: string | null;
  data: string;
  horario: string | null;
  funcao: string;
  turno: string | null;
  status_geral: string | null;
  ministerio_nome: string | null;
  voluntarios: Array<{
    id: string;
    voluntario_id: string;
    nome: string;
    status: string;
    justificativa: string | null;
  }>;
}

export default function LeaderEscalas() {
  const { profile, isLider } = useAuth();
  const [minhasEscalas, setMinhasEscalas] = useState<Escala[]>([]);
  const [escalasGerenciadas, setEscalasGerenciadas] = useState<EscalaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscala, setSelectedEscala] = useState<Escala | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [isRecusing, setIsRecusing] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<EscalaGroup | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMinhasEscalas(),
      fetchEscalasGerenciadas(),
    ]);
    setLoading(false);
  };

  const fetchMinhasEscalas = async () => {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('*, ministerios(nome), voluntario:profiles!escalas_voluntario_id_fkey(nome)')
        .eq('voluntario_id', profile?.id)
        .order('data', { ascending: true });

      if (error) throw error;
      setMinhasEscalas(data || []);
    } catch (error) {
      console.error('Error fetching escalas:', error);
    }
  };

  const fetchEscalasGerenciadas = async () => {
    if (!isLider) return;
    
    try {
      // Fetch escalas where this user is the responsavel
      const { data, error } = await supabase
        .from('escalas')
        .select('*, ministerios(nome), voluntario:profiles!escalas_voluntario_id_fkey(nome)')
        .eq('responsavel_id', profile?.id)
        .order('data', { ascending: true });

      if (error) throw error;
      
      // Group escalas
      const groups = groupEscalas(data || []);
      setEscalasGerenciadas(groups);
    } catch (error) {
      console.error('Error fetching escalas gerenciadas:', error);
    }
  };

  const groupEscalas = (escalas: Escala[]): EscalaGroup[] => {
    const groupMap = new Map<string, EscalaGroup>();
    
    escalas.forEach((escala) => {
      const key = `${escala.ministerio_id}-${escala.data}-${escala.funcao}-${escala.turno || ''}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          ministerio_id: escala.ministerio_id,
          data: escala.data,
          horario: escala.horario,
          funcao: escala.funcao,
          turno: escala.turno,
          status_geral: escala.status_geral,
          ministerio_nome: escala.ministerios?.nome || null,
          voluntarios: [],
        });
      }
      
      const group = groupMap.get(key)!;
      if (escala.voluntario_id && escala.voluntario) {
        group.voluntarios.push({
          id: escala.id,
          voluntario_id: escala.voluntario_id,
          nome: escala.voluntario.nome,
          status: escala.status,
          justificativa: escala.justificativa,
        });
      }
    });
    
    return Array.from(groupMap.values());
  };

  const handleConfirmar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalas')
        .update({ 
          status: 'confirmado',
          confirmado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Escala confirmada!');
      fetchData();
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
        .update({ 
          status: 'ausente', 
          justificativa,
          confirmado_em: new Date().toISOString()
        })
        .eq('id', selectedEscala.id);

      if (error) throw error;
      toast.success('Escala recusada');
      setSelectedEscala(null);
      setJustificativa('');
      setIsRecusing(false);
      fetchData();
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

  const getStatusGeralBadge = (status: string | null) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-blue-100 text-blue-700">Ativa</Badge>;
      case 'concluida':
        return <Badge className="bg-gray-100 text-gray-700">Concluída</Badge>;
      default:
        return <Badge className="bg-purple-100 text-purple-700">Planejada</Badge>;
    }
  };

  const getVoluntariosStatusSummary = (voluntarios: EscalaGroup['voluntarios']) => {
    const confirmados = voluntarios.filter((v) => v.status === 'confirmado').length;
    const pendentes = voluntarios.filter((v) => v.status === 'pendente').length;
    const ausentes = voluntarios.filter((v) => v.status === 'ausente').length;
    
    return { confirmados, pendentes, ausentes, total: voluntarios.length };
  };

  const isPast = (date: string) => new Date(date) < new Date();

  const groupedMinhasEscalas = {
    proximas: minhasEscalas.filter((e) => !isPast(e.data)),
    passadas: minhasEscalas.filter((e) => isPast(e.data)),
  };

  const groupedEscalasGerenciadas = {
    proximas: escalasGerenciadas.filter((e) => !isPast(e.data)),
    passadas: escalasGerenciadas.filter((e) => isPast(e.data)),
  };

  const renderMinhasEscalas = () => (
    <div className="space-y-6">
      {/* Próximas Escalas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Próximas Escalas</h2>
        {groupedMinhasEscalas.proximas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma escala programada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedMinhasEscalas.proximas.map((escala) => (
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
                          {escala.horario && ` • ${escala.horario}`}
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
      {groupedMinhasEscalas.passadas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Histórico</h2>
          <div className="space-y-3 opacity-60">
            {groupedMinhasEscalas.passadas.slice(0, 5).map((escala) => (
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
    </div>
  );

  const renderEscalasGerenciadas = () => (
    <div className="space-y-6">
      {/* Próximas Escalas Gerenciadas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Próximas Escalas</h2>
        {groupedEscalasGerenciadas.proximas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma escala sob sua responsabilidade
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedEscalasGerenciadas.proximas.map((group) => {
              const summary = getVoluntariosStatusSummary(group.voluntarios);
              return (
                <Card key={group.key} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(group.data), 'dd')}
                          </span>
                          <span className="text-xs text-primary uppercase">
                            {format(new Date(group.data), 'MMM', { locale: ptBR })}
                          </span>
                        </div>
                        <div>
                          <p className="font-display font-semibold">{group.funcao}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.ministerio_nome}
                            {group.turno && ` • ${group.turno}`}
                            {group.horario && ` • ${group.horario}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{summary.total}</span>
                          <div className="flex gap-1">
                            {summary.confirmados > 0 && (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                                {summary.confirmados} ✓
                              </Badge>
                            )}
                            {summary.pendentes > 0 && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
                                {summary.pendentes} ⏳
                              </Badge>
                            )}
                            {summary.ausentes > 0 && (
                              <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                {summary.ausentes} ✗
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingGroup(group);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Escalas Passadas */}
      {groupedEscalasGerenciadas.passadas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Histórico</h2>
          <div className="space-y-3 opacity-60">
            {groupedEscalasGerenciadas.passadas.slice(0, 5).map((group) => {
              const summary = getVoluntariosStatusSummary(group.voluntarios);
              return (
                <Card key={group.key} className="shadow-soft cursor-pointer" onClick={() => {
                  setViewingGroup(group);
                  setIsViewDialogOpen(true);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center">
                          <span className="text-sm font-bold">
                            {format(new Date(group.data), 'dd')}
                          </span>
                          <span className="text-xs uppercase">
                            {format(new Date(group.data), 'MMM', { locale: ptBR })}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{group.funcao}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.ministerio_nome} • {summary.total} voluntário(s)
                          </p>
                        </div>
                      </div>
                      {getStatusGeralBadge(group.status_geral)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Minhas Escalas</h1>
        <p className="text-muted-foreground">Gerencie suas escalas de serviço</p>
      </div>

      {isLider ? (
        <Tabs defaultValue="minhas">
          <TabsList>
            <TabsTrigger value="minhas">Minhas Escalas</TabsTrigger>
            <TabsTrigger value="gerenciadas">Escalas que Gerencio</TabsTrigger>
          </TabsList>
          <TabsContent value="minhas">
            {renderMinhasEscalas()}
          </TabsContent>
          <TabsContent value="gerenciadas">
            {renderEscalasGerenciadas()}
          </TabsContent>
        </Tabs>
      ) : (
        renderMinhasEscalas()
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

      {/* View Dialog - Show all volunteers and their status */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Escala</DialogTitle>
            <DialogDescription>
              Status de cada voluntário nesta escala
            </DialogDescription>
          </DialogHeader>
          
          {viewingGroup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="font-medium">{format(new Date(viewingGroup.data), 'dd/MM/yyyy')}</span>
                </div>
                {viewingGroup.horario && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Horário:</span>
                    <span className="font-medium">{viewingGroup.horario}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <span className="font-medium">{viewingGroup.funcao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ministério:</span>
                  <span className="font-medium">{viewingGroup.ministerio_nome || '-'}</span>
                </div>
              </div>

              {/* Status Counters */}
              {(() => {
                const summary = getVoluntariosStatusSummary(viewingGroup.voluntarios);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{summary.confirmados}</p>
                      <p className="text-xs text-emerald-600 font-medium">Confirmados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{summary.pendentes}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pendentes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-center">
                      <p className="text-2xl font-bold text-red-600">{summary.ausentes}</p>
                      <p className="text-xs text-red-600 font-medium">Recusados</p>
                    </div>
                  </div>
                );
              })()}

              {/* Grouped Volunteers by Status */}
              <div className="space-y-4">
                {/* Confirmados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <p className="font-medium">{vol.nome}</p>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pendentes */}
                {viewingGroup.voluntarios.filter(v => v.status === 'pendente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pendentes
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'pendente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                          <p className="font-medium">{vol.nome}</p>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recusados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'ausente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-700 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Recusados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'ausente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                          <div>
                            <p className="font-medium">{vol.nome}</p>
                            {vol.justificativa && (
                              <p className="text-sm text-red-600/80 mt-1">
                                Justificativa: {vol.justificativa}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(vol.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
