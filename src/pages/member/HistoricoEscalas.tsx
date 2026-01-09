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

interface Escala {
  id: string;
  data: string;
  funcao: string;
  status: string;
  ministerios: { nome: string } | null;
}

export default function HistoricoEscalas() {
  const { profile } = useAuth();
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
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('escalas')
        .select('id, data, funcao, status, ministerios(nome)')
        .eq('voluntario_id', profile?.id)
        .lt('data', today)
        .order('data', { ascending: false });

      if (error) throw error;
      setEscalas(data || []);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <Link to="/app/escalas">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Histórico de Escalas
        </h1>
        <p className="text-muted-foreground mt-1">
          Todas as escalas em que você participou
        </p>
      </div>

      {escalas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma escala no histórico</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {escalas.map((escala) => (
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
      )}
    </div>
  );
}
