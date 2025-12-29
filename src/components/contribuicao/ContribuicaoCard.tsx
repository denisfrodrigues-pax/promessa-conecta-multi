import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeart, ChevronRight, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContribuicaoModal } from './ContribuicaoModal';
import { Link } from 'react-router-dom';

interface UltimaContribuicao {
  valor: number;
  data_operacao: string;
}

export function ContribuicaoCard() {
  const { profile, isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [ultimaContribuicao, setUltimaContribuicao] = useState<UltimaContribuicao | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchUltimaContribuicao();
    }
  }, [profile?.id]);

  const fetchUltimaContribuicao = async () => {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('valor, data_operacao')
        .eq('criado_por', profile?.id)
        .eq('tipo', 'receita')
        .order('data_operacao', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setUltimaContribuicao(data);
      }
    } catch (error) {
      // No contribution yet, that's fine
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <Card className="rounded-2xl shadow-lg border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30 overflow-hidden">
        <CardContent className="p-0">
          {/* Header with highlighted icon */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                <HandHeart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">
                  Contribuição Financeira
                </h3>
                <p className="text-sm text-white/90">
                  Sua fidelidade também constrói o Reino
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <Button 
              onClick={() => setModalOpen(true)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white h-auto py-3"
              size="lg"
            >
              <HandHeart className="w-5 h-5 mr-3 flex-shrink-0" />
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-base">Contribuição</span>
                <span className="text-xs font-normal opacity-90">Registrar minhas contribuições financeiras</span>
              </div>
            </Button>
            
            {isAdmin && (
              <Button asChild variant="outline" className="w-full border-green-200 hover:bg-green-50" size="sm">
                <Link to="/admin/financeiro/transacoes">
                  Ver Relatórios Completos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Footer with last contribution and history link */}
          <div className="px-5 py-4 bg-green-50/50 border-t border-green-100 space-y-2">
            {ultimaContribuicao && (
              <p className="text-sm text-muted-foreground">
                Última contribuição:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(ultimaContribuicao.valor)}
                </span>
                {' – '}
                {format(new Date(ultimaContribuicao.data_operacao), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
            <Link 
              to="/financeiro/minhas-contribuicoes" 
              className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
            >
              <History className="w-4 h-4" />
              Ver minhas contribuições
            </Link>
          </div>
        </CardContent>
      </Card>

      <ContribuicaoModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={fetchUltimaContribuicao}
      />
    </>
  );
}
