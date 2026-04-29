import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Trash2, ExternalLink, Music2, Loader2, Youtube, ArrowLeft } from 'lucide-react';
import BuscaMusica, { SearchResultItem } from '@/components/musica/BuscaMusica';

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
}

interface Musica {
  id: string;
  titulo: string;
  artista: string | null;
  tom: string | null;
  link_youtube: string | null;
  link_deezer: string | null;
  link_spotify: string | null;
  link_cifraclub: string | null;
  capa_url: string | null;
  cifra_url: string | null;
  observacoes: string | null;
  created_at: string;
}

const TONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

const emptyForm = {
  titulo: '',
  artista: '',
  tom: '',
  link_youtube: '',
  link_deezer: '',
  capa_url: '',
  cifra_url: '',
  observacoes: '',
};

export default function Repertorio() {
  const { ministerioId } = useOutletContext<OutletCtx>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [filtroTom, setFiltroTom] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'busca' | 'form'>('busca');
  const [editTarget, setEditTarget] = useState<Musica | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // ─── church_id ────────────────────────────────────────────────────────────
  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: musicas, isLoading } = useQuery({
    queryKey: ['musicas_repertorio', ministerioId, busca, filtroTom],
    queryFn: async () => {
      let q = (supabase as any)
        .from('musicas_repertorio')
        .select('id, titulo, artista, tom, link_youtube, link_deezer, link_spotify, link_cifraclub, capa_url, cifra_url, observacoes, created_at')
        .eq('ministerio_id', ministerioId)
        .order('titulo');

      if (busca) q = q.ilike('titulo', `%${busca}%`);
      if (filtroTom) q = q.eq('tom', filtroTom);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Musica[];
    },
    enabled: !!ministerioId,
  });

  const { data: usoCounts } = useQuery({
    queryKey: ['musicas_uso_count', ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicas_culto')
        .select('musica_id')
        .eq('ministerio_id', ministerioId)
        .not('musica_id', 'is', null);
      if (error) throw error;

      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        if (row.musica_id) counts[row.musica_id] = (counts[row.musica_id] ?? 0) + 1;
      });
      return counts;
    },
    enabled: !!ministerioId,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const link_spotify = form.titulo
        ? `https://open.spotify.com/search/${encodeURIComponent(`${form.titulo} ${form.artista}`.trim())}`
        : null;
      const link_cifraclub = form.titulo
        ? `https://www.cifraclub.com.br/busca/?q=${encodeURIComponent(form.titulo)}`
        : null;

      const payload: Record<string, any> = {
        ministerio_id: ministerioId,
        titulo: form.titulo,
        artista: form.artista || null,
        tom: form.tom || null,
        link_youtube: form.link_youtube || null,
        link_deezer: form.link_deezer || null,
        link_spotify,
        link_cifraclub,
        capa_url: form.capa_url || null,
        cifra_url: form.cifra_url || null,
        observacoes: form.observacoes || null,
        created_by: user?.id,
      };

      if (editTarget) {
        const { error } = await (supabase as any)
          .from('musicas_repertorio')
          .update(payload)
          .eq('id', editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('musicas_repertorio').insert({
          ...payload,
          church_id: churchId ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas_repertorio', ministerioId] });
      toast.success(editTarget ? 'Música atualizada' : 'Música adicionada');
      closeModal();
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('musicas_repertorio').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musicas_repertorio', ministerioId] });
      toast.success('Música removida');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover'),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setStep('busca');
    setShowModal(true);
  };

  const openEdit = (m: Musica) => {
    setEditTarget(m);
    setForm({
      titulo: m.titulo,
      artista: m.artista ?? '',
      tom: m.tom ?? '',
      link_youtube: m.link_youtube ?? '',
      link_deezer: m.link_deezer ?? '',
      capa_url: m.capa_url ?? '',
      cifra_url: m.cifra_url ?? '',
      observacoes: m.observacoes ?? '',
    });
    setStep('form');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm({ ...emptyForm });
    setStep('busca');
  };

  const handleSelectMusica = (item: SearchResultItem) => {
    setForm(prev => ({
      ...prev,
      titulo: item.titulo,
      artista: item.artista,
      tom: item.tom ?? prev.tom,
      link_youtube: item.link_youtube ?? prev.link_youtube,
      link_deezer: item.link_deezer_busca ?? '',
      capa_url: item.capa_url ?? '',
      cifra_url: item.link_cifraclub ?? prev.cifra_url,
    }));
    setStep('form');
  };

  const f = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repertório</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {musicas?.length ?? 0} música{musicas?.length !== 1 ? 's' : ''} cadastrada{musicas?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Nova Música
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por título…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          value={filtroTom}
          onChange={(e) => setFiltroTom(e.target.value)}
        >
          <option value="">Todos os tons</option>
          {TONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(busca || filtroTom) && (
          <Button variant="ghost" size="sm" onClick={() => { setBusca(''); setFiltroTom(''); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-promessa-500" />
        </div>
      ) : !musicas || musicas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Music2 className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca || filtroTom ? 'Nenhuma música encontrada.' : 'O repertório está vazio.'}
          </p>
          {!busca && !filtroTom && (
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar primeira música
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-medium">Título</th>
                <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Artista</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Tom</th>
                <th className="px-4 py-2.5 text-left font-medium hidden lg:table-cell">Usos</th>
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {musicas.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => openEdit(m)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.capa_url && (
                        <img src={m.capa_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 hidden sm:block" />
                      )}
                      <div>
                        <p className="font-medium truncate max-w-xs">{m.titulo}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{m.artista ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {m.artista ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {m.tom ? (
                      <Badge variant="outline" className="font-mono">{m.tom}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {usoCounts?.[m.id] ?? 0}×
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {m.link_youtube && (
                        <a
                          href={m.link_youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      )}
                      {m.link_spotify && (
                        <a
                          href={m.link_spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-green-600 hover:bg-green-50"
                          title="Spotify"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {m.cifra_url && (
                        <a
                          href={m.cifra_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-promessa-600 hover:bg-promessa-50"
                          title="Cifra"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        className="p-1.5 rounded text-destructive hover:bg-red-50 transition-colors"
                        onClick={() => setDeleteTarget(m.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === 'form' && !editTarget && (
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => setStep('busca')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {editTarget ? 'Editar Música' : step === 'busca' ? 'Buscar Música' : 'Nova Música'}
            </DialogTitle>
          </DialogHeader>

          {step === 'busca' ? (
            <BuscaMusica
              onSelect={handleSelectMusica}
              onManual={() => setStep('form')}
            />
          ) : (
            <>
              <div className="space-y-3">
                {/* Capa preview */}
                {form.capa_url && (
                  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                    <img src={form.capa_url} alt="Capa" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{form.titulo}</p>
                      <p className="text-xs text-muted-foreground">{form.artista}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Título *</Label>
                  <Input value={form.titulo} onChange={f('titulo')} placeholder="Nome da música" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Artista</Label>
                    <Input value={form.artista} onChange={f('artista')} placeholder="Ministério, banda…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tom</Label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      value={form.tom}
                      onChange={(e) => setForm((p) => ({ ...p, tom: e.target.value }))}
                    >
                      <option value="">—</option>
                      {TONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    Link YouTube
                  </Label>
                  <Input
                    value={form.link_youtube}
                    onChange={f('link_youtube')}
                    placeholder="https://youtube.com/watch?v=…"
                  />
                </div>

                {/* Links de busca */}
                {form.titulo && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Buscar em</Label>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${form.titulo} ${form.artista}`.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Spotify
                      </a>
                      {form.link_deezer && (
                        <a
                          href={form.link_deezer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Deezer
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Link da Cifra (personalizado)</Label>
                  <Input
                    value={form.cifra_url}
                    onChange={f('cifra_url')}
                    placeholder="URL de cifra externa ou arquivo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea
                    value={form.observacoes}
                    onChange={f('observacoes')}
                    placeholder="Notas internas…"
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !form.titulo}
                >
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editTarget ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do repertório?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A música será removida do repertório mas
              permanecerá nos cultos onde foi cadastrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
