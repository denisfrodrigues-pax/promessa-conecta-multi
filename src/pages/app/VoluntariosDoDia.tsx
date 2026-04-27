import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format, getDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, Users, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EscalaConfirmada {
  id: string;
  funcao: string;
  ministerio_nome: string | null;
  voluntario_id: string;
  voluntario_nome: string;
  status: string;
  checked_in: boolean;
}

interface MinisterioGrupo {
  nome: string;
  funcoes: { [funcao: string]: EscalaConfirmada[] };
}

export default function VoluntariosDoDia() {
  const navigate = useNavigate();
  const { user, profile, roles, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [escalas, setEscalas] = useState<EscalaConfirmada[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Verificar permissão - apenas admin, lider, voluntario podem ver
  const canAccess = roles.some(r => ['admin', 'lider', 'voluntario'].includes(r));

  useEffect(() => {
    if (!authLoading && !canAccess) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/app');
    }
  }, [authLoading, canAccess, navigate]);

  // Gerar sábados: 4 semanas atrás até 12 semanas à frente
  const sabados = useMemo(() => {
    const allSaturdays: Date[] = [];
    const today = new Date();
    // Encontrar o sábado mais recente (4 semanas atrás)
    let current = addDays(today, -28);
    while (getDay(current) !== 6) {
      current = addDays(current, 1);
    }
    // Gerar sábados até 12 semanas à frente
    const limit = addDays(today, 84);
    while (current <= limit) {
      allSaturdays.push(new Date(current));
      current = addDays(current, 7);
    }
    return allSaturdays;
  }, []);

  // Selecionar o próximo sábado por padrão
  useEffect(() => {
    const today = new Date();
    const nextSaturday = sabados.find(s => s >= today) || sabados[sabados.length - 1];
    if (nextSaturday) {
      setSelectedDate(format(nextSaturday, 'yyyy-MM-dd'));
    }
  }, [sabados]);

  // Buscar escalas confirmadas para a data selecionada
  useEffect(() => {
    if (selectedDate) {
      fetchEscalas();
    }
  }, [selectedDate]);

  const fetchEscalas = async () => {
    setLoading(true);
    try {
      // Buscar escalas confirmadas
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          id,
          funcao,
          voluntario_id,
          ministerios(nome),
          voluntario:profiles!escalas_voluntario_id_fkey(id, nome)
        `)
        .eq('data', selectedDate);

      if (error) {
        toast.error('Erro ao buscar escalas: ' + error.message);
        throw error;
      }

      // Buscar check-ins da data
      const escalaIds = (data || []).map((e: any) => e.id);
      let checkins: Record<string, boolean> = {};
      
      if (escalaIds.length > 0) {
        const { data: checkinData } = await supabase
          .from('escala_checkins')
          .select('escala_id')
          .in('escala_id', escalaIds);
        
        (checkinData || []).forEach(c => {
          checkins[c.escala_id] = true;
        });
      }

      const formatted: EscalaConfirmada[] = (data || []).map((item: any) => ({
        id: item.id,
        funcao: item.funcao,
        ministerio_nome: item.ministerios?.nome || null,
        voluntario_id: item.voluntario?.id || item.voluntario_id,
        voluntario_nome: item.voluntario?.nome || 'Desconhecido',
        status: 'escalado',
        checked_in: !!checkins[item.id],
      }));

      setEscalas(formatted);
    } catch (error: any) {
      console.error('Erro ao buscar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fazer check-in - usa auth.uid() como user_id (default no banco)
  const handleCheckin = async (escalaId: string) => {
    if (!user?.id) return;
    
    setCheckingIn(escalaId);
    try {
      // Não passa user_id - o banco usa auth.uid() como default
      const { error } = await supabase
        .from('escala_checkins')
        .insert({
          escala_id: escalaId
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Você já fez check-in nesta escala');
        } else {
          toast.error('Erro ao fazer check-in: ' + error.message);
        }
      } else {
        toast.success('Check-in realizado com sucesso!');
        // Atualizar lista
        setEscalas(prev => prev.map(e => 
          e.id === escalaId ? { ...e, checked_in: true } : e
        ));
      }
    } catch (error: any) {
      console.error('Erro ao fazer check-in:', error);
      toast.error('Erro ao fazer check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  // Agrupar por ministério e função
  const escalasAgrupadas = useMemo(() => {
    const grupos: { [ministerio: string]: MinisterioGrupo } = {};

    escalas.forEach(e => {
      const minName = e.ministerio_nome || 'Sem Ministério';
      
      if (!grupos[minName]) {
        grupos[minName] = {
          nome: minName,
          funcoes: {},
        };
      }

      if (!grupos[minName].funcoes[e.funcao]) {
        grupos[minName].funcoes[e.funcao] = [];
      }

      grupos[minName].funcoes[e.funcao].push(e);
    });

    return Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [escalas]);

  // Se ainda está carregando auth ou não tem acesso
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl text-center">
        <ShieldAlert className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Esta página é visível apenas para voluntários, líderes e administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <CalendarCheck className="w-8 h-8 text-primary" />
          Voluntários do Dia
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize os voluntários confirmados e faça seu check-in
        </p>
      </div>

      {/* Seletor de Data */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-medium">Selecione o sábado:</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Selecione uma data" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sabados.map(sabado => (
                  <SelectItem
                    key={format(sabado, 'yyyy-MM-dd')}
                    value={format(sabado, 'yyyy-MM-dd')}
                  >
                    {format(sabado, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Voluntários */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : escalasAgrupadas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum voluntário confirmado para esta data
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Apenas voluntários que confirmaram sua escala aparecem aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escalasAgrupadas.map(grupo => (
            <Card key={grupo.nome} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {grupo.nome}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(grupo.funcoes).map(([funcao, voluntarios]) => (
                  <div key={funcao} className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {funcao}:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {voluntarios.map((vol) => {
                        // Compara com profile.id pois escalas.voluntario_id referencia profiles.id
                        const isMe = profile?.id === vol.voluntario_id;
                        const canCheckin = isMe && !vol.checked_in;
                        
                        return (
                          <div
                            key={vol.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                              vol.checked_in 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-muted/50 border-border'
                            }`}
                          >
                            <span className="text-sm">{vol.voluntario_nome}</span>
                            
                            {vol.checked_in ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : canCheckin ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                disabled={checkingIn === vol.id}
                                onClick={() => handleCheckin(vol.id)}
                              >
                                {checkingIn === vol.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Check-in'
                                )}
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}