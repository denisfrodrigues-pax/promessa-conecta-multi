import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { History, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { parseLocalDate, getTodayString } from '@/lib/dateUtils';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

interface Escala {
  id: string;
  data: string;
  funcao: string;
  status: string;
  ministerios: { nome: string } | null;
}

export default function HistoricoEscalas() {
  const { profile } = useAuth();
  const { p } = useIgrejaSlug();
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchEscalas();
    }
  }, [profile]);

  const fetchEscalas = async () => {
    setLoading(true);
    try {
      const today = getTodayString();
      const { data, error } = await supabase
        .from('escalas')
        .select('id, data, funcao, status, ministerios(nome)')
        .eq('voluntario_id', profile?.id)
        .lt('data', today)
        .order('data', { ascending: false });

      if (error) throw error;
      setEscalas((data || []) as Escala[]);
    } catch (error) {
      console.error('Error fetching escalas:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'ausente':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-stone-50">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-100 rounded-lg w-48" />
          <div className="h-24 bg-stone-100 rounded-2xl" />
          <div className="h-24 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12 bg-stone-50">
      <div className="mb-8">
        <Link to={p('/app/escalas')}>
          <Button variant="ghost" size="sm" className="mb-2 min-h-[44px] md:min-h-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-stone-900">
          <History className="w-6 h-6 text-primary" />
          Histórico de Escalas
        </h1>
        <p className="text-stone-500 mt-1 leading-relaxed">
          Todas as escalas em que você participou
        </p>
      </div>

      {escalas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 leading-relaxed">
              Nenhuma escala no histórico ainda — as escalas que você já cumpriu vão aparecer aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escalas.map((escala) => (
            <Card key={escala.id} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-stone-800">
                        {format(parseLocalDate(escala.data), 'dd')}
                      </span>
                      <span className="text-xs uppercase text-stone-500">
                        {format(parseLocalDate(escala.data), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{escala.funcao}</p>
                      <p className="text-sm text-stone-500">
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
      )}
    </div>
  );
}
