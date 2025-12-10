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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, User, Phone, Clock, MessageCircle, UserPlus, MapPin, Users, CalendarDays, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// ===== INTERFACES =====
interface BaseAtiva {
  id: string;
  nome: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  lider_id: string | null;
  membros_count: number;
  lider_nome?: string;
}

interface AcompanhamentoHistorico {
  id: string;
  status: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  base: {
    id: string;
    nome: string;
    dia_semana: string | null;
    horario: string | null;
    local: string | null;
    capacidade: number | null;
    lider_id: string | null;
  } | null;
  lider_nome?: string;
  membros_count?: number;
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

// ===== STATUS CONFIG (mesmo padrão do Acompanhamento) =====
const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

// ===== HELPERS (mesmo padrão do Acompanhamento) =====
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const hasValidPhone = (phone: string | null): boolean => {
  const digits = cleanPhone(phone);
  return digits.length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const digits = cleanPhone(phone);
  const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const message = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/${phoneWithCountry}?text=${message}`;
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '–';
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const isBaseLotada = (membrosCount: number, capacidade: number | null): boolean => {
  return membrosCount >= (capacidade || 20);
};

// ===== COMPONENT =====
export default function VisitanteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States
  const [visitante, setVisitante] = useState<Visitante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoHistorico[]>([]);
  const [basesAtivas, setBasesAtivas] = useState<BaseAtiva[]>([]);
  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [savingBase, setSavingBase] = useState(false);
  const [vinculoAtual, setVinculoAtual] = useState<{ base_nome: string; lotada: boolean } | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
  });

  const [baseForm, setBaseForm] = useState({
    base_id: '',
    status: 'em_acompanhamento',
    observacao: '',
  });

  // ===== FETCH DATA =====
  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchVisitante(),
      fetchAcompanhamentos(),
      fetchBasesAtivas(),
    ]);
    setLoading(false);
  };

  const fetchVisitante = async () => {
    const { data, error } = await supabase
      .from('visitantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Erro ao carregar visitante');
      navigate('/admin/visitantes');
      return;
    }

    setVisitante(data);
    setFormData({
      nome: data.nome || '',
      telefone: data.telefone || '',
    });
  };

  const fetchAcompanhamentos = async () => {
    const { data } = await supabase
      .from('acompanhamentos')
      .select(`
        id, status, observacao, created_at, updated_at,
        base:bases(id, nome, dia_semana, horario, local, capacidade, lider_id)
      `)
      .eq('visitante_id', id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Enrich with leader names and member counts
      const enriched = await Promise.all(
        data.map(async (acomp: any) => {
          let lider_nome = '–';
          let membros_count = 0;

          if (acomp.base?.lider_id) {
            const { data: lider } = await supabase
              .from('membros')
              .select('nome')
              .eq('id', acomp.base.lider_id)
              .maybeSingle();
            if (lider) lider_nome = lider.nome;
          }

          if (acomp.base?.id) {
            const { count } = await supabase
              .from('bases_membros')
              .select('*', { count: 'exact', head: true })
              .eq('base_id', acomp.base.id)
              .eq('status', 'ativo');
            membros_count = count || 0;
          }

          return { ...acomp, lider_nome, membros_count };
        })
      );

      setAcompanhamentos(enriched as AcompanhamentoHistorico[]);

      // Set current link info from most recent
      const latest = enriched[0];
      if (latest?.base) {
        setVinculoAtual({
          base_nome: latest.base.nome,
          lotada: isBaseLotada(latest.membros_count || 0, latest.base.capacidade),
        });
      }
    } else {
      setAcompanhamentos([]);
      setVinculoAtual(null);
    }
  };

  const fetchBasesAtivas = async () => {
    const { data } = await supabase
      .from('bases')
      .select('id, nome, dia_semana, horario, local, capacidade, lider_id')
      .eq('status', 'ativo')
      .order('nome');

    if (data) {
      const basesWithCount = await Promise.all(
        data.map(async (base) => {
          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');

          let lider_nome = '–';
          if (base.lider_id) {
            const { data: lider } = await supabase
              .from('membros')
              .select('nome')
              .eq('id', base.lider_id)
              .maybeSingle();
            if (lider) lider_nome = lider.nome;
          }

          return { ...base, membros_count: count || 0, lider_nome };
        })
      );
      setBasesAtivas(basesWithCount);
    }
  };

  // ===== ACTIONS =====
  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('visitantes')
      .update({
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || null,
      })
      .eq('id', id);

    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar');
      return;
    }

    toast.success('Visitante atualizado!');
    navigate('/admin/visitantes');
  };

  const handleStartAcompanhamento = async () => {
    if (!baseForm.base_id) {
      toast.error('Selecione uma base');
      return;
    }

    setSavingBase(true);

    // Insert into bases_membros
    const { error: bmError } = await supabase.from('bases_membros').insert({
      base_id: baseForm.base_id,
      visitante_id: id,
      status: 'ativo',
      observacao: baseForm.observacao.trim() || null,
      membro_id: null,
    } as any);

    if (bmError) {
      toast.error('Erro ao vincular à base');
      setSavingBase(false);
      return;
    }

    // Insert into acompanhamentos
    const { error: acompError } = await supabase.from('acompanhamentos').insert({
      visitante_id: id,
      base_id: baseForm.base_id,
      status: baseForm.status,
      observacao: baseForm.observacao.trim() || null,
    });

    setSavingBase(false);

    if (acompError) {
      toast.error('Erro ao criar acompanhamento');
      return;
    }

    toast.success('Acompanhamento iniciado!');
    setBaseModalOpen(false);
    setBaseForm({ base_id: '', status: 'em_acompanhamento', observacao: '' });
    fetchAcompanhamentos();
  };

  const handleWhatsAppClick = () => {
    if (!hasValidPhone(formData.telefone)) return;
    window.open(getWhatsAppUrl(formData.telefone), '_blank');
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const currentStatus = acompanhamentos.length > 0 ? acompanhamentos[0].status : (visitante.status || 'novo');
  const selectedBase = basesAtivas.find((b) => b.id === baseForm.base_id);

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/visitantes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold">{visitante.nome}</h1>
            <button
              onClick={handleWhatsAppClick}
              disabled={!hasValidPhone(formData.telefone)}
              className={`p-1.5 rounded-full transition-colors ${
                hasValidPhone(formData.telefone)
                  ? 'text-green-600 hover:bg-green-100 cursor-pointer'
                  : 'text-muted-foreground/40 cursor-not-allowed'
              }`}
              title={hasValidPhone(formData.telefone) ? 'Enviar WhatsApp' : 'Telefone inválido'}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusColors[currentStatus] || statusColors.novo}>
            {statusLabels[currentStatus] || 'Novo'}
          </Badge>

          {!vinculoAtual && (
            <Button size="sm" onClick={() => setBaseModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" />
              Iniciar Acompanhamento
            </Button>
          )}
        </div>
      </div>

      {/* ===== VÍNCULO ATUAL ===== */}
      {vinculoAtual && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            Vinculado à Base: {vinculoAtual.base_nome}
          </Badge>
          {vinculoAtual.lotada && (
            <Badge variant="destructive" className="text-xs">Lotada</Badge>
          )}
        </div>
      )}

      {/* ===== DADOS PRINCIPAIS ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-xs text-muted-foreground">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">{formatDateTime(visitante.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Última atualização</p>
              <p className="font-medium">{formatDateTime(visitante.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status atual</p>
              <Badge variant="outline" className={`mt-1 ${statusColors[currentStatus] || statusColors.novo}`}>
                {statusLabels[currentStatus] || 'Novo'}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate('/admin/visitantes')}>
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== HISTÓRICO DE ACOMPANHAMENTO ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de Acompanhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acompanhamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum registro de acompanhamento ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {acompanhamentos.map((acomp) => (
                <div
                  key={acomp.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusColors[acomp.status] || statusColors.novo}>
                        {statusLabels[acomp.status] || 'Novo'}
                      </Badge>
                      {acomp.base && isBaseLotada(acomp.membros_count || 0, acomp.base.capacidade) && (
                        <Badge variant="destructive" className="text-xs">Lotada</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(acomp.created_at)}
                    </span>
                  </div>

                  {/* Observação */}
                  {acomp.observacao && (
                    <p className="text-sm text-muted-foreground">{acomp.observacao}</p>
                  )}

                  {/* Info da Base */}
                  {acomp.base && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t">
                      <span className="font-medium text-foreground">{acomp.base.nome}</span>
                      {acomp.base.dia_semana && acomp.base.horario && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {acomp.base.dia_semana} • {acomp.base.horario}
                        </span>
                      )}
                      {acomp.base.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {acomp.base.local}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {acomp.membros_count}/{acomp.base.capacidade || 20}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Líder: {acomp.lider_nome}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== CONVERTER EM MEMBRO ===== */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-blue-800">Converter em Membro</p>
              <p className="text-sm text-blue-600">Transfira este visitante para o cadastro de membros</p>
            </div>
            <Button
              onClick={() => navigate(`/admin/membros/novo?fromVisitante=${id}`)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Converter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== MODAL INICIAR ACOMPANHAMENTO ===== */}
      <Dialog open={baseModalOpen} onOpenChange={setBaseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Acompanhamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Contexto */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p><strong>Visitante:</strong> {visitante.nome}</p>
              <p><strong>Status atual:</strong> {statusLabels[currentStatus] || 'Novo'}</p>
            </div>

            {/* Selecionar Base */}
            <div className="space-y-2">
              <Label>Base *</Label>
              <Select
                value={baseForm.base_id || 'none'}
                onValueChange={(v) => setBaseForm({ ...baseForm, base_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {basesAtivas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome} ({b.membros_count}/{b.capacidade || 20})
                      {isBaseLotada(b.membros_count, b.capacidade) ? ' - Lotada' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info da Base Selecionada */}
            {selectedBase && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-2">
                <p className="font-medium">{selectedBase.nome}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {selectedBase.dia_semana && selectedBase.horario && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedBase.dia_semana} • {selectedBase.horario}
                    </span>
                  )}
                  {selectedBase.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedBase.local}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedBase.membros_count}/{selectedBase.capacidade || 20}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Líder: {selectedBase.lider_nome}
                  </span>
                </div>
                {isBaseLotada(selectedBase.membros_count, selectedBase.capacidade) && (
                  <Badge variant="destructive" className="text-xs">Lotada</Badge>
                )}
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label>Status inicial</Label>
              <Select
                value={baseForm.status}
                onValueChange={(v) => setBaseForm({ ...baseForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contato_iniciado">Contato Iniciado</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={baseForm.observacao}
                onChange={(e) => setBaseForm({ ...baseForm, observacao: e.target.value })}
                placeholder="Adicione uma observação..."
                rows={3}
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBaseModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStartAcompanhamento} disabled={savingBase}>
                {savingBase ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
