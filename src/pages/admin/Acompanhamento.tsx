import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Users, Clock, MapPin, AlertTriangle, Download, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface BaseInfo {
  nome: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  lider_id: string | null;
  lider_nome?: string;
  membros_count?: number;
}

interface Acompanhamento {
  id: string;
  visitante_id: string;
  base_id: string;
  status: string;
  observacao: string | null;
  updated_at: string;
  visitante: { nome: string; telefone: string | null };
  base: BaseInfo;
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

// Helper: Clean phone number (remove non-numeric chars)
const cleanPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Helper: Check if phone is valid
const hasValidPhone = (phone: string | null): boolean => {
  const cleaned = cleanPhone(phone);
  return cleaned.length >= 10;
};

// Helper: Generate WhatsApp URL
const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  const message = encodeURIComponent(`Olá! Sou da ${churchNome || 'nossa Igreja'}. Estou entrando em contato sobre sua visita recente :)`);
  return `https://wa.me/55${cleaned}?text=${message}`;
};

// Helper: Export to CSV
const exportToCSV = (data: Acompanhamento[]) => {
  const headers = ['visitante_nome', 'visitante_telefone', 'base_nome', 'status', 'observacao', 'data'];
  
  const rows = data.map((acomp) => [
    acomp.visitante?.nome || '',
    acomp.visitante?.telefone || '',
    acomp.base?.nome || '',
    statusLabels[acomp.status] || acomp.status,
    acomp.observacao || '',
    format(new Date(acomp.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  ]);

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `acompanhamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Acompanhamento() {
  const { churchId: authChurchId } = useAuth();
  const { church, churchNome } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
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
  }, [filtroStatus, churchId]);

  const fetchAcompanhamentos = async () => {
    if (!churchId) return;
    setLoading(true);
    const now = new Date();
    const inicio = startOfMonth(now).toISOString();
    const fim = endOfMonth(now).toISOString();

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
        base:bases(nome, dia_semana, horario, local, capacidade, lider_id)
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

    // Fetch leader names and member counts for each base
    const enriched = await Promise.all(
      unique.map(async (acomp) => {
        let lider_nome: string | undefined;
        let membros_count = 0;

        if (acomp.base?.lider_id) {
          const { data: lider } = await supabase
            .from('membros')
            .select('nome')
            .eq('id', acomp.base.lider_id)
            .maybeSingle();
          lider_nome = lider?.nome;
        }

        const { count } = await supabase
          .from('bases_membros')
          .select('*', { count: 'exact', head: true })
          .eq('base_id', acomp.base_id)
          .eq('status', 'ativo');

        return {
          ...acomp,
          base: {
            ...acomp.base,
            lider_nome,
            membros_count: count || 0,
          },
        };
      })
    );

    setAcompanhamentos(enriched);
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

  const isBaseLotada = (base: BaseInfo) => {
    const capacidade = base.capacidade || 20;
    return (base.membros_count || 0) >= capacidade;
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    exportToCSV(filtered);
    toast.success('CSV exportado com sucesso!');
  };

  const handleWhatsAppClick = (phone: string | null) => {
    if (!hasValidPhone(phone)) return;
    window.open(getWhatsAppUrl(phone), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Acompanhamento
          </h1>
          <p className="text-muted-foreground">Acompanhe visitantes vinculados às bases</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={loading || filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

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
                <Skeleton key={i} className="h-24 w-full" />
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
                  className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{acomp.visitante?.nome || 'Visitante'}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={!hasValidPhone(acomp.visitante?.telefone)}
                          onClick={() => handleWhatsAppClick(acomp.visitante?.telefone)}
                          title={hasValidPhone(acomp.visitante?.telefone) ? 'Enviar WhatsApp' : 'Telefone não disponível'}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className={statusColors[acomp.status]}>
                          {statusLabels[acomp.status]}
                        </Badge>
                        {isBaseLotada(acomp.base) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Lotada
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Base: {acomp.base?.nome || '-'}</span>
                        {acomp.base?.lider_nome && (
                          <span>Líder: {acomp.base.lider_nome}</span>
                        )}
                        {acomp.base?.dia_semana && acomp.base?.horario && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {acomp.base.dia_semana} às {acomp.base.horario}
                          </span>
                        )}
                        {acomp.base?.local && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {acomp.base.local}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {acomp.base?.membros_count || 0} / {acomp.base?.capacidade || 20}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {format(new Date(acomp.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
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
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Visitante:</span>{' '}
                  <strong>{selectedAcomp.visitante?.nome}</strong>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Base:</span> {selectedAcomp.base?.nome}
                </p>
                {selectedAcomp.base?.dia_semana && selectedAcomp.base?.horario && (
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {selectedAcomp.base.dia_semana} às {selectedAcomp.base.horario}
                  </p>
                )}
                {selectedAcomp.base?.lider_nome && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Líder:</span> {selectedAcomp.base.lider_nome}
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">Status atual:</span>{' '}
                  <Badge variant="outline" className={`${statusColors[selectedAcomp.status]} text-xs`}>
                    {statusLabels[selectedAcomp.status]}
                  </Badge>
                </p>
                {selectedAcomp.observacao && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Última observação:</p>
                    <p className="text-sm bg-background p-2 rounded border">{selectedAcomp.observacao}</p>
                  </div>
                )}
              </div>
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
