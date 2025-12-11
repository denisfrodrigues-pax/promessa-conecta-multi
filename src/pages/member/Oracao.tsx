import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Heart, Plus, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidoOracao {
  id: string;
  titulo: string;
  descricao: string | null;
  anonimo: boolean;
  usuario_id: string | null;
  created_at: string;
}

export default function Oracao() {
  const { profile } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoOracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    anonimo: false,
  });

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_oracao')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error('Digite um título para o pedido');
      return;
    }

    try {
      const { error } = await supabase.from('pedidos_oracao').insert({
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        anonimo: formData.anonimo,
        usuario_id: formData.anonimo ? null : profile?.id,
      });

      if (error) throw error;

      toast.success('Pedido de oração enviado!');
      setIsDialogOpen(false);
      setFormData({ titulo: '', descricao: '', anonimo: false });
      fetchPedidos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar pedido');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Pedidos de Oração</h1>
          <p className="text-muted-foreground mt-1">Compartilhe seus pedidos e ore pela comunidade</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Pedido de Oração</DialogTitle>
              <DialogDescription>
                Compartilhe seu pedido com a comunidade. Você pode enviar anonimamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Resumo do seu pedido"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Detalhes do seu pedido (opcional)"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <Label>Enviar Anonimamente</Label>
                  <p className="text-sm text-muted-foreground">Seu nome não será exibido</p>
                </div>
                <Switch
                  checked={formData.anonimo}
                  onCheckedChange={(checked) => setFormData({ ...formData, anonimo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Enviar Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {pedidos.map((pedido, index) => (
          <Card 
            key={pedido.id} 
            className="shadow-card animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-rose-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold">{pedido.titulo}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {pedido.anonimo ? (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Anônimo
                      </span>
                    ) : (
                      'Membro da comunidade'
                    )}
                  </p>
                  {pedido.descricao && (
                    <p className="text-muted-foreground">{pedido.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    {format(new Date(pedido.created_at), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {pedidos.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum pedido de oração no momento
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Enviar Primeiro Pedido
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
