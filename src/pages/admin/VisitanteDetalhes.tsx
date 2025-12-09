import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Phone, Mail, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_visita: string | null;
  culto: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
}

export default function VisitanteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visitante, setVisitante] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    culto: '',
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
        email: data.email || '',
        culto: data.culto || '',
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
          email: formData.email.trim() || null,
          culto: formData.culto || null,
          observacoes: formData.observacoes.trim() || null,
          status: formData.status,
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatCulto = (culto: string | null) => {
    if (!culto) return '-';
    const cultoLabels: Record<string, string> = {
      domingo_manha: 'Domingo - Manhã',
      domingo_noite: 'Domingo - Noite',
      quarta: 'Quarta-feira',
      outro: 'Outro',
    };
    return cultoLabels[culto] || culto;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/visitantes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">Detalhes do Visitante</h1>
          <p className="text-muted-foreground">Visualize e edite as informações</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data da Visita</p>
                <p className="font-medium">{formatDate(visitante.data_visita)}</p>
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
                <p className="text-sm text-muted-foreground">Culto Visitado</p>
                <p className="font-medium">{formatCulto(visitante.culto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
      </div>

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
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-1" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="membro_em_potencial">Membro em Potencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
