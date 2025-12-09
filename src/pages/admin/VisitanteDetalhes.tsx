import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, User, Phone, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  status: string | null;
  melhor_horario: string | null;
  created_at: string | null;
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contatado: 'bg-green-100 text-green-800 border-green-300',
};

export default function VisitanteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visitante, setVisitante] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markingAsContacted, setMarkingAsContacted] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    melhor_horario: '',
    observacoes: '',
    status: 'novo',
  });

  useEffect(() => {
    if (id) {
      fetchVisitante();
    }
  }, [id]);

  const fetchVisitante = async () => {
    try {
      const { data, error } = await supabase
        .from('visitantes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setVisitante(data);
      setFormData({
        nome: data.nome || '',
        telefone: data.telefone || '',
        melhor_horario: data.melhor_horario || '',
        observacoes: data.observacoes || '',
        status: data.status || 'novo',
      });
    } catch (error) {
      console.error('Erro ao buscar visitante:', error);
      toast.error('Erro ao carregar dados do visitante');
      navigate('/admin/visitantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .update({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim() || null,
          melhor_horario: formData.melhor_horario || null,
          observacoes: formData.observacoes.trim() || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Visitante atualizado com sucesso!');
      navigate('/admin/visitantes');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsContacted = async () => {
    setMarkingAsContacted(true);
    try {
      const { error } = await supabase
        .from('visitantes')
        .update({ status: 'contatado' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Visitante marcado como contatado!');
      setFormData({ ...formData, status: 'contatado' });
      setVisitante(visitante ? { ...visitante, status: 'contatado' } : null);
    } catch (error) {
      console.error('Erro ao marcar como contatado:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setMarkingAsContacted(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!visitante) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Visitante não encontrado</p>
      </div>
    );
  }

  const isNew = formData.status === 'novo';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/visitantes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Detalhes do Visitante</h1>
            <p className="text-muted-foreground">Visualize e edite as informações</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={`text-sm px-3 py-1 ${statusColors[formData.status]}`}
        >
          {statusLabels[formData.status]}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">{formatDate(visitante.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Melhor Horário</p>
                <p className="font-medium">{visitante.melhor_horario || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{visitante.telefone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mark as Contacted Button */}
      {isNew && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800">Este visitante ainda não foi contatado</p>
                <p className="text-sm text-amber-600">Clique no botão ao lado após entrar em contato</p>
              </div>
              <Button 
                onClick={handleMarkAsContacted}
                disabled={markingAsContacted}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {markingAsContacted ? 'Atualizando...' : 'Marcar como Contatado'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Visitante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                <User className="w-4 h-4 inline mr-1" />
                Nome *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="melhor_horario">
              <Clock className="w-4 h-4 inline mr-1" />
              Melhor Horário para Contato
            </Label>
            <Input
              id="melhor_horario"
              value={formData.melhor_horario}
              onChange={(e) => setFormData({ ...formData, melhor_horario: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre o visitante..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/admin/visitantes')}>
          Voltar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}