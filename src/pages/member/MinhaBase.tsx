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
  Save
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
  const [baseData, setBaseData] = useState<BasesMembro | null>(null);
  const [presencaHoje, setPresencaHoje] = useState<Presenca | null>(null);
  const [notaHoje, setNotaHoje] = useState<NotaBase | null>(null);
  const [notaConteudo, setNotaConteudo] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [savingNota, setSavingNota] = useState(false);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeFormatado = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Fetch user's base membership
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
            lider_id
          )
        `)
        .eq('profile_id', profile.id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (membroError) throw membroError;

      if (membroData) {
        // Fetch leader info if exists
        if (membroData.bases?.lider_id) {
          const { data: liderData } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', membroData.bases.lider_id)
            .single();

          if (liderData && membroData.bases) {
            (membroData.bases as Base).lider = liderData;
          }
        }

        setBaseData(membroData as unknown as BasesMembro);

        // Fetch today's presence
        const { data: presencaData } = await supabase
          .from('presencas')
          .select('id, data, presente, created_at')
          .eq('usuario_id', profile.id)
          .eq('referencia_tipo', 'base')
          .eq('referencia_id', membroData.base_id)
          .eq('data', hoje)
          .maybeSingle();

        setPresencaHoje(presencaData);

        // Fetch today's note
        const { data: notaData } = await supabase
          .from('notas_base')
          .select('id, conteudo, data')
          .eq('profile_id', profile.id)
          .eq('base_id', membroData.base_id)
          .eq('data', hoje)
          .maybeSingle();

        if (notaData) {
          setNotaHoje(notaData);
          setNotaConteudo(notaData.conteudo || '');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados da base');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!profile?.id || !baseData) return;
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
          referencia_id: baseData.base_id,
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
        fetchData(); // Refresh to get the existing record
      } else {
        toast.error('Erro ao registrar presença');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSaveNota = async () => {
    if (!profile?.id || !baseData) return;

    setSavingNota(true);
    try {
      if (notaHoje) {
        // Update existing note
        const { error } = await supabase
          .from('notas_base')
          .update({ conteudo: notaConteudo })
          .eq('id', notaHoje.id);

        if (error) throw error;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notas_base')
          .insert({
            profile_id: profile.id,
            base_id: baseData.base_id,
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
      toast.error('Erro ao salvar anotação');
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

  if (!baseData) {
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

  const base = baseData.bases;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
        Minha Base
      </h1>
      <p className="text-muted-foreground mb-6 capitalize">{hojeFormatado}</p>

      <div className="grid gap-6">
        {/* Base Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-promessa-600" />
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
              <NotebookPen className="w-5 h-5 text-promessa-600" />
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
    </div>
  );
}