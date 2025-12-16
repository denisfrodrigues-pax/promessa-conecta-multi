import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeart, ChevronRight } from 'lucide-react';
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
      <Card className="rounded-2xl shadow-md border border-neutral-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-green-100 flex-shrink-0">
              <HandHeart className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-lg text-foreground">
                Contribuição Financeira
              </h3>
              <p className="text-sm text-muted-foreground">
                Registre sua oferta ou contribuição
              </p>
            </div>
          </div>
          
          <div className="px-5 pb-5 space-y-3">
            <Button 
              onClick={() => setModalOpen(true)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              Registrar Contribuição
            </Button>
            
            {isAdmin && (
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link to="/admin/financeiro/transacoes">
                  Ver Relatórios Completos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {ultimaContribuicao && (
            <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
              <p className="text-sm text-muted-foreground">
                Última contribuição:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(ultimaContribuicao.valor)}
                </span>
                {' – '}
                {format(new Date(ultimaContribuicao.data_operacao), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          )}
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
