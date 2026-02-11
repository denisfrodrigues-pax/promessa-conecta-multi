import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  Home
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  lider?: {
    nome: string;
  } | null;
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

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (profile?.id) {
      fetchBases();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedBaseId && profile?.id) {
      fetchBaseDetails(selectedBaseId);
    }
  }, [selectedBaseId]);

  const fetchBases = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data: membroData, error: membroError } = await supabase
        .from('bases_membros')
        .select(`
          id,
          base_id,
          profile_id,
          data_entrada,
          status,
          bases (
            id,
            nome,
            descricao,
            local,
            dia_semana,
            horario,
            capacidade,
            lider_id,
            foto_url,
            anfitrioes
          )
        `)
        .eq('profile_id', profile.id)
        .eq('status', 'ativo');

      if (membroError) throw membroError;

      const validData = (membroData || []).filter(d => d.bases) as unknown as BasesMembro[];

      // Fetch leader names for all bases
      const liderIds = validData
        .map(d => d.bases?.lider_id)
        .filter(Boolean) as string[];

      if (liderIds.length > 0) {
        const { data: lideres } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', liderIds);

        if (lideres) {
          const liderMap = new Map(lideres.map(l => [l.id, l]));
          validData.forEach(d => {
            if (d.bases?.lider_id && liderMap.has(d.bases.lider_id)) {
              d.bases.lider = liderMap.get(d.bases.lider_id)!;
            }
          });
        }
      }

      setBasesData(validData);

      // Auto-select first base or preserve selection
      if (validData.length > 0) {
        const currentStillValid = selectedBaseId && validData.some(d => d.base_id === selectedBaseId);
        const idToSelect = currentStillValid ? selectedBaseId! : validData[0].base_id;
        setSelectedBaseId(idToSelect);
        await fetchBaseDetails(idToSelect);
      }
    } catch (error) {
      console.error('Error fetching bases:', error);
      toast.error('Erro ao carregar dados das bases');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseDetails = async (baseId: string) => {
    if (!profile?.id) return;

    try {
      // Fetch today's presence
      const { data: presencaData } = await supabase
        .from('presencas')
        .select('id, data, presente, created_at')
        .eq('usuario_id', profile.id)
        .eq('referencia_tipo', 'base')
        .eq('referencia_id', baseId)
        .eq('data', hoje)
        .maybeSingle();

      setPresencaHoje(presencaData);

      // Fetch today's note
      const { data: notaData } = await supabase
        .from('notas_base')
        .select('id, conteudo, data')
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
    } catch (error) {
      console.error('Error fetching base details:', error);
    }
  };

  const handleSelectBase = (baseId: string) => {
    setSelectedBaseId(baseId);
    setPresencaHoje(null);
    setNotaHoje(null);
    setNotaConteudo('');
  };

  const handleCheckin = async () => {
    if (!profile?.id || !selectedBaseId) return;
    if (presencaHoje) {
      toast.info('Você já registrou presença hoje!');
      return;
    }

    setCheckingIn(true);
    try {
      const { data, error } = await supabase
        .from('presencas')
        .insert({
          usuario_id: profile.id,
          referencia_tipo: 'base',
          referencia_id: selectedBaseId,
          data: hoje,
          presente: true,
          marcado_por: profile.id
        })
        .select('id, data, presente, created_at')
        .single();

      if (error) throw error;

      setPresencaHoje(data);
      toast.success('Presença registrada com sucesso!');
    } catch (error: any) {
      console.error('Error checking in:', error);
      if (error.code === '23505') {
        toast.info('Você já registrou presença hoje!');
        fetchBaseDetails(selectedBaseId);
      } else {
        toast.error('Erro ao registrar presença: ' + error.message);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSaveNota = async () => {
    if (!profile?.id || !selectedBaseId) return;

    setSavingNota(true);
    try {
      if (notaHoje) {
        const { error } = await supabase
          .from('notas_base')
          .update({ conteudo: notaConteudo })
          .eq('id', notaHoje.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notas_base')
          .insert({
            profile_id: profile.id,
            base_id: selectedBaseId,
            data: hoje,
            conteudo: notaConteudo
          })
          .select('id, conteudo, data')
          .single();

        if (error) throw error;
        setNotaHoje(data);
      }

      toast.success('Anotação salva!');
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error('Erro ao salvar anotação: ' + error.message);
    } finally {
      setSavingNota(false);
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
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
          Minha Base
        </h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Você ainda não está vinculado a uma base
            </h3>
            <p className="text-muted-foreground max-w-md">
              Entre em contato com a administração da igreja para ser adicionado a uma base.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedMembership = basesData.find(d => d.base_id === selectedBaseId);
  const base = selectedMembership?.bases;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
        Minha Base
      </h1>
      <p className="text-muted-foreground mb-6 capitalize">{hojeFormatado}</p>

      {/* Base selector when user has multiple bases */}
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
                <img
                  src={bm.bases.foto_url}
                  alt={bm.bases.nome}
                  className="w-10 h-10 rounded-md object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                  <Home className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{bm.bases?.nome}</p>
                {bm.bases?.dia_semana && (
                  <p className="text-xs text-muted-foreground">{bm.bases.dia_semana}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {base && (
        <div className="grid gap-6">
          {/* Base Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {base.nome}
              </CardTitle>
              {base.descricao && (
                <CardDescription>{base.descricao}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {base.local && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Local</p>
                      <p className="text-sm text-muted-foreground">{base.local}</p>
                    </div>
                  </div>
                )}
                {base.dia_semana && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Dia da Semana</p>
                      <p className="text-sm text-muted-foreground">{base.dia_semana}</p>
                    </div>
                  </div>
                )}
                {base.horario && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Horário</p>
                      <p className="text-sm text-muted-foreground">{base.horario}</p>
                    </div>
                  </div>
                )}
                {base.anfitrioes && (
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Anfitriões</p>
                      <p className="text-sm text-muted-foreground">{base.anfitrioes}</p>
                    </div>
                  </div>
                )}
                {base.lider && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Líder</p>
                      <p className="text-sm text-muted-foreground">{base.lider.nome}</p>
                    </div>
                  </div>
                )}
              </div>
              {base.foto_url && (
                <div className="mt-4">
                  <img
                    src={base.foto_url}
                    alt={base.nome}
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in Card */}
          <Card className={presencaHoje ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${presencaHoje ? 'text-green-600' : 'text-muted-foreground'}`} />
                Check-in de Presença
              </CardTitle>
              <CardDescription>
                Registre sua presença no encontro de hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {presencaHoje ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Presença registrada!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Registrado às {format(new Date(presencaHoje.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleCheckin}
                  disabled={checkingIn}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {checkingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Registrar Presença Hoje
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-primary" />
                Anotações do Dia
              </CardTitle>
              <CardDescription>
                Suas anotações pessoais sobre o encontro de hoje (privadas)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Escreva suas anotações aqui..."
                value={notaConteudo}
                onChange={(e) => setNotaConteudo(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSaveNota}
                disabled={savingNota}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {savingNota ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Anotação
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
