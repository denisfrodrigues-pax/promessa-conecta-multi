import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BookOpen, Users, ClipboardList, BarChart3, Download, UserPlus,
  AlertTriangle, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

const CHURCH_ID = 'e19bf49a-4532-4fd9-98af-5b5682e50cd6';
const MES_ATUAL = new Date().getMonth() + 1;

const MES_NOMES: Record<number, string> = {
  1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
  8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov',
};

interface Ciclo { id: string; nome: string; subtitulo: string; ordem: number }
interface Disciplina { id: string; ciclo_id: string; mes: number; eixo_tematico: string; titulo: string; subtitulo: string; ordem: number }
interface Aula { id: string; disciplina_id: string; numero: number; titulo: string }
interface Matricula { id: string; perfil_id: string; ciclo_id: string; ativo: boolean; perfis: { nome: string } | null }
interface Presenca { id: string; perfil_id: string; aula_id: string; disciplina_id: string; presente: boolean }
interface MembroDisp { id: string; nome: string | null }

export default function EscolaBiblica() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const [selectedDiscId, setSelectedDiscId] = useState('');
  const [selectedAulaNum, setSelectedAulaNum] = useState('1');
  const [presencaLocal, setPresencaLocal] = useState<Record<string, boolean>>({});
  const [savingChamada, setSavingChamada] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [matriculaCicloId, setMatriculaCicloId] = useState('');
  const [matriculaMembroId, setMatriculaMembroId] = useState('');
  const [savingMatricula, setSavingMatricula] = useState(false);

  const { data: ciclos = [], isLoading: loadingCiclos } = useQuery<Ciclo[]>({
    queryKey: ['eb_ciclos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_ciclos')
        .select('*').eq('church_id', CHURCH_ID).order('ordem');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: disciplinas = [] } = useQuery<Disciplina[]>({
    queryKey: ['eb_disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_disciplinas').select('*').order('ordem');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: aulas = [] } = useQuery<Aula[]>({
    queryKey: ['eb_aulas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_aulas').select('*').order('numero');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: matriculas = [], isLoading: loadingMatriculas } = useQuery<Matricula[]>({
    queryKey: ['eb_matriculas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_matriculas')
        .select('*, perfis(nome)').eq('ativo', true);
      if (error) throw error;
      return (data || []) as Matricula[];
    },
  });

  const { data: presencas = [] } = useQuery<Presenca[]>({
    queryKey: ['eb_presencas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_presencas').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // perfis.id = perfil_id em eb_matriculas
  const { data: membrosDisp = [] } = useQuery<MembroDisp[]>({
    queryKey: ['perfis_lista'],
    queryFn: async () => {
      const { data, error } = await supabase.from('perfis')
        .select('id, nome').order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: showModal,
  });

  // Auto-select current month discipline on first load
  useEffect(() => {
    if (disciplinas.length > 0) {
      setSelectedDiscId(prev => {
        if (prev) return prev;
        return disciplinas.find(d => d.mes === MES_ATUAL)?.id || disciplinas[0].id;
      });
    }
  }, [disciplinas]);

  const selectedAulaId = useMemo(() => {
    if (!selectedDiscId || !selectedAulaNum) return '';
    return aulas.find(a => a.disciplina_id === selectedDiscId && a.numero === parseInt(selectedAulaNum))?.id || '';
  }, [selectedDiscId, selectedAulaNum, aulas]);

  // Sync toggles when aula changes
  useEffect(() => {
    if (!selectedAulaId) return;
    const init: Record<string, boolean> = {};
    presencas.filter(p => p.aula_id === selectedAulaId).forEach(p => { init[p.perfil_id] = p.presente; });
    setPresencaLocal(init);
  }, [selectedAulaId, presencas]);

  const membrosNaCiclo = useMemo(() => {
    const disc = disciplinas.find(d => d.id === selectedDiscId);
    if (!disc) return [];
    return matriculas.filter(m => m.ciclo_id === disc.ciclo_id);
  }, [selectedDiscId, disciplinas, matriculas]);

  const isAlreadyRecorded = useMemo(
    () => presencas.some(p => p.aula_id === selectedAulaId),
    [selectedAulaId, presencas],
  );

  const matriculaStats = useMemo(() => matriculas.map(m => {
    const cicloDiscs = disciplinas.filter(d => d.ciclo_id === m.ciclo_id && d.mes <= MES_ATUAL);
    const allAulas = cicloDiscs.flatMap(d => aulas.filter(a => a.disciplina_id === d.id));
    const total = allAulas.length;
    const present = allAulas.filter(a =>
      presencas.some(p => p.aula_id === a.id && p.perfil_id === m.perfil_id && p.presente)
    ).length;
    const pastDiscs = disciplinas
      .filter(d => d.ciclo_id === m.ciclo_id && d.mes < MES_ATUAL)
      .sort((a, b) => b.mes - a.mes).slice(0, 2);
    const hasAlert = pastDiscs.length >= 2 && pastDiscs.every(d => {
      const da = aulas.filter(a => a.disciplina_id === d.id);
      return !da.some(a => presencas.some(p => p.aula_id === a.id && p.perfil_id === m.perfil_id && p.presente));
    });
    return {
      ...m,
      nome: m.perfis?.nome || 'Desconhecido',
      total, present,
      percent: total > 0 ? Math.round((present / total) * 100) : 0,
      hasAlert,
    };
  }), [matriculas, disciplinas, aulas, presencas]);

  const relatorioDiscs = useMemo(
    () => disciplinas.filter(d => d.mes <= MES_ATUAL),
    [disciplinas],
  );

  const relatorioRows = useMemo(() => ciclos.map(ciclo => {
    const discs = relatorioDiscs.filter(d => d.ciclo_id === ciclo.id);
    const members = matriculas.filter(m => m.ciclo_id === ciclo.id);
    const rows = members.map(m => {
      const counts: Record<string, number> = {};
      discs.forEach(d => {
        const da = aulas.filter(a => a.disciplina_id === d.id);
        counts[d.id] = da.filter(a =>
          presencas.some(p => p.aula_id === a.id && p.perfil_id === m.perfil_id && p.presente)
        ).length;
      });
      return { perfil_id: m.perfil_id, nome: m.perfis?.nome || '?', counts };
    });
    return { ciclo, discs, rows };
  }), [ciclos, relatorioDiscs, matriculas, aulas, presencas]);

  const enrolledPerfilIds = useMemo(() => matriculas.map(m => m.perfil_id), [matriculas]);
  // perfis.id já é o perfil_id
  const membrosParaMatricula = useMemo(
    () => membrosDisp.filter(m => !enrolledPerfilIds.includes(m.id)),
    [membrosDisp, enrolledPerfilIds],
  );

  const handleSaveChamada = async () => {
    if (!selectedAulaId) { toast.error('Selecione uma disciplina e aula'); return; }
    setSavingChamada(true);
    try {
      await supabase.from('eb_presencas').delete().eq('aula_id', selectedAulaId);
      if (membrosNaCiclo.length > 0) {
        const { error } = await supabase.from('eb_presencas').insert(
          membrosNaCiclo.map(m => ({
            perfil_id: m.perfil_id,
            aula_id: selectedAulaId,
            disciplina_id: selectedDiscId,
            data_presenca: new Date().toISOString().slice(0, 10),
            presente: presencaLocal[m.perfil_id] ?? false,
            registrado_por: profile?.id,
          }))
        );
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['eb_presencas'] });
      toast.success('Chamada salva com sucesso');
    } catch {
      toast.error('Erro ao salvar chamada');
    } finally {
      setSavingChamada(false);
    }
  };

  const handleMatricular = async () => {
    if (!matriculaCicloId || !matriculaMembroId) return;
    // matriculaMembroId é perfis.id = perfil_id diretamente
    setSavingMatricula(true);
    try {
      const { error } = await supabase.from('eb_matriculas').insert({
        perfil_id: matriculaMembroId,
        ciclo_id: matriculaCicloId,
        data_inicio: new Date().toISOString().slice(0, 10),
        ativo: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['eb_matriculas'] });
      toast.success('Matrícula realizada com sucesso');
      setShowModal(false); setMatriculaCicloId(''); setMatriculaMembroId('');
    } catch {
      toast.error('Erro ao matricular membro');
    } finally {
      setSavingMatricula(false);
    }
  };

  const exportCSV = () => {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const lines: string[] = [];
    relatorioRows.forEach(({ ciclo, discs, rows }) => {
      if (rows.length === 0) return;
      lines.push(`"${ciclo.nome}"`);
      lines.push(['Nome', ...discs.map(d => `${d.titulo} (${MES_NOMES[d.mes] || 'M' + d.mes})`)].map(h => `"${h}"`).join(';'));
      rows.forEach(r => {
        lines.push([r.nome, ...discs.map(d => String(r.counts[d.id] ?? 0))].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
      });
      lines.push('');
    });
    const blob = new Blob([bom, lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `frequencia_eb_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cellColor = (n: number) =>
    n >= 3 ? 'bg-green-100 text-green-800' :
    n === 2 ? 'bg-amber-100 text-amber-800' :
    n === 1 ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-500';

  if (loadingCiclos) return (
    <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Escola Bíblica</h1>
        <p className="text-muted-foreground">Gerenciamento de matrículas e frequência</p>
      </div>

      <Tabs defaultValue="grade">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grade" className="text-xs sm:text-sm">
            <BookOpen className="w-4 h-4 mr-1 hidden sm:inline" />Grade
          </TabsTrigger>
          <TabsTrigger value="matriculas" className="text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 hidden sm:inline" />Matrículas
          </TabsTrigger>
          <TabsTrigger value="chamada" className="text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 mr-1 hidden sm:inline" />Chamada
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" />Relatório
          </TabsTrigger>
        </TabsList>

        {/* ── GRADE CURRICULAR ── */}
        <TabsContent value="grade" className="space-y-8 mt-6">
          {ciclos.map(ciclo => (
            <div key={ciclo.id}>
              <h2 className="text-lg font-semibold mb-1">{ciclo.nome}</h2>
              <p className="text-sm text-muted-foreground mb-3">{ciclo.subtitulo}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {disciplinas.filter(d => d.ciclo_id === ciclo.id).map(d => (
                  <Card key={d.id} className={d.mes === MES_ATUAL ? 'ring-2 ring-promessa-600 shadow-md' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{d.eixo_tematico}</p>
                          <p className="font-semibold text-sm mt-0.5 leading-tight">{d.titulo}</p>
                          {d.subtitulo && <p className="text-xs text-muted-foreground mt-1">{d.subtitulo}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={d.mes === MES_ATUAL ? 'default' : 'outline'} className="text-xs">
                            {MES_NOMES[d.mes] || `M${d.mes}`}
                          </Badge>
                          {d.mes === MES_ATUAL && (
                            <p className="text-xs text-promessa-600 font-medium mt-1">Atual</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── MATRÍCULAS ── */}
        <TabsContent value="matriculas" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{matriculas.length} matriculado(s)</p>
              <p className="text-sm text-muted-foreground">
                {matriculaStats.filter(m => m.hasAlert).length} com alerta de ausência
              </p>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />Matricular Membro
            </Button>
          </div>

          {loadingMatriculas ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : ciclos.map(ciclo => {
            const stats = matriculaStats.filter(m => m.ciclo_id === ciclo.id);
            if (stats.length === 0) return null;
            return (
              <div key={ciclo.id}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {ciclo.nome}
                </h3>
                <div className="space-y-2">
                  {stats.map(m => (
                    <Card key={m.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{m.nome}</span>
                            {m.hasAlert && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />Ausências
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${m.percent >= 75 ? 'bg-green-500' : m.percent >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${m.percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {m.present}/{m.total} aulas ({m.percent}%)
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {matriculas.length === 0 && !loadingMatriculas && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum membro matriculado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── CHAMADA ── */}
        <TabsContent value="chamada" className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Disciplina</label>
                  <Select value={selectedDiscId} onValueChange={setSelectedDiscId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {ciclos.map(ciclo => (
                        <SelectGroup key={ciclo.id}>
                          <SelectLabel>{ciclo.nome}</SelectLabel>
                          {disciplinas.filter(d => d.ciclo_id === ciclo.id).map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              {MES_NOMES[d.mes] || `M${d.mes}`} — {d.titulo}
                              {d.mes === MES_ATUAL ? ' ★' : ''}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Aula</label>
                  <Select value={selectedAulaNum} onValueChange={setSelectedAulaNum}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(n => {
                        const a = aulas.find(a => a.disciplina_id === selectedDiscId && a.numero === n);
                        return (
                          <SelectItem key={n} value={String(n)}>
                            Aula {n}{a ? ` — ${a.titulo}` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isAlreadyRecorded && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  Chamada já registrada para esta aula. Salvar irá sobrescrever.
                </p>
              )}
            </CardContent>
          </Card>

          {membrosNaCiclo.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                {selectedDiscId ? 'Nenhum membro matriculado neste ciclo' : 'Selecione uma disciplina'}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    {membrosNaCiclo.length} membro(s) —{' '}
                    {Object.values(presencaLocal).filter(Boolean).length} presentes
                  </span>
                  <Button onClick={handleSaveChamada} disabled={savingChamada} size="sm">
                    {savingChamada && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Chamada
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {membrosNaCiclo.map(m => {
                    const presente = presencaLocal[m.perfil_id] ?? false;
                    return (
                      <button
                        key={m.perfil_id}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                          presente ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setPresencaLocal(prev => ({ ...prev, [m.perfil_id]: !prev[m.perfil_id] }))}
                      >
                        <span className="font-medium text-sm">{m.perfis?.nome || '?'}</span>
                        {presente
                          ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          : <XCircle className="w-5 h-5 text-gray-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── RELATÓRIO DE FREQUÊNCIA ── */}
        <TabsContent value="relatorio" className="space-y-4 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />≥3 aulas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />2 aulas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />1 aula</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />0</span>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />CSV
            </Button>
          </div>

          {relatorioRows.map(({ ciclo, discs, rows }) => {
            if (rows.length === 0) return null;
            return (
              <Card key={ciclo.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{ciclo.nome}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-2 font-medium sticky left-0 bg-white border-r min-w-[140px]">Nome</th>
                        {discs.map(d => (
                          <th key={d.id} className="p-2 font-medium text-center min-w-[48px]" title={d.titulo}>
                            {MES_NOMES[d.mes] || `M${d.mes}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.perfil_id} className="border-b hover:bg-muted/20">
                          <td className="p-2 font-medium sticky left-0 bg-white border-r whitespace-nowrap">{r.nome}</td>
                          {discs.map(d => {
                            const count = r.counts[d.id] ?? 0;
                            return (
                              <td key={d.id} className="p-1 text-center">
                                <span className={`inline-flex w-8 h-6 rounded text-xs font-semibold items-center justify-center ${cellColor(count)}`}>
                                  {count}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}

          {relatorioRows.every(r => r.rows.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum dado de frequência disponível
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Matricular */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matricular Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Ciclo</label>
              <Select value={matriculaCicloId} onValueChange={setMatriculaCicloId}>
                <SelectTrigger><SelectValue placeholder="Selecionar ciclo..." /></SelectTrigger>
                <SelectContent>
                  {ciclos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Membro</label>
              <Select value={matriculaMembroId} onValueChange={setMatriculaMembroId}>
                <SelectTrigger><SelectValue placeholder="Selecionar membro..." /></SelectTrigger>
                <SelectContent>
                  {membrosParaMatricula.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showModal && membrosParaMatricula.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Todos os membros ativos já estão matriculados</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); setMatriculaCicloId(''); setMatriculaMembroId(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleMatricular} disabled={savingMatricula || !matriculaCicloId || !matriculaMembroId}>
              {savingMatricula && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Matricular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
