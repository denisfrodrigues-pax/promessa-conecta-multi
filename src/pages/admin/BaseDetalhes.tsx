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
import { ArrowLeft, Save, Network, UserPlus, UserMinus, Phone, Edit, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  status: string;
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

export default function BaseDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [base, setBase] = useState<Base | null>(null);
  const [membrosBase, setMembrosBase] = useState<BaseMembro[]>([]);
  const [membrosDisponiveis, setMembrosDisponiveis] = useState<Membro[]>([]);
  const [liderInfo, setLiderInfo] = useState<Membro | null>(null);
  const [todosMembros, setTodosMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchMembro, setSearchMembro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    status: '',
  });

  useEffect(() => {
    if (id) {
      fetchBase();
      fetchMembrosBase();
      fetchTodosMembros();
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
      .eq('status', 'ativo');

    if (!error && data) {
      setMembrosBase(data as unknown as BaseMembro[]);
    }
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
    // Get members not in any active base
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
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => addMembro(membro.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={membro.foto_perfil || undefined} />
                            <AvatarFallback>{getInitials(membro.nome)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{membro.nome}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <UserPlus className="h-4 w-4" />
                        </Button>
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
                <div
                  key={bm.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bm.membro.foto_perfil || undefined} />
                      <AvatarFallback>{getInitials(bm.membro.nome)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{bm.membro.nome}</p>
                      {bm.membro.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {bm.membro.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
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
    </div>
  );
}
