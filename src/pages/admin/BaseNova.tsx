import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Network } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  nome: string;
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function BaseNova() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    dia_semana: '',
    horario: '',
    local: '',
    capacidade: 20,
    visibilidade: 'publico',
    lider_id: '',
    status: 'ativo',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome');

    if (data) setProfiles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bases').insert({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        dia_semana: formData.dia_semana || null,
        horario: formData.horario || null,
        local: formData.local.trim() || null,
        capacidade: formData.capacidade,
        visibilidade: formData.visibilidade,
        lider_id: formData.lider_id || null,
        status: formData.status,
      });

      if (error) throw error;

      toast.success('Base criada com sucesso!');
      navigate('/admin/bases');
    } catch (error: any) {
      toast.error('Erro ao criar base: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Network className="h-5 w-5" />
            Nova Base
          </h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para criar uma nova base</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da Base</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da base"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da base"
                rows={3}
              />
            </div>

            {/* Dia + Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dia da Semana</Label>
                <Select
                  value={formData.dia_semana || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, dia_semana: v === 'none' ? '' : v })}
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
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Horário</Label>
                <Input
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                />
              </div>
            </div>

            {/* Local */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Endereço ou local do encontro"
              />
            </div>

            {/* Capacidade + Visibilidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Capacidade</Label>
                <Input
                  type="number"
                  value={formData.capacidade}
                  onChange={(e) => setFormData({ ...formData, capacidade: parseInt(e.target.value) || 20 })}
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Visibilidade</Label>
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

            {/* Líder */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Líder</Label>
              <Select
                value={formData.lider_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, lider_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/bases')}>
                Voltar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'Salvando...' : 'Criar Base'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
