import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfYear, endOfYear, eachWeekOfInterval, isSaturday, getDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, Users } from 'lucide-react';

interface EscalaConfirmada {
  id: string;
  funcao: string;
  ministerio_nome: string | null;
  voluntario_nome: string;
  status: string;
}

interface MinisterioGrupo {
  nome: string;
  funcoes: { [funcao: string]: string[] };
}

export default function VoluntariosDoDia() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [escalas, setEscalas] = useState<EscalaConfirmada[]>([]);

  // Gerar todos os sábados do ano atual
  const sabados = useMemo(() => {
    const year = new Date().getFullYear();
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    
    const allSaturdays: Date[] = [];
    let current = start;
    
    // Encontrar o primeiro sábado
    while (getDay(current) !== 6) {
      current = addDays(current, 1);
    }
    
    // Gerar todos os sábados do ano
    while (current <= end) {
      allSaturdays.push(current);
      current = addDays(current, 7);
    }
    
    return allSaturdays;
  }, []);

  // Selecionar o próximo sábado por padrão
  useEffect(() => {
    const today = new Date();
    const nextSaturday = sabados.find(s => s >= today) || sabados[0];
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
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          id,
          funcao,
          status,
          ministerios(nome),
          voluntario:profiles!escalas_voluntario_id_fkey(nome)
        `)
        .eq('data', selectedDate)
        .eq('status', 'confirmado');

      if (error) throw error;

      const formatted: EscalaConfirmada[] = (data || []).map(item => ({
        id: item.id,
        funcao: item.funcao,
        ministerio_nome: (item.ministerios as any)?.nome || null,
        voluntario_nome: (item.voluntario as any)?.nome || 'Desconhecido',
        status: item.status,
      }));

      setEscalas(formatted);
    } catch (error) {
      console.error('Erro ao buscar escalas:', error);
    } finally {
      setLoading(false);
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

      grupos[minName].funcoes[e.funcao].push(e.voluntario_nome);
    });

    return Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [escalas]);

  // Filtrar sábados para mostrar apenas Fev-Abr (meses 1, 2, 3 em 0-indexed)
  const sabadosFevAbr = useMemo(() => {
    return sabados.filter(s => {
      const month = s.getMonth();
      return month >= 1 && month <= 3; // Fev, Mar, Abr
    });
  }, [sabados]);

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <CalendarCheck className="w-8 h-8 text-primary" />
          Voluntários do Dia
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize os voluntários confirmados por sábado
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
              <SelectContent>
                {sabadosFevAbr.map(sabado => (
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
                  <div key={funcao} className="flex flex-wrap items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
                      {funcao}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {voluntarios.map((nome, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {nome}
                        </Badge>
                      ))}
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
