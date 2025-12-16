import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, HandHeart, Calendar, Tag, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContribuicaoModal } from '@/components/contribuicao/ContribuicaoModal';

interface Contribuicao {
  id: string;
  valor: number;
  data_operacao: string;
  status: string;
  categoria: {
    nome: string;
  } | null;
}

export default function MinhasContribuicoes() {
  const { profile } = useAuth();
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchContribuicoes();
    }
  }, [profile?.id]);

  const fetchContribuicoes = async () => {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          id,
          valor,
          data_operacao,
          status,
          categoria:categorias_financeiras(nome)
        `)
        .eq('criado_por', profile?.id)
        .eq('tipo', 'receita')
        .order('data_operacao', { ascending: false });

      if (error) throw error;
      setContribuicoes(data || []);
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate totals
  const totalContribuido = contribuicoes
    .filter((c) => c.status === 'confirmado')
    .reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/home">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Minhas Contribuições</h1>
            <p className="text-sm text-muted-foreground">
              Histórico de ofertas e dízimos
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <HandHeart className="w-4 h-4 mr-2" />
          Contribuir
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total contribuído</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(totalContribuido)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : contribuicoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted">
                  <HandHeart className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Nenhuma contribuição ainda</h3>
                  <p className="text-sm text-muted-foreground">
                    Sua primeira contribuição ficará registrada aqui
                  </p>
                </div>
                <Button 
                  onClick={() => setModalOpen(true)}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                >
                  Fazer primeira contribuição
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          contribuicoes.map((contribuicao) => (
            <Card key={contribuicao.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(contribuicao.data_operacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      <span>{contribuicao.categoria?.nome || 'Não categorizado'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg text-green-700">
                      {formatCurrency(contribuicao.valor)}
                    </p>
                    {getStatusBadge(contribuicao.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ContribuicaoModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={fetchContribuicoes}
      />
    </div>
  );
}
