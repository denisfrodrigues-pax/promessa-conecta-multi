import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const whatsappSchema = z.object({
  phone_number: z.string()
    .min(10, 'Número deve ter pelo menos 10 dígitos')
    .max(15, 'Número deve ter no máximo 15 dígitos')
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Formato de telefone inválido'),
  message_body: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(4096, 'Mensagem deve ter no máximo 4096 caracteres'),
});

interface SendResult {
  success: boolean;
  message_id?: string;
  error?: string;
  details?: {
    phone_number: string;
    message_body: string;
    sent_at: string;
  };
}

export default function WhatsAppTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = whatsappSchema.safeParse({
      phone_number: phoneNumber,
      message_body: messageBody,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      toast.error(errors);
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone_number: phoneNumber,
          message_body: messageBody,
        },
      });

      if (error) throw error;

      const result = data as SendResult;
      setLastResult(result);

      if (result.success) {
        toast.success('Mensagem enviada com sucesso!', {
          description: `ID: ${result.message_id}`,
        });
      } else {
        toast.error('Erro ao enviar mensagem', {
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-600" />
          Teste de WhatsApp
        </h1>
        <p className="text-muted-foreground mt-2">
          Teste o envio de mensagens via WhatsApp Business API (simulação)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Mensagem
          </CardTitle>
          <CardDescription>
            Preencha os campos abaixo para testar o envio de mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+5511999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use formato internacional com código do país (ex: +55 para Brasil)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="min-h-[120px]"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {messageBody.length}/4096 caracteres
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading || !phoneNumber || !messageBody}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Card */}
      {lastResult && (
        <Card className={`mt-6 ${lastResult.success ? 'border-green-500' : 'border-destructive'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`flex items-center gap-2 text-lg ${lastResult.success ? 'text-green-600' : 'text-destructive'}`}>
              {lastResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Mensagem Enviada
                </>
              ) : (
                <>
                  <span className="text-destructive">❌</span>
                  Erro no Envio
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult.success && lastResult.details ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Mensagem:</span>
                  <span className="font-mono text-xs">{lastResult.message_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinatário:</span>
                  <span>{lastResult.details.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enviado em:</span>
                  <span>{new Date(lastResult.details.sent_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive">{lastResult.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">ℹ️ Modo de Simulação</h3>
          <p className="text-sm text-muted-foreground">
            Esta é uma simulação do envio de mensagens WhatsApp. Para usar em produção, 
            configure a variável de ambiente <code className="bg-muted px-1 rounded">WHATSAPP_API_KEY</code> com 
            suas credenciais do Twilio, Meta ou outro provedor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
