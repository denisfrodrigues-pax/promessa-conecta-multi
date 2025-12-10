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
import { ArrowLeft, Save, Network, UserPlus, UserMinus, Phone, Edit, X, Search, Clock, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function BaseDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [base, setBase] = useState<Base | null>(null);
  const [membrosBase, setMembrosBase] = useState<BaseMembro[]>([]);
  const [membrosDisponiveis, setMembrosDisponiveis] = useState<Membro[]>([]);
  const [liderInfo, setLiderInfo] = useState<Membro | null>(null);
  const [todosMembros, setTodosMembros] = useState<Membro[]>([]);
  const [visitantesBase, setVisitantesBase] = useState<BaseVisitante[]>([]);
  const [filtroStatusVisitante, setFiltroStatusVisitante] = useState<string>('todos');
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

  const visitantesFiltrados = filtroStatusVisitante === 'todos'
    ? visitantesBase
    : visitantesBase.filter(v => (v.statusAcompanhamento || v.status) === filtroStatusVisitante);

  useEffect(() => {
    if (id) {
      fetchBase();
      fetchMembrosBase();
      fetchTodosMembros();
      fetchVisitantesBase();
    }
  }, [id]);

  const fetchBase = async () => {
    const { data, error } = await supabase
      .from('bases')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      toast.error('Erro ao carregar base');
      return;
    }

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
          .from('membros')
          .select('id, nome, telefone, foto_perfil')
          .eq('id', data.lider_id)
          .maybeSingle();
        setLiderInfo(lider);
      }
    }
    setLoading(false);
  };

  const fetchMembrosBase = async () => {
    const { data, error } = await supabase
      .from('bases_membros')
      .select(`
        id,
        membro_id,
        data_entrada,
        membro:membros(id, nome, telefone, foto_perfil)
      `)
      .eq('base_id', id)
      .eq('status', 'ativo')
      .not('membro_id', 'is', null);

    if (!error && data) {
      setMembrosBase(data as unknown as BaseMembro[]);
    }
  };

  const fetchVisitantesBase = async () => {
    const { data, error } = await supabase
      .from('bases_membros')
      .select(`
        id,
        visitante_id,
        status,
        observacao,
        visitante:visitantes(id, nome, telefone)
      `)
      .eq('base_id', id)
      .not('visitante_id', 'is', null)
      .neq('status', 'desligado');

    if (!error && data) {
      const visitanteIds = data.map(d => d.visitante_id).filter(Boolean);
      const { data: acompData } = await supabase
        .from('acompanhamentos')
        .select('visitante_id, status, created_at')
        .eq('base_id', id)
        .in('visitante_id', visitanteIds)
        .order('created_at', { ascending: false });

      const latestStatus: Record<string, string> = {};
      for (const acomp of acompData || []) {
        if (!latestStatus[acomp.visitante_id]) {
          latestStatus[acomp.visitante_id] = acomp.status;
        }
      }

      const enriched = (data as unknown as BaseVisitante[]).map(bv => ({
        ...bv,
        statusAcompanhamento: latestStatus[bv.visitante_id] || bv.status,
      }));
      setVisitantesBase(enriched);
    }
  };

  const removeVisitante = async (baseVisitanteId: string) => {
    try {
      const { error } = await supabase
        .from('bases_membros')
        .update({
          status: 'desligado',
          data_saida: new Date().toISOString(),
        })
        .eq('id', baseVisitanteId);

      if (error) throw error;

      toast.success('Visitante removido da base');
      fetchVisitantesBase();
    } catch (error: any) {
      toast.error('Erro ao remover visitante: ' + error.message);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      em_acompanhamento: 'Em Acompanhamento',
      novo: 'Novo',
      contato_iniciado: 'Contato Iniciado',
      concluido: 'Concluído',
      ativo: 'Ativo',
    };
    return labels[status] || status;
  };

  const fetchTodosMembros = async () => {
    const { data } = await supabase
      .from('membros')
      .select('id, nome, telefone, foto_perfil')
      .eq('status', 'ativo')
      .order('nome');

    if (data) {
      setTodosMembros(data);
    }
  };

  const fetchMembrosDisponiveis = async () => {
    const { data: emBase } = await supabase
      .from('bases_membros')
      .select('membro_id')
      .eq('status', 'ativo');

    const idsEmBase = (emBase || []).map((m) => m.membro_id);

    const disponiveis = todosMembros.filter((m) => !idsEmBase.includes(m.id));
    setMembrosDisponiveis(disponiveis);
  };

  useEffect(() => {
    if (addModalOpen) {
      fetchMembrosDisponiveis();
    }
  }, [addModalOpen, todosMembros]);

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
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

      if (error) throw error;

      toast.success('Base atualizada!');
      setEditing(false);
      fetchBase();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addMembro = async (membroId: string) => {
    try {
      const { error } = await supabase.from('bases_membros').insert({
        base_id: id,
        membro_id: membroId,
        status: 'ativo',
      });

      if (error) throw error;

      toast.success('Membro adicionado à base!');
      setAddModalOpen(false);
      fetchMembrosBase();
    } catch (error: any) {
      toast.error('Erro ao adicionar membro: ' + error.message);
    }
  };

  const removeMembro = async (baseMembroId: string) => {
    try {
      const { error } = await supabase
        .from('bases_membros')
        .update({
          status: 'desligado',
          data_saida: new Date().toISOString(),
        })
        .eq('id', baseMembroId);

      if (error) throw error;

      toast.success('Membro removido da base');
      fetchMembrosBase();
    } catch (error: any) {
      toast.error('Erro ao remover membro: ' + error.message);
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredDisponiveis = membrosDisponiveis.filter((m) =>
    m.nome.toLowerCase().includes(searchMembro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!base) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Base não encontrada</p>
        <Button variant="link" onClick={() => navigate('/admin/bases')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6" />
          {base.nome}
        </h1>
        <Badge className={base.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {base.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Badge>
        <Badge variant={base.visibilidade === 'publico' ? 'default' : 'secondary'}>
          {base.visibilidade === 'publico' ? 'Público' : 'Privado'}
        </Badge>
      </div>

      {/* Dados da Base */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dados da Base</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={formData.dia_semana || "none"}
                    onValueChange={(v) => setFormData({ ...formData, dia_semana: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {diasSemana.map((dia) => (
                        <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Endereço ou local do encontro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacidade</Label>
                  <Input
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 20 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select
                    value={formData.visibilidade}
                    onValueChange={(v) => setFormData({ ...formData, visibilidade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Líder</Label>
                <Select
                  value={formData.lider_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, lider_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {todosMembros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{base.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {format(new Date(base.data_criacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              {base.descricao && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-medium">{base.descricao}</p>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dia e Horário</p>
                  <p className="font-medium">
                    {base.dia_semana && base.horario 
                      ? `${base.dia_semana} às ${base.horario}` 
                      : 'Não definido'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{base.local || 'Não definido'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade</p>
                  <p className="font-medium">{base.capacidade || 20} pessoas</p>
                </div>
              </div>
              {liderInfo && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Líder</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={liderInfo.foto_perfil || undefined} />
                      <AvatarFallback>{getInitials(liderInfo.nome)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{liderInfo.nome}</p>
                      {liderInfo.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {liderInfo.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Membros da Base */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membros da Base ({membrosBase.length})</CardTitle>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Membro à Base</DialogTitle>
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
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum membro disponível
                    </p>
                  ) : (
                    filteredDisponiveis.map((membro) => (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => addMembro(membro.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={membro.foto_perfil || undefined} />
                            <AvatarFallback>{getInitials(membro.nome)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{membro.nome}</span>
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
            <div className="space-y-3">
              {membrosBase.map((bm) => (
                <div key={bm.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bm.membro?.foto_perfil || undefined} />
                      <AvatarFallback>{getInitials(bm.membro?.nome || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{bm.membro?.nome}</p>
                      {bm.membro?.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {bm.membro.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeMembro(bm.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visitantes em Acompanhamento */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visitantes em Acompanhamento ({visitantesBase.length})</CardTitle>
          <Select value={filtroStatusVisitante} onValueChange={setFiltroStatusVisitante}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar status" />
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
            <div className="space-y-3">
              {visitantesFiltrados.map((bv) => (
                <div key={bv.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(bv.visitante?.nome || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{bv.visitante?.nome}</p>
                      {bv.visitante?.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {bv.visitante.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      bv.statusAcompanhamento === 'concluido' ? 'bg-green-100 text-green-800' :
                      bv.statusAcompanhamento === 'em_acompanhamento' ? 'bg-purple-100 text-purple-800' :
                      bv.statusAcompanhamento === 'contato_iniciado' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }>
                      {getStatusLabel(bv.statusAcompanhamento || bv.status)}
                    </Badge>
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
