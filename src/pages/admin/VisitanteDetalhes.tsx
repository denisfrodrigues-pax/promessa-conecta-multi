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
import { ArrowLeft, Save, User, Phone, Clock, CheckCircle, MessageCircle, UserPlus, Network, History, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface BaseAtiva {
  id: string;
  nome: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  visibilidade: string | null;
  membros_count?: number;
}

interface AcompanhamentoHistorico {
  id: string;
  status: string;
  observacao: string | null;
  created_at: string;
  base: { nome: string };
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
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contatado: 'bg-green-100 text-green-800 border-green-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

export default function VisitanteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visitante, setVisitante] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markingAsContacted, setMarkingAsContacted] = useState(false);
  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [basesAtivas, setBasesAtivas] = useState<BaseAtiva[]>([]);
  const [savingBase, setSavingBase] = useState(false);
  const [vinculoExistente, setVinculoExistente] = useState(false);
  const [baseForm, setBaseForm] = useState({
    base_id: '',
    status: 'em_acompanhamento',
    observacao: '',
  });
  const [selectedBaseInfo, setSelectedBaseInfo] = useState<BaseAtiva | null>(null);
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoHistorico[]>([]);
  const [statusAtual, setStatusAtual] = useState<string | null>(null);
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
      fetchAcompanhamentos();
    }
  }, [id]);

  useEffect(() => {
    if (baseForm.base_id) {
      const base = basesAtivas.find(b => b.id === baseForm.base_id);
      setSelectedBaseInfo(base || null);
    } else {
      setSelectedBaseInfo(null);
    }
  }, [baseForm.base_id, basesAtivas]);

  const fetchAcompanhamentos = async () => {
    const { data } = await supabase
      .from('acompanhamentos')
      .select('id, status, observacao, created_at, base:bases(nome)')
      .eq('visitante_id', id)
      .order('created_at', { ascending: false });
    if (data) {
      setAcompanhamentos(data as unknown as AcompanhamentoHistorico[]);
      if (data.length > 0) {
        setStatusAtual(data[0].status);
      }
    }
  };

  const fetchBasesAtivas = async () => {
    const { data } = await supabase
      .from('bases')
      .select('id, nome, dia_semana, horario, local, capacidade, visibilidade')
      .eq('status', 'ativo')
      .order('nome');
    
    if (data) {
      // Fetch member counts for each base
      const basesWithCount = await Promise.all(
        data.map(async (base) => {
          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');
          return { ...base, membros_count: count || 0 };
        })
      );
      setBasesAtivas(basesWithCount);
    }
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

      await supabase.from('acompanhamentos').insert({
        visitante_id: id,
        base_id: baseForm.base_id,
        status: baseForm.status,
        observacao: baseForm.observacao.trim() || null,
      });

      toast.success('Visitante atribuído à base!');
      setBaseModalOpen(false);
      setVinculoExistente(true);
      setBaseForm({ base_id: '', status: 'em_acompanhamento', observacao: '' });
      fetchAcompanhamentos();
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

      {/* Status Atual do Acompanhamento */}
      {statusAtual && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <p className="font-medium text-indigo-800">Status do Acompanhamento</p>
              </div>
              <Badge variant="outline" className={statusColors[statusAtual]}>
                {statusLabels[statusAtual]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Acompanhamentos */}
      {acompanhamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Acompanhamentos ({acompanhamentos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acompanhamentos.map((acomp) => (
                <div key={acomp.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[acomp.status]}>
                        {statusLabels[acomp.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Base: {acomp.base?.nome || '-'}
                      </span>
                    </div>
                    {acomp.observacao && (
                      <p className="text-sm text-muted-foreground">{acomp.observacao}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(acomp.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
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
        <DialogContent className="max-w-lg">
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
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome} ({b.membros_count}/{b.capacidade || 20})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base Details */}
            {selectedBaseInfo && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">{selectedBaseInfo.nome}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {selectedBaseInfo.dia_semana && selectedBaseInfo.horario && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedBaseInfo.dia_semana} às {selectedBaseInfo.horario}
                    </span>
                  )}
                  {selectedBaseInfo.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedBaseInfo.local}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedBaseInfo.membros_count} / {selectedBaseInfo.capacidade || 20}
                  </span>
                  <Badge variant={selectedBaseInfo.visibilidade === 'publico' ? 'default' : 'secondary'}>
                    {selectedBaseInfo.visibilidade === 'publico' ? 'Público' : 'Privado'}
                  </Badge>
                </div>
              </div>
            )}

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
