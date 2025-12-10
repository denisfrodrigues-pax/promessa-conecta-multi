import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Acompanhamento {
  id: string;
  visitante_id: string;
  base_id: string;
  status: string;
  observacao: string | null;
  updated_at: string;
  visitante: { nome: string; telefone: string | null };
  base: { nome: string };
}

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

export default function Acompanhamento() {
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAcomp, setSelectedAcomp] = useState<Acompanhamento | null>(null);
  const [formData, setFormData] = useState({ status: '', observacao: '' });

  useEffect(() => {
    fetchAcompanhamentos();
  }, [filtroStatus]);

  const fetchAcompanhamentos = async () => {
    setLoading(true);
    const now = new Date();
    const inicio = startOfMonth(now).toISOString();
    const fim = endOfMonth(now).toISOString();

    // Get latest acompanhamento per visitor/base pair
    let query = supabase
      .from('acompanhamentos')
      .select(`
        id,
        visitante_id,
        base_id,
        status,
        observacao,
        updated_at,
        visitante:visitantes(nome, telefone),
        base:bases(nome)
      `)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .order('updated_at', { ascending: false });

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Erro ao carregar acompanhamentos');
      setLoading(false);
      return;
    }

    // Deduplicate: keep only latest per visitante_id + base_id
    const seen = new Set<string>();
    const unique: Acompanhamento[] = [];
    for (const item of data || []) {
      const key = `${item.visitante_id}-${item.base_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item as unknown as Acompanhamento);
      }
    }

    setAcompanhamentos(unique);
    setLoading(false);
  };

  const filtered = acompanhamentos.filter((a) =>
    a.visitante?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (acomp: Acompanhamento) => {
    setSelectedAcomp(acomp);
    setFormData({ status: acomp.status, observacao: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedAcomp || !formData.status) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('acompanhamentos').insert({
        visitante_id: selectedAcomp.visitante_id,
        base_id: selectedAcomp.base_id,
        status: formData.status,
        observacao: formData.observacao.trim() || null,
      });

      if (error) throw error;

      toast.success('Acompanhamento atualizado!');
      setModalOpen(false);
      fetchAcompanhamentos();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Acompanhamento
          </h1>
          <p className="text-muted-foreground">Acompanhe visitantes vinculados às bases</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do visitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Acompanhamentos do Mês ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum acompanhamento encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((acomp) => (
                <div
                  key={acomp.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{acomp.visitante?.nome || 'Visitante'}</p>
                    <p className="text-sm text-muted-foreground">
                      Base: {acomp.base?.nome || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {format(new Date(acomp.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[acomp.status]}>
                      {statusLabels[acomp.status]}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openModal(acomp)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Acompanhamento</DialogTitle>
          </DialogHeader>
          {selectedAcomp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Visitante: <strong>{selectedAcomp.visitante?.nome}</strong>
              </p>
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Adicione uma observação..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
