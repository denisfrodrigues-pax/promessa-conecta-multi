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
import { BaseFotoUpload } from '@/components/base/BaseFotoUpload';

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
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    foto_url: '',
    anfitrioes: '',
    whatsapp_lider: '',
    capacidade: 20,
    visibilidade: 'publico',
    lider_id: '',
    status: 'ativo',
    observacoes: '',
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
        rua: formData.rua.trim() || null,
        numero: formData.numero.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        uf: formData.uf.trim() || null,
        foto_url: formData.foto_url.trim() || null,
        anfitrioes: formData.anfitrioes.trim() || null,
        whatsapp_lider: formData.whatsapp_lider.trim() || null,
        capacidade: formData.capacidade,
        visibilidade: formData.visibilidade,
        lider_id: formData.lider_id || null,
        status: formData.status,
        observacoes: formData.observacoes.trim() || null,
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

            {/* Local (referência) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Local (referência)</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Próximo ao parque central"
              />
            </div>

            {/* Endereço completo */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Endereço (visível apenas para membros)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Rua</Label>
                  <Input
                    value={formData.rua}
                    onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Nº"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">UF</Label>
                  <Input
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Foto, Anfitriões e Contato */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Foto, Anfitriões e Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <BaseFotoUpload
                    currentUrl={formData.foto_url || null}
                    baseId="new"
                    onUploadComplete={(url) => setFormData({ ...formData, foto_url: url })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Anfitriões</Label>
                  <Input
                    value={formData.anfitrioes}
                    onChange={(e) => setFormData({ ...formData, anfitrioes: e.target.value })}
                    placeholder="Ex: João e Maria, Família Silva"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">WhatsApp do Líder</Label>
                  <Input
                    value={formData.whatsapp_lider}
                    onChange={(e) => setFormData({ ...formData, whatsapp_lider: e.target.value })}
                    placeholder="(99) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações importantes, orientações internas, detalhes logísticos..."
                rows={3}
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
