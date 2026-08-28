import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, HandHeart, CheckCircle2, QrCode, Copy, Check, Building2, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import QRCode from 'react-qr-code';
import { generatePixPayload } from '@/lib/pixPayload';
import { usePixInfo } from '@/hooks/usePixInfo';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';

interface ContribuicaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Conta {
  id: string;
  nome: string;
}

const FORMAS_CONTRIBUICAO = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
];

const TIPOS_CONTRIBUICAO = [
  { value: 'recorrente', label: 'Contribuição recorrente' },
  { value: 'especial', label: 'Contribuição especial' },
];

export function ContribuicaoModal({ open, onOpenChange, onSuccess }: ContribuicaoModalProps) {
  const { profile } = useAuth();
  const { churchNome } = useIgrejaSlug();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contas, setContas] = useState<Conta[]>([]);
  const [copiedPix, setCopiedPix] = useState(false);

  const [valor, setValor] = useState('');
  const [tipoContribuicao, setTipoContribuicao] = useState('');
  const [formaContribuicao, setFormaContribuicao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');

  const { pixInfo, loading: loadingPixInfo } = usePixInfo();
  const nomeIgreja = churchNome || 'a igreja';
  const pixPayload = pixInfo
    ? generatePixPayload({ chave: pixInfo.chave, nome: pixInfo.nome || nomeIgreja, cidade: 'BRASIL' })
    : null;

  useEffect(() => {
    if (open) {
      fetchOptions();
      setShowSuccess(false);
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      const contasRes = await supabase
        .from('contas_financeiras')
        .select('id, nome')
        .eq('status', 'ativa')
        .limit(1);

      if (contasRes.data) setContas(contasRes.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const resetForm = () => {
    setValor('');
    setTipoContribuicao('');
    setFormaContribuicao('');
    setData(new Date().toISOString().split('T')[0]);
    setObservacao('');
  };

  const copyPixKey = async () => {
    if (!pixInfo) return;
    try {
      await navigator.clipboard.writeText(pixInfo.chave);
      setCopiedPix(true);
      toast.success('Chave PIX copiada!', { description: 'Cole no seu aplicativo bancário.' });
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar', { description: 'Copie manualmente a chave PIX.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || !tipoContribuicao || !formaContribuicao) {
      toast.error('Campos obrigatórios', { description: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor inválido', { description: 'Informe um valor válido maior que zero.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('transacoes_financeiras').insert({
        tipo: 'receita',
        valor: valorNumerico,
        conta_id: contas[0]?.id || null,
        data_operacao: data,
        descricao: `${tipoContribuicao === 'recorrente' ? 'Contribuição recorrente' : 'Contribuição especial'} via app${observacao ? ` - ${observacao}` : ''}`,
        nota: formaContribuicao,
        criado_por: profile?.id,
        status: 'pendente',
      });

      if (error) throw error;

      setShowSuccess(true);
      resetForm();
      onSuccess?.();
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error saving contribution:', error);
      toast.error('Erro ao registrar', { description: error.message || 'Não foi possível registrar a contribuição.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  // Success content
  const SuccessContent = () => (
    <div className="flex flex-col items-center text-center py-8 space-y-4 px-4">
      <div className="p-4 rounded-full bg-green-100">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-display font-bold text-foreground">
          Contribuição registrada com sucesso 🙏
        </h3>
        <p className="text-muted-foreground">
          Que Deus continue abençoando sua vida.
        </p>
      </div>
      <Button onClick={handleClose} className="mt-4 bg-green-600 hover:bg-green-700">
        Voltar para Home
      </Button>
    </div>
  );

  // Form content
  const FormContent = () => (
    <div className="space-y-4 px-4 pb-6">
      {/* Spiritual welcome message */}
      <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
        Obrigado por fazer parte do que Deus está fazendo através desta igreja.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="valor"
              type="text"
              inputMode="decimal"
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
          <Select value={tipoContribuicao} onValueChange={setTipoContribuicao} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CONTRIBUICAO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma">Forma de Contribuição *</Label>
          <Select value={formaContribuicao} onValueChange={setFormaContribuicao} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              {FORMAS_CONTRIBUICAO.map((forma) => (
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
          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Contribuir'
            )}
          </Button>
        </div>
      </form>

      {/* PIX Information Card */}
      <div className="mt-6 border border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-white p-4 space-y-4">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <QrCode className="w-5 h-5" />
          <span>Pagar via Pix</span>
        </div>

        {loadingPixInfo ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Carregando dados de PIX...
          </div>
        ) : !pixInfo ? (
          <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Chave PIX não configurada para {nomeIgreja}. Fale com a administração da igreja.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-green-100">
                  <QrCode className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Chave PIX</p>
                  <p className="text-sm font-medium text-foreground break-all">{pixInfo.chave}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyPixKey}
                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {pixInfo.nome && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-green-100">
                    <HandHeart className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Recebedor</p>
                    <p className="text-sm font-medium text-foreground leading-tight">{pixInfo.nome}</p>
                  </div>
                </div>
              )}

              {pixInfo.banco && (
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-green-100">
                    <Building2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Banco</p>
                    <p className="text-sm font-medium text-foreground">{pixInfo.banco}</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center pt-3 border-t border-green-100">
              <div className="bg-white p-3 rounded-lg shadow-sm border">
                <QRCode value={pixPayload!} size={140} level="M" />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3 max-w-[200px]">
                Abra o app do seu banco e use a opção Pix para escanear este QR Code.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Header content
  const HeaderContent = () => (
    <div className="flex items-center gap-3 px-4">
      <div className="p-2 rounded-full bg-green-100">
        <HandHeart className="w-5 h-5 text-green-600" />
      </div>
      <div>
        {isMobile ? (
          <>
            <DrawerTitle>Contribuição Financeira</DrawerTitle>
            <DrawerDescription>
              Registre sua contribuição
            </DrawerDescription>
          </>
        ) : (
          <>
            <DialogTitle>Contribuição Financeira</DialogTitle>
            <DialogDescription>
              Registre sua contribuição
            </DialogDescription>
          </>
        )}
      </div>
    </div>
  );

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85svh]">
          <div className="overflow-y-auto">
            {showSuccess ? (
              <SuccessContent />
            ) : (
              <>
                <DrawerHeader className="pb-2">
                  <HeaderContent />
                </DrawerHeader>
                <FormContent />
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog (anchored top-left for better visibility)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto left-4 top-4 translate-x-0 translate-y-0">
        {showSuccess ? (
          <SuccessContent />
        ) : (
          <>
            <DialogHeader>
              <HeaderContent />
            </DialogHeader>
            <FormContent />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
