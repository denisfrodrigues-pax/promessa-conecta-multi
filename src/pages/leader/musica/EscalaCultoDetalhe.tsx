import { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Music,
  Palette,
  Loader2,
  Search,
  Youtube,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BuscaMusica, { SearchResultItem } from '@/components/musica/BuscaMusica';

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
}

interface MusicaCulto {
  id: string;
  ordem: number;
  titulo_avulso: string | null;
  artista_avulso: string | null;
  link_youtube: string | null;
  musica_id: string | null;
  musicas_repertorio: {
    titulo: string;
    artista: string | null;
    tom: string | null;
    link_youtube: string | null;
  } | null;
}

interface MusicaRepertorio {
  id: string;
  titulo: string;
  artista: string | null;
  tom: string | null;
  link_youtube: string | null;
}

interface PaletaCores {
  id: string;
  cor_primaria: string;
  cor_secundaria: string | null;
  cor_acento: string | null;
  observacao: string | null;
}

interface EventoInfo {
  id: string;
  titulo: string;
  data_evento: string;
  horario_inicio: string | null;
}

function useDebounceLocal(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function EscalaCultoDetalhe() {
  const { ministerioId } = useOutletContext<OutletCtx>();
  const { slug, eventoId } = useParams<{ slug: string; eventoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounceLocal(searchTerm, 400);
  const [buscaExternaOpen, setBuscaExternaOpen] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    artista: '',
    tom: '',
    link_youtube: '',
    link_deezer: '',
    capa_url: '',
    musica_id: null as string | null,
  });

  // Paleta state
  const [paletaForm, setPaletaForm] = useState({
    cor_primaria: '#1a1a2e',
    cor_secundaria: '',
    cor_acento: '',
    observacao: '',
  });
  const [paletaSaving, setPaletaSaving] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: evento } = useQuery({
    queryKey: ['evento_detalhe', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos_escala')
        .select('id, titulo, data_evento, horario_inicio')
        .eq('id', eventoId!)
        .single();
      if (error) throw error;
      return data as EventoInfo;
    },
    enabled: !!eventoId,
  });

  const { data: musicasCulto, isLoading } = useQuery({
    queryKey: ['musicas_culto', eventoId, ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicas_culto')
        .select(`
          id, ordem, titulo_avulso, artista_avulso, link_youtube, musica_id,
          musicas_repertorio (titulo, artista, tom, link_youtube)
        `)
        .eq('evento_id', eventoId!)
        .eq('ministerio_id', ministerioId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as unknown as MusicaCulto[];
    },
    enabled: !!eventoId && !!ministerioId,
  });

  const { data: paletaExistente } = useQuery({
    queryKey: ['culto_paleta', eventoId, ministerioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('culto_paleta_cores')
        .select('*')
        .eq('evento_id', eventoId!)
        .eq('ministerio_id', ministerioId)
        .maybeSingle();
      return data as PaletaCores | null;
    },
    enabled: !!eventoId && !!ministerioId,
  });

  // Populate paleta form when data loads
  useEffect(() => {
    if (paletaExistente) {
      setPaletaForm({
        cor_primaria: paletaExistente.cor_primaria,
        cor_secundaria: paletaExistente.cor_secundaria ?? '',
        cor_acento: paletaExistente.cor_acento ?? '',
        observacao: paletaExistente.observacao ?? '',
      });
    }
  }, [paletaExistente]);

  const { data: repertorioResultados } = useQuery({
    queryKey: ['repertorio_busca', ministerioId, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('musicas_repertorio')
        .select('id, titulo, artista, tom, link_youtube')
        .eq('ministerio_id', ministerioId)
        .limit(8);

      if (debouncedSearch) {
        query = query.ilike('titulo', `%${debouncedSearch}%`);
      }

      const { data, error } = await query.order('titulo');
      if (error) throw error;
      return (data ?? []) as MusicaRepertorio[];
    },
    enabled: showAddModal && !!ministerioId,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const addMusicaMutation = useMutation({
    mutationFn: async () => {
      const proximaOrdem = (musicasCulto?.length ?? 0) + 1;

      if (form.musica_id) {
        // Música do repertório
        const { error } = await (supabase as any).from('musicas_culto').insert({
          evento_id: eventoId!,
          ministerio_id: ministerioId,
          musica_id: form.musica_id,
          link_youtube: form.link_youtube || null,
          ordem: proximaOrdem,
          created_by: user?.id,
        });
        if (error) throw error;
      } else {
        // Música avulsa — trigger cria no repertório automaticamente
        const { error } = await (supabase as any).from('musicas_culto').insert({
          evento_id: eventoId!,
          ministerio_id: ministerioId,
          titulo_avulso: form.titulo,
          artista_avulso: form.artista || null,
          link_youtube: form.link_youtube || null,
          link_deezer: form.link_deezer || null,
          capa_url: form.capa_url || null,
          ordem: proximaOrdem,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas_culto', eventoId, ministerioId] });
      queryClient.invalidateQueries({ queryKey: ['repertorio_busca'] });
      toast.success('Música adicionada');
      setShowAddModal(false);
      resetForm();
    },
    onError: () => toast.error('Erro ao adicionar música'),
  });

  const deleteMusicaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('musicas_culto').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas_culto', eventoId, ministerioId] });
      toast.success('Música removida');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover música'),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      const updates = items.map(({ id, ordem }) =>
        supabase.from('musicas_culto').update({ ordem }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas_culto', eventoId, ministerioId] });
    },
    onError: () => toast.error('Erro ao reordenar'),
  });

  const salvarPaletaMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        evento_id: eventoId!,
        ministerio_id: ministerioId,
        cor_primaria: paletaForm.cor_primaria,
        cor_secundaria: paletaForm.cor_secundaria || null,
        cor_acento: paletaForm.cor_acento || null,
        observacao: paletaForm.observacao || null,
        created_by: user?.id,
      };

      if (paletaExistente) {
        const { error } = await supabase
          .from('culto_paleta_cores')
          .update(payload)
          .eq('id', paletaExistente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('culto_paleta_cores').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['culto_paleta', eventoId, ministerioId] });
      toast.success('Paleta salva');
    },
    onError: () => toast.error('Erro ao salvar paleta'),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ titulo: '', artista: '', tom: '', link_youtube: '', link_deezer: '', capa_url: '', musica_id: null });
    setSearchTerm('');
    setBuscaExternaOpen(false);
  };

  const handleSelectExterno = (item: SearchResultItem) => {
    setForm((f) => ({
      ...f,
      musica_id: null,
      titulo: f.titulo || item.titulo,
      artista: f.artista || item.artista,
      tom: item.tom ?? f.tom,
      link_youtube: item.link_youtube ?? f.link_youtube,
      link_deezer: item.link_deezer_busca ?? f.link_deezer,
      capa_url: item.capa_url ?? f.capa_url,
    }));
    setBuscaExternaOpen(false);
  };

  const moverMusica = (index: number, direcao: 'up' | 'down') => {
    if (!musicasCulto) return;
    const lista = [...musicasCulto];
    const swapIdx = direcao === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lista.length) return;

    [lista[index], lista[swapIdx]] = [lista[swapIdx], lista[index]];
    const atualizados = lista.map((m, i) => ({ id: m.id, ordem: i + 1 }));
    reorderMutation.mutate(atualizados);
  };

  const selecionarDoRepertorio = (m: MusicaRepertorio) => {
    setForm({
      musica_id: m.id,
      titulo: m.titulo,
      artista: m.artista ?? '',
      tom: m.tom ?? '',
      link_youtube: m.link_youtube ?? '',
    });
  };

  const getTituloMusica = (m: MusicaCulto) =>
    m.musicas_repertorio?.titulo ?? m.titulo_avulso ?? '—';
  const getArtista = (m: MusicaCulto) =>
    m.musicas_repertorio?.artista ?? m.artista_avulso ?? null;
  const getYoutube = (m: MusicaCulto) =>
    m.link_youtube ?? m.musicas_repertorio?.link_youtube ?? null;
  const getTom = (m: MusicaCulto) => m.musicas_repertorio?.tom ?? null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/leader/${slug}/escala-culto`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{evento?.titulo ?? '...'}</h1>
          {evento && (
            <p className="text-sm text-muted-foreground">
              {format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM", { locale: ptBR })}
              {evento.horario_inicio && ` · ${evento.horario_inicio.slice(0, 5)}`}
            </p>
          )}
        </div>
      </div>

      {/* Músicas do Culto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4" />
            Músicas do Culto
          </CardTitle>
          <Button size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-promessa-500" />
            </div>
          ) : !musicasCulto || musicasCulto.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma música adicionada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {musicasCulto.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm font-mono text-muted-foreground w-5 text-center">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getTituloMusica(m)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {getArtista(m) && <span>{getArtista(m)}</span>}
                      {getTom(m) && (
                        <span className="bg-promessa-100 text-promessa-700 px-1.5 py-0.5 rounded font-mono">
                          {getTom(m)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {getYoutube(m) && (
                      <a
                        href={getYoutube(m)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      onClick={() => moverMusica(idx, 'up')}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === musicasCulto.length - 1}
                      onClick={() => moverMusica(idx, 'down')}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paleta de Cores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-4 h-4" />
            Paleta de Cores do Culto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Cor primária *</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={paletaForm.cor_primaria}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_primaria: e.target.value }))}
                  className="w-10 h-9 rounded border cursor-pointer p-0.5"
                />
                <Input
                  value={paletaForm.cor_primaria}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_primaria: e.target.value }))}
                  placeholder="#1a1a2e"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cor secundária</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={paletaForm.cor_secundaria || '#ffffff'}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_secundaria: e.target.value }))}
                  className="w-10 h-9 rounded border cursor-pointer p-0.5"
                />
                <Input
                  value={paletaForm.cor_secundaria}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_secundaria: e.target.value }))}
                  placeholder="#ffffff"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cor acento</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={paletaForm.cor_acento || '#ffffff'}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_acento: e.target.value }))}
                  className="w-10 h-9 rounded border cursor-pointer p-0.5"
                />
                <Input
                  value={paletaForm.cor_acento}
                  onChange={(e) => setPaletaForm((p) => ({ ...p, cor_acento: e.target.value }))}
                  placeholder="#ffffff"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex gap-3 items-center">
            <div
              className="w-10 h-10 rounded-full border shadow"
              style={{ backgroundColor: paletaForm.cor_primaria }}
            />
            {paletaForm.cor_secundaria && (
              <div
                className="w-10 h-10 rounded-full border shadow"
                style={{ backgroundColor: paletaForm.cor_secundaria }}
              />
            )}
            {paletaForm.cor_acento && (
              <div
                className="w-10 h-10 rounded-full border shadow"
                style={{ backgroundColor: paletaForm.cor_acento }}
              />
            )}
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Input
              value={paletaForm.observacao}
              onChange={(e) => setPaletaForm((p) => ({ ...p, observacao: e.target.value }))}
              placeholder="Ex: Tema Páscoa, Natal…"
            />
          </div>

          <Button
            onClick={() => salvarPaletaMutation.mutate()}
            disabled={salvarPaletaMutation.isPending || !paletaForm.cor_primaria}
          >
            {salvarPaletaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Paleta
          </Button>
        </CardContent>
      </Card>

      {/* Modal Adicionar Música */}
      <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Música</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Busca no repertório */}
            <div className="space-y-1.5">
              <Label>Buscar no repertório</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Digite o título…"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setForm((f) => ({ ...f, musica_id: null })); }}
                />
              </div>

              {repertorioResultados && repertorioResultados.length > 0 && !form.musica_id && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {repertorioResultados.map((r) => (
                    <button
                      key={r.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                      onClick={() => selecionarDoRepertorio(r)}
                    >
                      <p className="text-sm font-medium">{r.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.artista ?? '—'}{r.tom ? ` · Tom: ${r.tom}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {form.musica_id && (
                <p className="text-xs text-promessa-600 font-medium">
                  ✓ Usando música do repertório
                  <button
                    className="ml-2 underline text-muted-foreground"
                    onClick={() => setForm((f) => ({ ...f, musica_id: null }))}
                  >
                    Trocar
                  </button>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Nome da música"
                  disabled={!!form.musica_id}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Artista</Label>
                <Input
                  value={form.artista}
                  onChange={(e) => setForm((f) => ({ ...f, artista: e.target.value }))}
                  placeholder="Ministério, artista…"
                  disabled={!!form.musica_id}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tom</Label>
                <Input
                  value={form.tom}
                  onChange={(e) => setForm((f) => ({ ...f, tom: e.target.value }))}
                  placeholder="C, G, Am…"
                  disabled={!!form.musica_id}
                />
              </div>
            </div>

            {/* Busca externa: YouTube + Deezer */}
            {!form.musica_id && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-medium text-promessa-600 hover:text-promessa-800"
                  onClick={() => setBuscaExternaOpen(o => !o)}
                >
                  <Search className="w-4 h-4" />
                  Buscar no YouTube / Deezer
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${buscaExternaOpen ? 'rotate-180' : ''}`} />
                </button>
                {buscaExternaOpen && (
                  <BuscaMusica onSelect={handleSelectExterno} />
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                Link YouTube
              </Label>
              <Input
                value={form.link_youtube}
                onChange={(e) => setForm((f) => ({ ...f, link_youtube: e.target.value }))}
                placeholder="https://youtube.com/watch?v=…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addMusicaMutation.mutate()}
              disabled={addMusicaMutation.isPending || (!form.musica_id && !form.titulo)}
            >
              {addMusicaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover música?</AlertDialogTitle>
            <AlertDialogDescription>
              A música será removida da lista deste culto. O registro no repertório não é afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMusicaMutation.mutate(deleteTarget)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
