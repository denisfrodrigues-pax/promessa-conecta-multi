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

interface Membro {
  id: string;
  nome: string;
}

export default function BaseNova() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    status: 'ativo',
  });

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    const { data, error } = await supabase
      .from('membros')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome');

    if (!error && data) {
      setMembros(data);
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bases')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6" />
          Nova Base
        </h1>
      </div>

      <Card className="shadow-card max-w-2xl">
        <CardHeader>
          <CardTitle>Dados da Base</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da base"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lider">Líder</Label>
              <Select
                value={formData.lider_id}
                onValueChange={(value) => setFormData({ ...formData, lider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {membros.map((membro) => (
                    <SelectItem key={membro.id} value={membro.id}>
                      {membro.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/bases')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Criar Base'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
