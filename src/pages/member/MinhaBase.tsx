import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  NotebookPen,
  Save,
  Home,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  local: string | null;
  dia_semana: string | null;
  horario: string | null;
  capacidade: number | null;
  lider_id: string | null;
  foto_url: string | null;
  anfitrioes: string | null;
  lider?: { nome: string } | null;
}

interface BasesMembro {
  id: string;
  base_id: string;
  profile_id: string;
  data_entrada: string | null;
  status: string | null;
  bases: Base;
}

interface Presenca {
  id: string;
  data: string;
  presente: boolean;
  created_at: string;
}

interface NotaBase {
  id: string;
  conteudo: string | null;
  data: string;
  updated_at: string | null;
}

export default function MinhaBase() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [basesData, setBasesData] = useState<BasesMembro[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [presencaHoje, setPresencaHoje] = useState<Presenca | null>(null);
  const [notaHoje, setNotaHoje] = useState<NotaBase | null>(null);
  const [notaConteudo, setNotaConteudo] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [savingNota, setSavingNota] = useState(false);

  const [historico, setHistorico] = useState<NotaBase[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editConteudo, setEditConteudo] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (profile?.id) fetchBases();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedBaseId && profile?.id) fetchBaseDetails(selectedBaseId);
  }, [selectedBaseId]);

  const fetchBases = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_bases');
      if (error) throw error;
      const validData = (data || []) as unknown as BasesMembro[];
      setBasesData(validData);
      if (validData.length > 0) {
        const currentStillValid = selectedBaseId && validData.some((d) => d.base_id === selectedBaseId);
        const idToSelect = currentStillValid ? selectedBaseId! : validData[0].base_id;
        setSelectedBaseId(idToSelect);
        await fetchBaseDetails(idToSelect);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados das bases');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseDetails = async (baseId: string) => {
    if (!profile?.id) return;
    try {
      const { data: presencaData } = await supabase
        .from('presencas')
        .select('id, data, presente, created_at')
        .eq('usuario_id', profile.id)
        .eq('referencia_tipo', 'base')
        .eq('referencia_id', baseId)
        .eq('data', hoje)
        .maybeSingle();
      setPresencaHoje(presencaData);

      const { data: notaData } = await supabase
        .from('notas_base')
        .select('id, conteudo, data, updated_at')
        .eq('profile_id', profile.id)
        .eq('base_id', baseId)
        .eq('data', hoje)
        .maybeSingle();
      if (notaData) {
        setNotaHoje(notaData);
        setNotaConteudo(notaData.conteudo || '');
      } else {
        setNotaHoje(null);
        setNotaConteudo('');
      }

      const { data: historicoData } = await supabase
        .from('notas_base')
        .select('id, conteudo, data, updated_at')
        .eq('profile_id', profile.id)
        .eq('base_id', baseId)
        .neq('data', hoje)
        .order('data', { ascending: false })
        .limit(50);
      setHistorico((historicoData as NotaBase[]) ?? []);
    } catch (error) {
      console.error('Error fetching base details:', error);
    }
  };

  const handleSelectBase = (baseId: string) => {
    setSelectedBaseId(baseId);
    setPresencaHoje(null);
    setNotaHoje(null);
    setNotaConteudo('');
    setHistorico([]);
    setEditandoId(null);
  };

  const handleCheckin = async () => {
    if (!profile?.id || !selectedBaseId) return;
    if (presencaHoje) { toast.info('Você já registrou presença hoje!'); return; }
    setCheckingIn(true);
    try {
      const { data, error } = await supabase
        .from('presencas')
        .insert({ usuario_id: profile.id, referencia_tipo: 'base', referencia_id: selectedBaseId, data: hoje, presente: true, marcado_por: profile.id })
        .select('id, data, presente, created_at')
        .single();
      if (error) throw error;
      setPresencaHoje(data);
      toast.success('Presença registrada!');
    } catch (error: any) {
      if (error.code === '23505') { toast.info('Você já registrou presença hoje!'); fetchBaseDetails(selectedBaseId); }
      else toast.error('Erro ao registrar presença: ' + error.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSaveNota = async () => {
    if (!profile?.id || !selectedBaseId) return;
    setSavingNota(true);
    try {
      if (notaHoje) {
        const { data, error } = await supabase
          .from('notas_base')
          .update({ conteudo: notaConteudo })
          .eq('id', notaHoje.id)
          .select('id, conteudo, data, updated_at')
          .single();
        if (error) throw error;
        setNotaHoje(data);
      } else {
        const { data, error } = await supabase
          .from('notas_base')
          .insert({ profile_id: profile.id, base_id: selectedBaseId, data: hoje, conteudo: notaConteudo })
          .select('id, conteudo, data, updated_at')
          .single();
        if (error) throw error;
        setNotaHoje(data);
      }
      toast.success('Anotação salva!');
    } catch (error: any) {
      toast.error('Erro ao salvar anotação: ' + error.message);
    } finally {
      setSavingNota(false);
    }
  };

  const handleEditarAnterior = (nota: NotaBase) => {
    setEditandoId(nota.id);
    setEditConteudo(nota.conteudo || '');
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setEditConteudo('');
  };

  const handleSalvarEdicao = async (notaId: string) => {
    setSalvandoEdicao(true);
    try {
      const { data, error } = await supabase
        .from('notas_base')
        .update({ conteudo: editConteudo })
        .eq('id', notaId)
        .select('id, conteudo, data, updated_at')
        .single();
      if (error) throw error;
      setHistorico((prev) => prev.map((n) => (n.id === notaId ? (data as NotaBase) : n)));
      setEditandoId(null);
      toast.success('Anotação atualizada!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleExcluir = async (notaId: string) => {
    setExcluindoId(notaId);
    try {
      const { error } = await supabase.from('notas_base').delete().eq('id', notaId);
      if (error) throw error;

      if (notaHoje?.id === notaId) {
        setNotaHoje(null);
        setNotaConteudo('');
      } else {
        setHistorico((prev) => prev.filter((n) => n.id !== notaId));
      }
      toast.success('Anotação excluída!');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setExcluindoId(null);
      setConfirmExcluir(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (basesData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">Minha Base</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Você ainda não está vinculado a uma base</h3>
            <p className="text-muted-foreground max-w-md">Entre em contato com a administração da igreja para ser adicionado a uma base.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMembership = basesData.find((d) => d.base_id === selectedBaseId);
  const base = selectedMembership?.bases;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Minha Base</h1>
      <p className="text-muted-foreground mb-6 capitalize">{hojeFormatado}</p>

      {basesData.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {basesData.map((bm) => (
            <button
              key={bm.base_id}
              onClick={() => handleSelectBase(bm.base_id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedBaseId === bm.base_id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              {bm.bases?.foto_url ? (
                <img src={bm.bases.foto_url} alt={bm.bases.nome} className="w-10 h-10 rounded-md object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                  <Home className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{bm.bases?.nome}</p>
                {bm.bases?.dia_semana && <p className="text-xs text-muted-foreground">{bm.bases.dia_semana}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {base && (
        <div className="grid gap-6">
          {/* Base Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {base.nome}
              </CardTitle>
              {base.descricao && <CardDescription>{base.descricao}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {base.local && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Local</p>
                      <p className="text-sm text-muted-foreground">{base.local}</p>
                    </div>
                  </div>
                )}
                {base.dia_semana && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Dia da Semana</p>
                      <p className="text-sm text-muted-foreground">{base.dia_semana}</p>
                    </div>
                  </div>
                )}
                {base.horario && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Horário</p>
                      <p className="text-sm text-muted-foreground">{base.horario}</p>
                    </div>
                  </div>
                )}
                {base.anfitrioes && (
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Anfitriões</p>
                      <p className="text-sm text-muted-foreground">{base.anfitrioes}</p>
                    </div>
                  </div>
                )}
                {base.lider && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Líder</p>
                      <p className="text-sm text-muted-foreground">{base.lider.nome}</p>
                    </div>
                  </div>
                )}
              </div>
              {base.foto_url && (
                <div className="mt-4">
                  <img src={base.foto_url} alt={base.nome} className="w-full max-h-48 object-cover rounded-lg" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in */}
          <Card className={presencaHoje ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${presencaHoje ? 'text-green-600' : 'text-muted-foreground'}`} />
                Check-in de Presença
              </CardTitle>
              <CardDescription>Registre sua presença no encontro de hoje</CardDescription>
            </CardHeader>
            <CardContent>
              {presencaHoje ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Presença registrada!</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Registrado às {format(new Date(presencaHoje.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ) : (
                <Button onClick={handleCheckin} disabled={checkingIn} className="w-full sm:w-auto" size="lg">
                  {checkingIn ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Registrar Presença Hoje</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Anotação de Hoje */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <NotebookPen className="w-5 h-5 text-primary" />
                    Anotações de Hoje
                  </CardTitle>
                  <CardDescription>Suas anotações pessoais sobre o encontro de hoje (privadas)</CardDescription>
                </div>
                {notaHoje && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmExcluir(notaHoje.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Escreva suas anotações aqui..."
                value={notaConteudo}
                onChange={(e) => setNotaConteudo(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleSaveNota} disabled={savingNota} variant="outline" className="w-full sm:w-auto">
                  {savingNota ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />{notaHoje ? 'Atualizar' : 'Salvar'} Anotação</>
                  )}
                </Button>
                {notaHoje?.updated_at && (
                  <span className="text-xs text-muted-foreground">
                    Salvo às {format(new Date(notaHoje.updated_at), 'HH:mm')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Anotações */}
          {historico.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setHistoricoAberto((v) => !v)}
              >
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <NotebookPen className="w-5 h-5 text-muted-foreground" />
                    Anotações Anteriores
                    <span className="text-sm font-normal text-muted-foreground">({historico.length})</span>
                  </span>
                  {historicoAberto ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>

              {historicoAberto && (
                <CardContent className="space-y-3 pt-0">
                  {historico.map((nota) => (
                    <div key={nota.id} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground capitalize">
                          {format(parseISO(nota.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-1">
                          {editandoId !== nota.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditarAnterior(nota)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmExcluir(nota.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {editandoId === nota.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editConteudo}
                            onChange={(e) => setEditConteudo(e.target.value)}
                            rows={4}
                            className="resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSalvarEdicao(nota.id)}
                              disabled={salvandoEdicao}
                            >
                              {salvandoEdicao ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                              Salvar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelarEdicao}>
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {nota.conteudo || <span className="italic">Sem conteúdo</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!confirmExcluir} onOpenChange={(open) => { if (!open) setConfirmExcluir(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => confirmExcluir && handleExcluir(confirmExcluir)}
              disabled={!!excluindoId}
            >
              {excluindoId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
