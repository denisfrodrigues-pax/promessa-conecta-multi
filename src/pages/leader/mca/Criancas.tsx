import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, UserPlus, Users, Search, Baby, Phone } from 'lucide-react';

interface Sala { id: string; nome: string }

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sala_id: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
  parentesco: string;
  is_primary: boolean;
}

interface CriancaForm {
  nome: string;
  data_nascimento: string;
  sala_id: string;
  observacoes: string;
  ativo: boolean;
}

interface RespForm {
  nome: string;
  telefone: string;
  parentesco: string;
  is_primary: boolean;
}

const EMPTY_CRIANCA: CriancaForm = { nome: '', data_nascimento: '', sala_id: 'sem_sala', observacoes: '', ativo: true };
const EMPTY_RESP: RespForm = { nome: '', telefone: '', parentesco: 'pai/mãe', is_primary: false };

function calcIdade(nascimento: string | null): string {
  if (!nascimento) return '';
  const hoje = new Date();
  const nasc = new Date(nascimento);
  const anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  const idade = m < 0 || (m === 0 && hoje.getDate() < nasc.getDate()) ? anos - 1 : anos;
  return `${idade} ano${idade !== 1 ? 's' : ''}`;
}

export default function Criancas() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const qc = useQueryClient();

  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  const [search, setSearch] = useState('');
  const [salaFilter, setSalaFilter] = useState('todas');

  const [modalCrianca, setModalCrianca] = useState<'create' | 'edit' | null>(null);
  const [editingCrianca, setEditingCrianca] = useState<Crianca | null>(null);
  const [formCrianca, setFormCrianca] = useState<CriancaForm>(EMPTY_CRIANCA);
  const [deleteTarget, setDeleteTarget] = useState<Crianca | null>(null);

  const [modalResp, setModalResp] = useState(false);
  const [selectedCriancaResp, setSelectedCriancaResp] = useState<Crianca | null>(null);
  const [editingResp, setEditingResp] = useState<Responsavel | null>(null);
  const [formResp, setFormResp] = useState<RespForm>(EMPTY_RESP);
  const [deleteResp, setDeleteResp] = useState<Responsavel | null>(null);

  const { data: salas = [] } = useQuery({
    queryKey: ['mca_salas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_salas').select('id, nome').eq('ministerio_id', ministerioId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Sala[];
    },
    enabled: !!ministerioId,
  });

  const { data: criancas = [], isLoading } = useQuery({
    queryKey: ['mca_criancas', churchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_criancas').select('*').eq('church_id', churchId).order('nome');
      if (error) throw error;
      return data as Crianca[];
    },
    enabled: !!churchId,
  });

  const { data: responsaveisMap = {} } = useQuery({
    queryKey: ['mca_responsaveis_all', churchId],
    queryFn: async () => {
      const ids = criancas.map(c => c.id);
      if (!ids.length) return {};
      const { data, error } = await (supabase as any)
        .from('mca_responsaveis').select('*').in('crianca_id', ids);
      if (error) throw error;
      const map: Record<string, Responsavel[]> = {};
      (data as (Responsavel & { crianca_id: string })[]).forEach(r => {
        if (!map[r.crianca_id]) map[r.crianca_id] = [];
        map[r.crianca_id].push(r);
      });
      return map;
    },
    enabled: criancas.length > 0,
  });

  const saveCriancaMutation = useMutation({
    mutationFn: async (v: CriancaForm) => {
      const payload = {
        nome: v.nome.trim(),
        data_nascimento: v.data_nascimento || null,
        sala_id: v.sala_id === 'sem_sala' ? null : v.sala_id || null,
        observacoes: v.observacoes.trim() || null,
        ativo: v.ativo,
      };
      if (editingCrianca) {
        const { error } = await (supabase as any).from('mca_criancas').update(payload).eq('id', editingCrianca.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('mca_criancas').insert({ ...payload, church_id: churchId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_criancas', churchId] });
      toast.success(editingCrianca ? 'Criança atualizada' : 'Criança cadastrada');
      setModalCrianca(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteCriancaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('mca_criancas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_criancas', churchId] });
      toast.success('Criança removida');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover'),
  });

  const { data: respsModal = [] } = useQuery({
    queryKey: ['mca_responsaveis', selectedCriancaResp?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_responsaveis').select('*').eq('crianca_id', selectedCriancaResp!.id).order('is_primary', { ascending: false });
      if (error) throw error;
      return data as Responsavel[];
    },
    enabled: !!selectedCriancaResp,
  });

  const saveRespMutation = useMutation({
    mutationFn: async (v: RespForm) => {
      const payload = { nome: v.nome.trim(), telefone: v.telefone.trim(), parentesco: v.parentesco, is_primary: v.is_primary };
      if (editingResp) {
        const { error } = await (supabase as any).from('mca_responsaveis').update(payload).eq('id', editingResp.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('mca_responsaveis').insert({ ...payload, crianca_id: selectedCriancaResp!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_responsaveis', selectedCriancaResp?.id] });
      qc.invalidateQueries({ queryKey: ['mca_responsaveis_all', churchId] });
      toast.success(editingResp ? 'Responsável atualizado' : 'Responsável adicionado');
      setEditingResp(null);
      setFormResp(EMPTY_RESP);
    },
    onError: () => toast.error('Erro ao salvar responsável'),
  });

  const deleteRespMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('mca_responsaveis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_responsaveis', selectedCriancaResp?.id] });
      qc.invalidateQueries({ queryKey: ['mca_responsaveis_all', churchId] });
      toast.success('Responsável removido');
      setDeleteResp(null);
    },
    onError: () => toast.error('Erro ao remover'),
  });

  const filtered = criancas.filter(c => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    const matchSala = salaFilter === 'todas' || c.sala_id === salaFilter ||
      (salaFilter === 'sem-sala' && !c.sala_id);
    return matchSearch && matchSala;
  });

  function openCreateCrianca() {
    setEditingCrianca(null);
    setFormCrianca(EMPTY_CRIANCA);
    setModalCrianca('create');
  }

  function openEditCrianca(c: Crianca) {
    setEditingCrianca(c);
    setFormCrianca({
      nome: c.nome,
      data_nascimento: c.data_nascimento ?? '',
      sala_id: c.sala_id ?? 'sem_sala',
      observacoes: c.observacoes ?? '',
      ativo: c.ativo,
    });
    setModalCrianca('edit');
  }

  function openResponsaveis(c: Crianca) {
    setSelectedCriancaResp(c);
    setEditingResp(null);
    setFormResp(EMPTY_RESP);
    setModalResp(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-promessa-900">Crianças</h1>
          <p className="text-muted-foreground text-sm mt-1">Cadastro de crianças e responsáveis</p>
        </div>
        <Button onClick={openCreateCrianca}><Plus className="w-4 h-4 mr-2" />Nova Criança</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={salaFilter} onValueChange={setSalaFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por sala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as salas</SelectItem>
            <SelectItem value="sem-sala">Sem sala</SelectItem>
            {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || salaFilter !== 'todas' ? 'Nenhuma criança encontrada para os filtros.' : 'Nenhuma criança cadastrada ainda.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const sala = salas.find(s => s.id === c.sala_id);
            const resps = responsaveisMap[c.id] ?? [];
            return (
              <Card key={c.id} className={`${c.ativo ? '' : 'opacity-60'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-promessa-100 flex items-center justify-center shrink-0">
                        <Baby className="w-4 h-4 text-promessa-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {c.data_nascimento && <span>{calcIdade(c.data_nascimento)}</span>}
                          {sala && <Badge variant="outline" className="text-xs py-0">{sala.nome}</Badge>}
                          {!c.sala_id && <span className="text-amber-500">Sem sala</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => openResponsaveis(c)}>
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {resps.length}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditCrianca(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Criança */}
      <Dialog open={!!modalCrianca} onOpenChange={() => setModalCrianca(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCrianca ? 'Editar Criança' : 'Nova Criança'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (!formCrianca.nome.trim()) { toast.error('Nome obrigatório'); return; } saveCriancaMutation.mutate(formCrianca); }}
            className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={formCrianca.nome} onChange={e => setFormCrianca(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome completo" />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={formCrianca.data_nascimento}
                onChange={e => setFormCrianca(p => ({ ...p, data_nascimento: e.target.value }))} />
            </div>
            <div>
              <Label>Sala</Label>
              <Select value={formCrianca.sala_id} onValueChange={v => setFormCrianca(p => ({ ...p, sala_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar sala" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_sala">Sem sala definida</SelectItem>
                  {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formCrianca.observacoes} onChange={e => setFormCrianca(p => ({ ...p, observacoes: e.target.value }))}
                placeholder="Alergias, necessidades especiais, etc." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalCrianca(null)}>Cancelar</Button>
              <Button type="submit" disabled={saveCriancaMutation.isPending}>
                {saveCriancaMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Responsáveis */}
      <Dialog open={modalResp} onOpenChange={v => { if (!v) { setModalResp(false); setSelectedCriancaResp(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responsáveis — {selectedCriancaResp?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lista */}
            {respsModal.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum responsável cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {respsModal.map(r => (
                  <div key={r.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{r.nome} {r.is_primary && <Badge className="ml-1 text-xs py-0">Principal</Badge>}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{r.telefone} · {r.parentesco}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingResp(r); setFormResp({ nome: r.nome, telefone: r.telefone, parentesco: r.parentesco, is_primary: r.is_primary }); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteResp(r)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form inline */}
            <div className="border rounded-lg p-3 space-y-3 bg-neutral-50">
              <p className="text-sm font-medium">{editingResp ? 'Editar Responsável' : 'Adicionar Responsável'}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input value={formResp.nome} onChange={e => setFormResp(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome do responsável" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Telefone *</Label>
                  <Input value={formResp.telefone} onChange={e => setFormResp(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Parentesco</Label>
                  <Input value={formResp.parentesco} onChange={e => setFormResp(p => ({ ...p, parentesco: e.target.value }))}
                    placeholder="pai/mãe" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="resp-primary" checked={formResp.is_primary}
                  onChange={e => setFormResp(p => ({ ...p, is_primary: e.target.checked }))} className="w-4 h-4" />
                <Label htmlFor="resp-primary" className="text-xs">Responsável principal</Label>
              </div>
              <div className="flex gap-2">
                {editingResp && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingResp(null); setFormResp(EMPTY_RESP); }}>
                    Cancelar
                  </Button>
                )}
                <Button size="sm" onClick={() => {
                  if (!formResp.nome.trim() || !formResp.telefone.trim()) { toast.error('Nome e telefone obrigatórios'); return; }
                  saveRespMutation.mutate(formResp);
                }} disabled={saveRespMutation.isPending}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  {editingResp ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção criança */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Criança</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover "{deleteTarget?.nome}"? Todos os check-ins e responsáveis serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteCriancaMutation.mutate(deleteTarget.id)}
              disabled={deleteCriancaMutation.isPending}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar remoção responsável */}
      <AlertDialog open={!!deleteResp} onOpenChange={() => setDeleteResp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Responsável</AlertDialogTitle>
            <AlertDialogDescription>Deseja remover "{deleteResp?.nome}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteResp && deleteRespMutation.mutate(deleteResp.id)}
              disabled={deleteRespMutation.isPending}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
