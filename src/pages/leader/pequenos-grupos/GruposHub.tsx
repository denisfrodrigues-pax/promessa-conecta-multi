import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { BaseFotoUpload } from '@/components/base/BaseFotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Network, Users, Target, Clock, MapPin, ChevronRight, Plus, Search, Loader2,
} from 'lucide-react';

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  status: string;
  membros_count: number;
}

const DIAS_SEMANA = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const formVazio = () => ({
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
  capacidade: '20',
  foto_url: '',
  anfitrioes: '',
  whatsapp_lider: '',
  observacoes: '',
  visibilidade: 'privado',
  status: 'ativo',
});

export default function GruposHub() {
  const navigate = useNavigate();
  const { ministerioId } = useOutletContext<{ ministerioId: string }>();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroDia, setFiltroDia] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(formVazio());

  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['pg_grupos', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bases')
        .select('id, nome, descricao, dia_semana, horario, local, capacidade, status')
        .eq('ministerio_id', ministerioId)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      const comContagem = await Promise.all(
        (data as Grupo[]).map(async (g) => {
          const { count } = await (supabase as any)
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', g.id)
            .eq('status', 'ativo');
          return { ...g, membros_count: count ?? 0 };
        })
      );

      return comContagem as Grupo[];
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (f: ReturnType<typeof formVazio>) => {
      const { error } = await (supabase as any).from('bases').insert({
        nome: f.nome.trim(),
        descricao: f.descricao.trim() || null,
        dia_semana: f.dia_semana || null,
        horario: f.horario || null,
        local: f.local.trim() || null,
        rua: f.rua.trim() || null,
        numero: f.numero.trim() || null,
        bairro: f.bairro.trim() || null,
        cidade: f.cidade.trim() || null,
        uf: f.uf.trim() || null,
        capacidade: parseInt(f.capacidade) || 20,
        foto_url: f.foto_url || null,
        anfitrioes: f.anfitrioes.trim() || null,
        whatsapp_lider: f.whatsapp_lider.trim() || null,
        observacoes: f.observacoes.trim() || null,
        visibilidade: f.visibilidade,
        status: f.status,
        ministerio_id: ministerioId,
        lider_id: profile?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pg_grupos'] });
      toast.success('Grupo criado com sucesso!');
      setModalAberto(false);
      setForm(formVazio());
    },
    onError: (e: any) => toast.error('Erro ao criar grupo: ' + (e?.message ?? '')),
  });

  const gruposFiltrados = grupos.filter((g) => {
    const matchBusca = !busca || g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.local?.toLowerCase().includes(busca.toLowerCase());
    const matchDia = !filtroDia || g.dia_semana === filtroDia;
    return matchBusca && matchDia;
  });

  const totalMembros = grupos.reduce((s, g) => s + g.membros_count, 0);
  const totalCapacidade = grupos.reduce((s, g) => s + (g.capacidade ?? 20), 0);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-promessa-600" />
            Pequenos Grupos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} ativo{grupos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* KPIs */}
      {grupos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-promessa-100 flex items-center justify-center">
                <Network className="w-5 h-5 text-promessa-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{grupos.length}</p>
                <p className="text-xs text-muted-foreground">Grupos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembros}</p>
                <p className="text-xs text-muted-foreground">Membros</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCapacidade}</p>
                <p className="text-xs text-muted-foreground">Capacidade</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou local…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filtroDia}
          onChange={(e) => setFiltroDia(e.target.value)}
        >
          <option value="">Todos os dias</option>
          {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {(busca || filtroDia) && (
          <Button variant="ghost" size="sm" onClick={() => { setBusca(''); setFiltroDia(''); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Network className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca || filtroDia ? 'Nenhum grupo encontrado.' : 'Nenhum grupo cadastrado ainda.'}
          </p>
          {!busca && !filtroDia && (
            <Button className="mt-4" onClick={() => setModalAberto(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Grupo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gruposFiltrados.map((g) => {
            const ocupacao = Math.round((g.membros_count / (g.capacidade ?? 20)) * 100);
            const lotado = ocupacao >= 100;

            return (
              <Card
                key={g.id}
                className="group hover:shadow-md transition-all cursor-pointer hover:border-promessa-200"
                onClick={() => navigate(`grupo/${g.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground group-hover:text-promessa-700 transition-colors truncate">
                        {g.nome}
                      </p>
                      {g.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {lotado && <Badge variant="destructive" className="text-xs">Lotado</Badge>}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium text-foreground">{g.membros_count}</span>/{g.capacidade ?? 20}
                    </span>
                    {g.dia_semana && g.horario && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {g.dia_semana} · {g.horario}
                      </span>
                    )}
                    {g.local && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{g.local}</span>
                      </span>
                    )}
                  </div>

                  {/* Barra de ocupação */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Ocupação</span>
                      <span className={lotado ? 'text-destructive font-medium' : ''}>{ocupacao}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          lotado ? 'bg-destructive' : ocupacao >= 80 ? 'bg-amber-500' : 'bg-promessa-500'
                        }`}
                        style={{ width: `${Math.min(ocupacao, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Criar Grupo */}
      <Dialog open={modalAberto} onOpenChange={(v) => { setModalAberto(v); if (!v) setForm(formVazio()); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Novo Grupo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Foto */}
            <BaseFotoUpload
              currentUrl={form.foto_url || null}
              baseId="new"
              onUploadComplete={(url) => set('foto_url', url)}
            />

            {/* Básico */}
            <div className="space-y-3">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Nome do grupo"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => set('descricao', e.target.value)}
                  placeholder="Uma breve descrição do grupo..."
                  rows={2}
                />
              </div>
            </div>

            {/* Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dia da semana</Label>
                <Select value={form.dia_semana} onValueChange={(v) => set('dia_semana', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={form.horario}
                  onChange={(e) => set('horario', e.target.value)}
                />
              </div>
            </div>

            {/* Local */}
            <div>
              <Label>Nome do Local</Label>
              <Input
                value={form.local}
                onChange={(e) => set('local', e.target.value)}
                placeholder="Ex: Casa do João, Salão da Igreja..."
              />
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Endereço completo</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>Rua</Label>
                  <Input
                    value={form.rua}
                    onChange={(e) => set('rua', e.target.value)}
                    placeholder="Rua / Av."
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={form.numero}
                    onChange={(e) => set('numero', e.target.value)}
                    placeholder="Nº"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={form.bairro}
                    onChange={(e) => set('bairro', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => set('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
              </div>
              <div className="w-24">
                <Label>UF</Label>
                <Input
                  value={form.uf}
                  onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Liderança */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Anfitriões</Label>
                <Input
                  value={form.anfitrioes}
                  onChange={(e) => set('anfitrioes', e.target.value)}
                  placeholder="Nome(s) do(s) anfitrião(ões)"
                />
              </div>
              <div>
                <Label>WhatsApp do Líder</Label>
                <Input
                  value={form.whatsapp_lider}
                  onChange={(e) => set('whatsapp_lider', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Capacidade + Visibilidade + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Capacidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.capacidade}
                  onChange={(e) => set('capacidade', e.target.value)}
                />
              </div>
              <div>
                <Label>Visibilidade</Label>
                <Select value={form.visibilidade} onValueChange={(v) => set('visibilidade', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o grupo..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button
              disabled={!form.nome.trim() || criarMutation.isPending}
              onClick={() => criarMutation.mutate(form)}
            >
              {criarMutation.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Plus className="w-4 h-4 mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
