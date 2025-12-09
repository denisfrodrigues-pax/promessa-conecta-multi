import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, User, Phone, Clock, CheckCircle, MessageCircle, UserPlus, Network } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Base {
  id: string;
  nome: string;
}

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
  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [basesAtivas, setBasesAtivas] = useState<Base[]>([]);
  const [savingBase, setSavingBase] = useState(false);
  const [vinculoExistente, setVinculoExistente] = useState(false);
  const [baseForm, setBaseForm] = useState({
    base_id: '',
    status: 'em_acompanhamento',
    observacao: '',
  });
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
      fetchBasesAtivas();
      checkVinculoExistente();
    }
  }, [id]);

  const fetchBasesAtivas = async () => {
    const { data } = await supabase
      .from('bases')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome');
    if (data) setBasesAtivas(data);
  };

  const checkVinculoExistente = async () => {
    const { data } = await supabase
      .from('bases_membros')
      .select('id')
      .eq('visitante_id', id)
      .eq('status', 'ativo')
      .maybeSingle();
    setVinculoExistente(!!data);
  };

  const handleSaveBase = async () => {
    if (!baseForm.base_id) {
      toast.error('Selecione uma base');
      return;
    }

    setSavingBase(true);
    try {
      const { error } = await supabase.from('bases_membros').insert({
        base_id: baseForm.base_id,
        visitante_id: id,
        status: baseForm.status,
        observacao: baseForm.observacao.trim() || null,
        membro_id: null,
      } as any);

      if (error) throw error;

      toast.success('Visitante atribuído à base!');
      setBaseModalOpen(false);
      setVinculoExistente(true);
      setBaseForm({ base_id: '', status: 'em_acompanhamento', observacao: '' });
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSavingBase(false);
    }
  };

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

  const formatPhoneForWhatsApp = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const hasValidPhone = (): boolean => {
    if (!formData.telefone) return false;
    const digits = formatPhoneForWhatsApp(formData.telefone);
    return digits.length >= 10;
  };

  const handleWhatsAppClick = () => {
    if (!hasValidPhone()) {
      toast.error('Telefone inválido ou não informado');
      return;
    }

    const phone = formatPhoneForWhatsApp(formData.telefone);
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    
    const message = `Olá! Aqui é a Igreja da Promessa — vi o cadastro de ${formData.nome}.
Telefone: ${formData.telefone}.
Melhor horário para contato: ${formData.melhor_horario || 'Não informado'}.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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

      {/* WhatsApp Button */}
      {hasValidPhone() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Entrar em contato via WhatsApp</p>
                <p className="text-sm text-green-600">Envie uma mensagem diretamente para o visitante</p>
              </div>
              <Button 
                onClick={handleWhatsAppClick}
                className="bg-green-600 hover:bg-green-700"
                aria-label="Enviar mensagem no WhatsApp"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Atribuir a Base */}
      {!vinculoExistente && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-800">Atribuir a uma Base</p>
                <p className="text-sm text-purple-600">Vincule este visitante a uma base para acompanhamento</p>
              </div>
              <Button 
                onClick={() => setBaseModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Network className="w-4 h-4 mr-2" />
                Atribuir a Base
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {vinculoExistente && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              <p className="font-medium text-purple-800">Visitante já está vinculado a uma base</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Convert to Member */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Converter em Membro</p>
              <p className="text-sm text-blue-600">Transfira este visitante para o cadastro de membros</p>
            </div>
            <Button 
              onClick={() => navigate(`/admin/membros/novo?fromVisitante=${id}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Converter em Membro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Atribuir Base */}
      <Dialog open={baseModalOpen} onOpenChange={setBaseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Visitante a uma Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Base *</Label>
              <Select
                value={baseForm.base_id || "none"}
                onValueChange={(v) => setBaseForm({ ...baseForm, base_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {basesAtivas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status do Acompanhamento</Label>
              <Select
                value={baseForm.status}
                onValueChange={(v) => setBaseForm({ ...baseForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contato_iniciado">Contato Iniciado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={baseForm.observacao}
                onChange={(e) => setBaseForm({ ...baseForm, observacao: e.target.value })}
                placeholder="Adicione uma observação..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBaseModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBase} disabled={savingBase}>
                {savingBase ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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