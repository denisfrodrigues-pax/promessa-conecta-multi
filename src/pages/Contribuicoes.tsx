import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  HandHeart, 
  Heart, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  FileText,
  Copy, 
  Check, 
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader';

// PIX EMV Generator for Brazilian PIX standard (BACEN compliant)
const PIX_DATA = {
  chave: 'promessa.hortolandia@gmail.com',
  nome: 'Conv Reg Paulista Adventist',
  cidade: 'Hortolandia',
  banco: 'Bradesco',
  nomeCompleto: 'Convenção Regional Paulista das Igreja Adventista da Promessa',
};

// EMV TLV helper function
function emvTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// CRC16-CCITT-FALSE calculation (polynomial 0x1021)
function calculateCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  const bytes = new TextEncoder().encode(payload);
  
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(valor?: number): string {
  // ID 00 - Payload Format Indicator (required, value "01")
  const payloadFormatIndicator = emvTLV('00', '01');
  
  // ID 26 - Merchant Account Information - PIX
  const gui = emvTLV('00', 'br.gov.bcb.pix');
  const chavePix = emvTLV('01', PIX_DATA.chave);
  const merchantAccountInfo = emvTLV('26', gui + chavePix);
  
  // ID 52 - Merchant Category Code (0000 for general)
  const merchantCategoryCode = emvTLV('52', '0000');
  
  // ID 53 - Transaction Currency (986 = BRL)
  const transactionCurrency = emvTLV('53', '986');
  
  // ID 54 - Transaction Amount (optional, only if value provided)
  const transactionAmount = valor && valor > 0 ? emvTLV('54', valor.toFixed(2)) : '';
  
  // ID 58 - Country Code (BR)
  const countryCode = emvTLV('58', 'BR');
  
  // ID 59 - Merchant Name (max 25 chars, uppercase, no accents)
  const merchantName = emvTLV('59', PIX_DATA.nome.toUpperCase().substring(0, 25));
  
  // ID 60 - Merchant City (max 15 chars, uppercase, no accents)
  const merchantCity = emvTLV('60', PIX_DATA.cidade.toUpperCase().substring(0, 15));
  
  // ID 62 - Additional Data Field Template
  const referenceLabel = emvTLV('05', '***');
  const additionalDataField = emvTLV('62', referenceLabel);
  
  // Build payload without CRC
  const payloadWithoutCRC = 
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataField +
    '6304';
  
  // Calculate and append CRC16
  const crc = calculateCRC16(payloadWithoutCRC);
  
  return payloadWithoutCRC + crc;
}

const FREQUENCIAS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
];

export default function Contribuicoes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const origem = searchParams.get('origem');
  
  // Determine back URL based on auth state and origin
  const getBackUrl = () => {
    if (!user) return '/';
    if (origem === 'contribuicoes') return '/app/minhas-contribuicoes';
    return '/app';
  };
  const backUrl = getBackUrl();
  
  const [tipoContribuicao, setTipoContribuicao] = useState<'recorrente' | 'especial'>('recorrente');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao' | 'boleto'>('pix');
  const [valor, setValor] = useState('');
  const [frequencia, setFrequencia] = useState('mensal');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
  const pixPayload = generatePixPayload(valorNumerico > 0 ? valorNumerico : undefined);

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_DATA.chave);
      setCopiedPix(true);
      toast({
        title: 'Chave PIX copiada!',
        description: 'Cole no seu aplicativo bancário.',
      });
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie manualmente a chave PIX.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!valor || valorNumerico <= 0) {
      toast({
        title: 'Valor obrigatório',
        description: 'Informe um valor válido para a contribuição.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get first active account for contribution
      const { data: contas } = await supabase
        .from('contas_financeiras')
        .select('id')
        .eq('status', 'ativa')
        .limit(1);

      const { error } = await supabase.from('transacoes_financeiras').insert({
        tipo: 'receita',
        valor: valorNumerico,
        conta_id: contas?.[0]?.id || null,
        data_operacao: new Date().toISOString().split('T')[0],
        descricao: `${tipoContribuicao === 'recorrente' ? 'Contribuição recorrente' : 'Contribuição especial'} via site${nome ? ` - ${nome}` : ''}`,
        nota: formaPagamento,
        status: 'pendente',
      });

      if (error) throw error;

      setShowSuccess(true);
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

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <InstitutionalHeader />
        <main className="pt-32 pb-20">
          <div className="container max-w-lg mx-auto px-4">
            <Card className="text-center">
              <CardContent className="py-12 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Contribuição registrada! 🙏
                  </h2>
                  <p className="text-muted-foreground">
                    Que Deus continue abençoando sua vida e sua família.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <Button asChild className="w-full">
                    <Link to={backUrl}>Voltar para a Home</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowSuccess(false)}
                  >
                    Fazer nova contribuição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <Link 
            to={backUrl} 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Home
          </Link>
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
            <HandHeart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Contribuições
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            As contribuições são voluntárias e fazem parte da nossa missão de amar e servir a Deus e às pessoas.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          
          {/* Contribution Type Selection */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
              Escolha o tipo de contribuição
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  tipoContribuicao === 'recorrente' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => setTipoContribuicao('recorrente')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tipoContribuicao === 'recorrente' ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Heart className={`w-5 h-5 ${
                        tipoContribuicao === 'recorrente' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">Contribuição recorrente</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Para quem deseja contribuir regularmente como disciplina espiritual.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  tipoContribuicao === 'especial' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => setTipoContribuicao('especial')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tipoContribuicao === 'especial' ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Sparkles className={`w-5 h-5 ${
                        tipoContribuicao === 'especial' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">Contribuição especial</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Para ofertas pontuais, campanhas ou ações específicas.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Contribution Form */}
          <section className="mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Informações da contribuição</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para registrar sua contribuição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          R$
                        </span>
                        <Input
                          id="valor"
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                          className="pl-10 text-lg"
                          required
                        />
                      </div>
                    </div>

                    {tipoContribuicao === 'recorrente' && (
                      <div className="space-y-2">
                        <Label htmlFor="frequencia">Frequência</Label>
                        <Select value={frequencia} onValueChange={setFrequencia}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCIAS.map((freq) => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome (opcional)</Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label>Forma de pagamento</Label>
                    <RadioGroup 
                      value={formaPagamento} 
                      onValueChange={(v) => setFormaPagamento(v as 'pix' | 'cartao' | 'boleto')}
                      className="grid md:grid-cols-3 gap-4"
                    >
                      <Label
                        htmlFor="pix"
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formaPagamento === 'pix' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <RadioGroupItem value="pix" id="pix" />
                        <QrCode className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">PIX</span>
                      </Label>

                      <Label
                        htmlFor="cartao"
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formaPagamento === 'cartao' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <RadioGroupItem value="cartao" id="cartao" />
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Cartão</span>
                      </Label>

                      <Label
                        htmlFor="boleto"
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formaPagamento === 'boleto' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <RadioGroupItem value="boleto" id="boleto" />
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Boleto</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {/* PIX Section */}
                  {formaPagamento === 'pix' && (
                    <div className="border border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-background p-6 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <QrCode className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">Pagar via PIX</h3>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Abra o app do seu banco e escaneie o QR Code para contribuir via PIX.
                      </p>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* QR Code */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <QRCode value={pixPayload} size={180} level="M" />
                          </div>
                          {valorNumerico > 0 && (
                            <p className="text-sm text-muted-foreground text-center">
                              QR Code com valor de <span className="font-semibold text-foreground">R$ {valorNumerico.toFixed(2).replace('.', ',')}</span>
                            </p>
                          )}
                        </div>

                        {/* PIX Info */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded bg-primary/10">
                              <QrCode className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Chave PIX (E-mail)</p>
                              <p className="text-sm font-medium text-foreground break-all">{PIX_DATA.chave}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={copyPixKey}
                              className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded bg-primary/10">
                              <HandHeart className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Recebedor</p>
                              <p className="text-sm font-medium text-foreground leading-tight">{PIX_DATA.nomeCompleto}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded bg-primary/10">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Banco</p>
                              <p className="text-sm font-medium text-foreground">{PIX_DATA.banco}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card/Boleto placeholder */}
                  {(formaPagamento === 'cartao' || formaPagamento === 'boleto') && (
                    <div className="border border-border rounded-xl bg-muted/30 p-6 text-center">
                      <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-4">
                        {formaPagamento === 'cartao' ? (
                          <CreditCard className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {formaPagamento === 'cartao' ? 'Pagamento com Cartão' : 'Pagamento com Boleto'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Em breve você poderá contribuir via {formaPagamento === 'cartao' ? 'cartão de crédito' : 'boleto bancário'} diretamente pelo site.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={loading || !valor}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <HandHeart className="w-4 h-4 mr-2" />
                        Registrar Contribuição
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Pastoral Message */}
          <section className="text-center">
            <p className="text-muted-foreground italic">
              "Cada contribuição é um ato de gratidão e participa da expansão do Reino de Deus em nossa cidade."
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Igreja Adventista da Promessa de Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
