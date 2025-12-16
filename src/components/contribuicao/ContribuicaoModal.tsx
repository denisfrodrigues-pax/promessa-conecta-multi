import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, HandHeart } from 'lucide-react';

interface ContribuicaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Conta {
  id: string;
  nome: string;
}

const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
];

export function ContribuicaoModal({ open, onOpenChange, onSuccess }: ContribuicaoModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  
  const [valor, setValor] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      const [categoriasRes, contasRes] = await Promise.all([
        supabase
          .from('categorias_financeiras')
          .select('id, nome')
          .eq('natureza', 'receita')
          .in('nome', ['Dízimo', 'Oferta', 'Missões', 'Outro']),
        supabase
          .from('contas_financeiras')
          .select('id, nome')
          .eq('status', 'ativa')
          .limit(1),
      ]);

      if (categoriasRes.data) setCategorias(categoriasRes.data);
      if (contasRes.data) setContas(contasRes.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const resetForm = () => {
    setValor('');
    setCategoriaId('');
    setFormaPagamento('');
    setData(new Date().toISOString().split('T')[0]);
    setObservacao('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !categoriaId || !formaPagamento) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor válido maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('transacoes_financeiras').insert({
        tipo: 'receita',
        valor: valorNumerico,
        categoria_id: categoriaId,
        conta_id: contas[0]?.id || null,
        data_operacao: data,
        descricao: `Contribuição via app${observacao ? ` - ${observacao}` : ''}`,
        nota: formaPagamento,
        criado_por: profile?.id,
        status: 'pendente',
      });

      if (error) throw error;

      toast({
        title: 'Contribuição registrada!',
        description: 'Sua contribuição foi registrada com sucesso. Obrigado!',
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving contribution:', error);
      toast({
        title: 'Erro ao registrar',
        description: error.message || 'Não foi possível registrar a contribuição.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <HandHeart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Registrar Contribuição</DialogTitle>
              <DialogDescription>
                Registre sua oferta ou contribuição
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="valor"
                type="text"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma">Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <SelectItem key={forma.value} value={forma.value}>
                    {forma.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Alguma observação sobre a contribuição..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
