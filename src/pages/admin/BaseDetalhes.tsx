import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, Network, UserPlus, UserMinus, MessageCircle, Edit, X, Search, Clock, MapPin, Users, CalendarDays, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== INTERFACES =====
interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  status: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  visibilidade: string | null;
  data_criacao: string;
}

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  foto_perfil: string | null;
}

interface BaseMembro {
  id: string;
  membro_id: string;
  data_entrada: string;
  membro: Membro;
}

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
}

interface BaseVisitante {
  id: string;
  visitante_id: string;
  status: string;
  observacao: string | null;
  visitante: Visitante;
  statusAcompanhamento?: string;
}

// ===== CONFIG =====
const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
  ativo: 'Ativo',
};

const statusColors: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
  ativo: 'bg-green-100 text-green-800 border-green-300',
};

// ===== HELPERS =====
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const digits = cleanPhone(phone);
  const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const message = encodeURIComponent('Olá! Sou da Igreja da Promessa.');
  return `https://wa.me/${phoneWithCountry}?text=${message}`;
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '–';
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const getInitials = (nome: string): string => {
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
};

const isBaseLotada = (membrosCount: number, capacidade: number | null): boolean => {
  return membrosCount >= (capacidade || 20);
};

const getOcupacaoPercent = (membrosCount: number, capacidade: number | null): number => {
  return Math.min(100, (membrosCount / (capacidade || 20)) * 100);
};

// ===== COMPONENT =====
export default function BaseDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [base, setBase] = useState<Base | null>(null);
  const [membrosBase, setMembrosBase] = useState<BaseMembro[]>([]);
  const [membrosDisponiveis, setMembrosDisponiveis] = useState<Membro[]>([]);
  const [liderInfo, setLiderInfo] = useState<Membro | null>(null);
  const [todosMembros, setTodosMembros] = useState<Membro[]>([]);
  const [todosProfiles, setTodosProfiles] = useState<{ id: string; nome: string }[]>([]);
  const [visitantesBase, setVisitantesBase] = useState<BaseVisitante[]>([]);
  const [filtroStatusVisitante, setFiltroStatusVisitante] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchMembro, setSearchMembro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dia_semana: '',
    horario: '',
    local: '',
    capacidade: 20,
    visibilidade: 'publico',
    lider_id: '',
    status: '',
  });

  const totalMembros = membrosBase.length + visitantesBase.length;

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchBase(),
      fetchMembrosBase(),
      fetchTodosMembros(),
      fetchTodosProfiles(),
      fetchVisitantesBase(),
    ]);
    setLoading(false);
  };

  const fetchBase = async () => {
    const { data } = await supabase.from('bases').select('*').eq('id', id).maybeSingle();

    if (data) {
      setBase(data);
      setFormData({
        nome: data.nome,
        descricao: data.descricao || '',
        dia_semana: data.dia_semana || '',
        horario: data.horario || '',
        local: data.local || '',
        capacidade: data.capacidade || 20,
        visibilidade: data.visibilidade || 'publico',
        lider_id: data.lider_id || '',
        status: data.status,
      });

      if (data.lider_id) {
        const { data: lider } = await supabase
          .from('profiles')
          .select('id, nome, telefone, foto_url')
          .eq('id', data.lider_id)
          .maybeSingle();
        // Map foto_url to foto_perfil for interface compatibility
        setLiderInfo(lider ? { ...lider, foto_perfil: lider.foto_url } : null);
      }
    }
  };

  const fetchMembrosBase = async () => {
    const { data } = await supabase
      .from('bases_membros')
      .select('id, membro_id, data_entrada, membro:membros(id, nome, telefone, foto_perfil)')
      .eq('base_id', id)
      .eq('status', 'ativo')
      .not('membro_id', 'is', null);

    if (data) setMembrosBase(data as unknown as BaseMembro[]);
  };

  const fetchVisitantesBase = async () => {
    const { data } = await supabase
      .from('bases_membros')
      .select('id, visitante_id, status, observacao, visitante:visitantes(id, nome, telefone)')
      .eq('base_id', id)
      .not('visitante_id', 'is', null)
      .neq('status', 'desligado');

    if (data) {
      const visitanteIds = data.map((d) => d.visitante_id).filter(Boolean);
      const { data: acompData } = await supabase
        .from('acompanhamentos')
        .select('visitante_id, status, created_at')
        .eq('base_id', id)
        .in('visitante_id', visitanteIds.length > 0 ? visitanteIds : ['00000000-0000-0000-0000-000000000000'])
        .order('created_at', { ascending: false });

      const latestStatus: Record<string, string> = {};
      for (const acomp of acompData || []) {
        if (!latestStatus[acomp.visitante_id]) {
          latestStatus[acomp.visitante_id] = acomp.status;
        }
      }

      const enriched = (data as unknown as BaseVisitante[]).map((bv) => ({
        ...bv,
        statusAcompanhamento: latestStatus[bv.visitante_id] || bv.status,
      }));
      setVisitantesBase(enriched);
    }
  };

  const fetchTodosMembros = async () => {
    const { data } = await supabase.from('membros').select('id, nome, telefone, foto_perfil').eq('status', 'ativo').order('nome');
    if (data) setTodosMembros(data);
  };

  const fetchTodosProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, nome').eq('status', 'ativo').order('nome');
    if (data) setTodosProfiles(data);
  };

  const fetchMembrosDisponiveis = async () => {
    const { data: emBase } = await supabase.from('bases_membros').select('membro_id').eq('status', 'ativo');
    const idsEmBase = (emBase || []).map((m) => m.membro_id);
    const disponiveis = todosMembros.filter((m) => !idsEmBase.includes(m.id));
    setMembrosDisponiveis(disponiveis);
  };

  useEffect(() => {
    if (addModalOpen) fetchMembrosDisponiveis();
  }, [addModalOpen, todosMembros]);

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('bases')
      .update({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        dia_semana: formData.dia_semana || null,
        horario: formData.horario || null,
        local: formData.local.trim() || null,
        capacidade: formData.capacidade,
        visibilidade: formData.visibilidade,
        lider_id: formData.lider_id || null,
        status: formData.status,
      })
      .eq('id', id);

    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar');
      return;
    }

    toast.success('Base atualizada!');
    setEditing(false);
    fetchBase();
  };

  const addMembro = async (membroId: string) => {
    const { error } = await supabase.from('bases_membros').insert({ base_id: id, membro_id: membroId, status: 'ativo' });
    if (error) {
      toast.error('Erro ao adicionar membro');
      return;
    }
    toast.success('Membro adicionado!');
    setAddModalOpen(false);
    fetchMembrosBase();
  };

  const removeMembro = async (baseMembroId: string) => {
    const { error } = await supabase
      .from('bases_membros')
      .update({ status: 'desligado', data_saida: new Date().toISOString() })
      .eq('id', baseMembroId);

    if (error) {
      toast.error('Erro ao remover membro');
      return;
    }
    toast.success('Membro removido');
    fetchMembrosBase();
  };

  const removeVisitante = async (baseVisitanteId: string) => {
    const { error } = await supabase
      .from('bases_membros')
      .update({ status: 'desligado', data_saida: new Date().toISOString() })
      .eq('id', baseVisitanteId);

    if (error) {
      toast.error('Erro ao remover visitante');
      return;
    }
    toast.success('Visitante removido');
    fetchVisitantesBase();
  };

  const visitantesFiltrados =
    filtroStatusVisitante === 'todos'
      ? visitantesBase
      : visitantesBase.filter((v) => (v.statusAcompanhamento || v.status) === filtroStatusVisitante);

  const filteredDisponiveis = membrosDisponiveis.filter((m) =>
    m.nome.toLowerCase().includes(searchMembro.toLowerCase())
  );

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!base) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Base não encontrada</p>
        <Button variant="link" onClick={() => navigate('/admin/bases')}>Voltar para lista</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold">{base.nome}</h1>
            {liderInfo && hasValidPhone(liderInfo.telefone) && (
              <button
                onClick={() => window.open(getWhatsAppUrl(liderInfo.telefone), '_blank')}
                className="text-green-600 hover:text-green-700 p-1"
                title="WhatsApp do líder"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={base.status === 'ativo' ? statusColors.ativo : 'bg-gray-100 text-gray-800'}>
            {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
          <Badge variant={base.visibilidade === 'publico' ? 'default' : 'secondary'}>
            {base.visibilidade === 'publico' ? 'Público' : 'Privado'}
          </Badge>
          {isBaseLotada(totalMembros, base.capacidade) && (
            <Badge variant="destructive">Lotada</Badge>
          )}
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* ===== DADOS DA BASE ===== */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dados da Base</CardTitle>
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome *</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Líder</Label>
                  <Select value={formData.lider_id || 'none'} onValueChange={(v) => setFormData({ ...formData, lider_id: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {todosProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={2} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Dia</Label>
                  <Select value={formData.dia_semana || 'none'} onValueChange={(v) => setFormData({ ...formData, dia_semana: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {diasSemana.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Horário</Label>
                  <Input type="time" value={formData.horario} onChange={(e) => setFormData({ ...formData, horario: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Capacidade</Label>
                  <Input type="number" min={1} value={formData.capacidade} onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 20 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Visibilidade</Label>
                  <Select value={formData.visibilidade} onValueChange={(v) => setFormData({ ...formData, visibilidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <Input value={formData.local} onChange={(e) => setFormData({ ...formData, local: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{base.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Criação</p>
                  <p className="font-medium">{formatDateTime(base.data_criacao)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dia e Horário</p>
                  <p className="font-medium flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {base.dia_semana && base.horario ? `${base.dia_semana} • ${base.horario}` : '–'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {base.local || '–'}
                  </p>
                </div>
              </div>

              {base.descricao && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{base.descricao}</p>
                </div>
              )}

              {/* Líder */}
              {liderInfo && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={liderInfo.foto_perfil || undefined} />
                    <AvatarFallback>{getInitials(liderInfo.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Líder</p>
                    <p className="font-medium">{liderInfo.nome}</p>
                  </div>
                  {hasValidPhone(liderInfo.telefone) && (
                    <button
                      onClick={() => window.open(getWhatsAppUrl(liderInfo.telefone), '_blank')}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Ocupação */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ocupação</span>
                  <span className="text-sm text-muted-foreground">
                    {totalMembros}/{base.capacidade || 20}
                  </span>
                </div>
                <Progress value={getOcupacaoPercent(totalMembros, base.capacidade)} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round(getOcupacaoPercent(totalMembros, base.capacidade))}% ocupada
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== MEMBROS DA BASE ===== */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membros da Base ({membrosBase.length})
          </CardTitle>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar membro..."
                    value={searchMembro}
                    onChange={(e) => setSearchMembro(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredDisponiveis.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Nenhum membro disponível</p>
                  ) : (
                    filteredDisponiveis.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => addMembro(m.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={m.foto_perfil || undefined} />
                            <AvatarFallback>{getInitials(m.nome)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{m.nome}</span>
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {membrosBase.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum membro nesta base</p>
          ) : (
            <div className="space-y-2">
              {membrosBase.map((bm) => (
                <div key={bm.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bm.membro?.foto_perfil || undefined} />
                      <AvatarFallback>{getInitials(bm.membro?.nome || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{bm.membro?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Entrada: {formatDateTime(bm.data_entrada)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasValidPhone(bm.membro?.telefone) && (
                      <button
                        onClick={() => window.open(getWhatsAppUrl(bm.membro?.telefone), '_blank')}
                        className="text-green-600 hover:text-green-700 p-1.5"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeMembro(bm.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== VISITANTES EM ACOMPANHAMENTO ===== */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Visitantes em Acompanhamento ({visitantesBase.length})
          </CardTitle>
          <Select value={filtroStatusVisitante} onValueChange={setFiltroStatusVisitante}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="contato_iniciado">Contato Iniciado</SelectItem>
              <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {visitantesFiltrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum visitante encontrado</p>
          ) : (
            <div className="space-y-2">
              {visitantesFiltrados.map((bv) => (
                <div key={bv.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(bv.visitante?.nome || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{bv.visitante?.nome}</p>
                      {bv.visitante?.telefone && (
                        <p className="text-xs text-muted-foreground">{bv.visitante.telefone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[bv.statusAcompanhamento || bv.status] || statusColors.novo}>
                      {statusLabels[bv.statusAcompanhamento || bv.status] || 'Novo'}
                    </Badge>
                    {hasValidPhone(bv.visitante?.telefone) && (
                      <button
                        onClick={() => window.open(getWhatsAppUrl(bv.visitante?.telefone), '_blank')}
                        className="text-green-600 hover:text-green-700 p-1.5"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeVisitante(bv.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
