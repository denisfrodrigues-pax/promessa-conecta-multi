import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, UserPlus, Check, X, Save, ChevronDown, ChevronUp,
  Users, UserCheck, UserX, Clock, Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Turma { id: string; nome: string }

interface Pessoa {
  key: string;
  perfil_id: string | null;
  nome: string;
  is_visitante: boolean;
  presente: boolean;
}

interface Checkin {
  id: string;
  data: string;
  turma_id: string;
  ensino_turmas: { nome: string } | null;
  presentes: number;
  ausentes: number;
}

interface PerfilResult { id: string; nome: string }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Chamada() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();
  const { churchId, user } = useAuth();
  const qc = useQueryClient();

  const [turmaId, setTurmaId] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [sessaoAberta, setSessaoAberta] = useState(false);

  const [busca, setBusca] = useState('');
  const [nomeManual, setNomeManual] = useState('');
  const debouncedBusca = useDebounce(busca, 400);

  const [historicoAberto, setHistoricoAberto] = useState(false);

  const { data: turmas = [] } = useQuery({
    queryKey: ['ensino_turmas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_turmas').select('id, nome').eq('ministerio_id', ministerioId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Turma[];
    },
    enabled: !!ministerioId,
  });

  const { data: resultadosBusca = [] } = useQuery({
    queryKey: ['perfis_busca', debouncedBusca, churchId],
    queryFn: async () => {
      if (!debouncedBusca.trim() || debouncedBusca.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .ilike('nome', `%${debouncedBusca}%`)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as PerfilResult[];
    },
    enabled: debouncedBusca.length >= 2,
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['ensino_checkins_historico', turmaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ensino_checkins')
        .select('id, data, turma_id, ensino_turmas(nome)')
        .eq('turma_id', turmaId)
        .order('data', { ascending: false })
        .limit(20);
      if (error) throw error;
      const checkins = data as Checkin[];

      // Carregar contagens de presença para cada checkin
      const ids = checkins.map(c => c.id);
      if (!ids.length) return [];
      const { data: presencas } = await (supabase as any)
        .from('ensino_presencas').select('checkin_id, presente').in('checkin_id', ids);

      const counts: Record<string, { presentes: number; ausentes: number }> = {};
      (presencas ?? []).forEach((p: { checkin_id: string; presente: boolean }) => {
        if (!counts[p.checkin_id]) counts[p.checkin_id] = { presentes: 0, ausentes: 0 };
        if (p.presente) counts[p.checkin_id].presentes++;
        else counts[p.checkin_id].ausentes++;
      });

      return checkins.map(c => ({ ...c, ...( counts[c.id] ?? { presentes: 0, ausentes: 0 }) }));
    },
    enabled: !!turmaId,
  });

  async function abrirSessao() {
    if (!turmaId || !data) { toast.error('Selecione turma e data'); return; }

    // Buscar checkin existente para essa turma+data
    const { data: existing } = await (supabase as any)
      .from('ensino_checkins').select('id').eq('turma_id', turmaId).eq('data', data).maybeSingle();

    let id = existing?.id as string | null;

    if (id) {
      // Carregar presenças existentes
      const { data: presencas } = await (supabase as any)
        .from('ensino_presencas').select('*').eq('checkin_id', id);
      const lista: Pessoa[] = (presencas ?? []).map((p: any) => ({
        key: p.id,
        perfil_id: p.perfil_id,
        nome: p.nome_manual ?? `Perfil ${p.perfil_id?.slice(0, 6)}`,
        is_visitante: p.is_visitante,
        presente: p.presente,
      }));
      // Buscar nomes dos perfis
      const perfilIds = lista.filter(p => p.perfil_id).map(p => p.perfil_id!);
      if (perfilIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, nome').in('id', perfilIds);
        const map = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.nome]));
        lista.forEach(p => { if (p.perfil_id && map[p.perfil_id]) p.nome = map[p.perfil_id]; });
      }
      setPessoas(lista);
    } else {
      setPessoas([]);
    }

    setCheckinId(id);
    setSessaoAberta(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!turmaId || !data) throw new Error('Dados incompletos');

      let ckId = checkinId;

      if (!ckId) {
        const { data: newCk, error } = await (supabase as any)
          .from('ensino_checkins')
          .insert({
            turma_id: turmaId, church_id: churchId, ministerio_id: ministerioId,
            data, registrado_por: user?.id,
          })
          .select('id').single();
        if (error) throw error;
        ckId = newCk.id as string;
        setCheckinId(ckId);
      } else {
        // Apagar presenças anteriores para re-inserir
        await (supabase as any).from('ensino_presencas').delete().eq('checkin_id', ckId);
      }

      if (pessoas.length) {
        const rows = pessoas.map(p => ({
          checkin_id: ckId,
          perfil_id: p.perfil_id,
          nome_manual: p.perfil_id ? null : p.nome,
          is_visitante: p.is_visitante,
          presente: p.presente,
        }));
        const { error } = await (supabase as any).from('ensino_presencas').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ensino_checkins_historico', turmaId] });
      toast.success('Chamada salva');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar chamada'),
  });

  function adicionarDaBusca(perfil: PerfilResult) {
    if (pessoas.some(p => p.perfil_id === perfil.id)) {
      toast.info(`${perfil.nome} já está na chamada`);
      return;
    }
    setPessoas(prev => [...prev, {
      key: perfil.id, perfil_id: perfil.id, nome: perfil.nome,
      is_visitante: false, presente: true,
    }]);
    setBusca('');
  }

  function adicionarManual() {
    if (!nomeManual.trim()) return;
    setPessoas(prev => [...prev, {
      key: `manual_${Date.now()}`, perfil_id: null, nome: nomeManual.trim(),
      is_visitante: true, presente: true,
    }]);
    setNomeManual('');
  }

  function togglePresente(key: string) {
    setPessoas(prev => prev.map(p => p.key === key ? { ...p, presente: !p.presente } : p));
  }

  function removerPessoa(key: string) {
    setPessoas(prev => prev.filter(p => p.key !== key));
  }

  async function carregarCheckin(cId: string, cData: string) {
    const { data: presencas } = await (supabase as any)
      .from('ensino_presencas').select('*').eq('checkin_id', cId);
    const lista: Pessoa[] = (presencas ?? []).map((p: any) => ({
      key: p.id,
      perfil_id: p.perfil_id,
      nome: p.nome_manual ?? `Perfil ${p.perfil_id?.slice(0, 6)}`,
      is_visitante: p.is_visitante,
      presente: p.presente,
    }));
    const perfilIds = lista.filter(p => p.perfil_id).map(p => p.perfil_id!);
    if (perfilIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, nome').in('id', perfilIds);
      const map = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.nome]));
      lista.forEach(p => { if (p.perfil_id && map[p.perfil_id]) p.nome = map[p.perfil_id]; });
    }
    setData(cData);
    setCheckinId(cId);
    setPessoas(lista);
    setSessaoAberta(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const presentes = pessoas.filter(p => p.presente).length;
  const ausentes = pessoas.filter(p => !p.presente).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-promessa-900">Chamada</h1>
        <p className="text-muted-foreground text-sm mt-1">Registro de presença por turma</p>
      </div>

      {/* Seleção de turma e data */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Turma</label>
              <Select value={turmaId} onValueChange={v => { setTurmaId(v); setSessaoAberta(false); setCheckinId(null); setPessoas([]); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar turma" /></SelectTrigger>
                <SelectContent>
                  {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input type="date" value={data} onChange={e => { setData(e.target.value); setSessaoAberta(false); setPessoas([]); }} className="mt-1" />
            </div>
          </div>
          <Button onClick={abrirSessao} disabled={!turmaId || !data} className="w-full sm:w-auto">
            {checkinId ? 'Carregar Chamada' : 'Iniciar Nova Chamada'}
          </Button>
        </CardContent>
      </Card>

      {/* Chamada ativa */}
      {sessaoAberta && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-promessa-700">{pessoas.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />Total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-green-600">{presentes}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <UserCheck className="w-3 h-3" />Presentes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-red-400">{ausentes}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <UserX className="w-3 h-3" />Ausentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Adicionar pessoas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Adicionar Participantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Busca de membros */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar membro por nome..."
                  value={busca} onChange={e => setBusca(e.target.value)} />
                {resultadosBusca.length > 0 && busca && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {resultadosBusca.map(p => (
                      <button key={p.id} className="w-full px-4 py-2 text-sm text-left hover:bg-promessa-50 flex items-center gap-2"
                        onClick={() => adicionarDaBusca(p)}>
                        <UserPlus className="w-3.5 h-3.5 text-promessa-500" />
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nome manual */}
              <div className="flex gap-2">
                <Input placeholder="Adicionar visitante manualmente..."
                  value={nomeManual} onChange={e => setNomeManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarManual()} />
                <Button variant="outline" onClick={adicionarManual} disabled={!nomeManual.trim()}>
                  <UserPlus className="w-4 h-4 mr-1" />Visitante
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de pessoas */}
          {pessoas.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Nenhum participante adicionado. Busque membros ou adicione visitantes acima.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {pessoas.map(p => (
                <div key={p.key}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-colors ${p.presente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-75'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-medium text-sm truncate ${p.presente ? 'text-green-800' : 'text-red-700 line-through'}`}>
                      {p.nome}
                    </span>
                    {p.is_visitante && (
                      <Badge variant="outline" className="text-xs py-0 border-amber-300 text-amber-700">Visitante</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePresente(p.key)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${p.presente ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-400 text-white hover:bg-red-500'}`}
                      title={p.presente ? 'Marcar ausente' : 'Marcar presente'}>
                      {p.presente ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removerPessoa(p.key)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg" className="w-full sm:w-auto">
            {saveMutation.isPending
              ? <><span className="w-4 h-4 mr-2 inline-block animate-spin border-2 border-current border-t-transparent rounded-full" />Salvando...</>
              : <><Save className="w-4 h-4 mr-2" />Salvar Chamada</>}
          </Button>
        </>
      )}

      {/* Histórico */}
      {turmaId && historico.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            onClick={() => setHistoricoAberto(p => !p)}>
            <Clock className="w-4 h-4" />
            Histórico de chamadas ({historico.length})
            {historicoAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {historicoAberto && (
            <div className="space-y-2">
              {historico.map(h => (
                <Card key={h.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {format(new Date(h.data + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.ensino_turmas?.nome}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-3 text-xs">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <UserCheck className="w-3.5 h-3.5" />{h.presentes}
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <UserX className="w-3.5 h-3.5" />{h.ausentes}
                          </span>
                        </div>
                        <Button
                          size="sm" variant="outline"
                          className="text-promessa-700 border-promessa-300 hover:bg-promessa-50"
                          onClick={() => carregarCheckin(h.id, h.data)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
