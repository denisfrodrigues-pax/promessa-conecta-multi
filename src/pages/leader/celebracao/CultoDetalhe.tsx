import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  FileDown, Loader2, Clock, Megaphone, ListOrdered,
  Users, Music2, Image, ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CardCulto from '@/components/celebracao/CardCulto';

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
  ministerioTipo?: string | null;
}

type TipoItem =
  | 'abertura' | 'louvor' | 'oracao' | 'palavra'
  | 'aviso' | 'oferta' | 'encerramento' | 'outro';

type OrigemItem = 'musica' | 'equipe' | 'manual';

interface LiturgiaItem {
  id: string;
  ordem: number;
  tipo: TipoItem;
  titulo: string;
  responsavel: string | null;
  duracao_minutos: number | null;
  observacao: string | null;
  origem: OrigemItem;
}

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
}

interface AvisoCulto {
  id: string;
  aviso_id: string;
  ordem: number;
  avisos: Aviso | null;
}

interface EventoInfo {
  id: string;
  titulo: string;
  data_evento: string;
  horario_inicio: string | null;
}

interface LiturgiaCulto {
  id: string;
  observacoes_gerais: string | null;
}

interface EquipeMembro {
  id: string;
  funcao: string;
  status: string;
  voluntario_nome: string;
  ministerio_id: string;
  ministerio_nome: string;
  ministerio_tipo: string | null;
}

interface MusicaCulto {
  id: string;
  ordem: number;
  link_youtube: string | null;
  titulo_avulso: string | null;
  artista_avulso: string | null;
  musicas_repertorio: {
    titulo: string;
    artista: string;
    tom: string | null;
    link_youtube: string | null;
  } | null;
}

interface ConfigInstituicao {
  logo_url: string | null;
  nome_igreja: string | null;
}

const TIPOS: { value: TipoItem; label: string; color: string }[] = [
  { value: 'abertura',     label: 'Abertura',     color: 'bg-blue-100 text-blue-700' },
  { value: 'louvor',       label: 'Louvor',       color: 'bg-purple-100 text-purple-700' },
  { value: 'oracao',       label: 'Oração',       color: 'bg-yellow-100 text-yellow-700' },
  { value: 'palavra',      label: 'Palavra',      color: 'bg-green-100 text-green-700' },
  { value: 'aviso',        label: 'Aviso',        color: 'bg-orange-100 text-orange-700' },
  { value: 'oferta',       label: 'Oferta',       color: 'bg-emerald-100 text-emerald-700' },
  { value: 'encerramento', label: 'Encerramento', color: 'bg-pink-100 text-pink-700' },
  { value: 'outro',        label: 'Outro',        color: 'bg-gray-100 text-gray-700' },
];

const tipoLabel = (tipo: string) => TIPOS.find((t) => t.value === tipo)?.label ?? tipo;
const tipoColor = (tipo: string) => TIPOS.find((t) => t.value === tipo)?.color ?? 'bg-gray-100 text-gray-700';

const STATUS_ICON: Record<string, string> = {
  confirmado: '✅',
  pendente: '⏳',
};
const statusIcon = (s: string) => STATUS_ICON[s] ?? '❌';
const statusLabel: Record<string, string> = {
  confirmado: 'Confirmado', pendente: 'Pendente',
};

const emptyItemForm = {
  tipo: 'louvor' as TipoItem,
  titulo: '',
  responsavel: '',
  duracao_minutos: '',
  observacao: '',
};

const emptyAvisoForm = { titulo: '', conteudo: '' };

export default function CultoDetalhe() {
  const { ministerioId, ministerioNome } = useOutletContext<OutletCtx>();
  const { slug, eventoId } = useParams<{ slug: string; eventoId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<LiturgiaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ ...emptyItemForm });
  const [obsGerais, setObsGerais] = useState('');
  const [showNovoAviso, setShowNovoAviso] = useState(false);
  const [novoAvisoForm, setNovoAvisoForm] = useState({ ...emptyAvisoForm });
  const [exportingImg, setExportingImg] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: evento } = useQuery({
    queryKey: ['evento_detalhe_cel', eventoId],
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

  const { data: config } = useQuery({
    queryKey: ['config_instituicao'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes_instituicao')
        .select('logo_url, nome_igreja')
        .limit(1)
        .maybeSingle();
      return (data as ConfigInstituicao | null);
    },
    staleTime: Infinity,
  });

  const { data: liturgia, isLoading: loadingLiturgia } = useQuery({
    queryKey: ['liturgia_culto', eventoId, ministerioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('liturgia_culto')
        .select('id, observacoes_gerais')
        .eq('evento_id', eventoId!)
        .eq('ministerio_id', ministerioId)
        .maybeSingle();
      return data as LiturgiaCulto | null;
    },
    enabled: !!eventoId && !!ministerioId,
  });

  useEffect(() => {
    if (liturgia) setObsGerais(liturgia.observacoes_gerais ?? '');
  }, [liturgia]);

  const { data: itens, isLoading: loadingItens } = useQuery({
    queryKey: ['liturgia_itens', liturgia?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liturgia_itens')
        .select('id, ordem, tipo, titulo, responsavel, duracao_minutos, observacao, origem')
        .eq('liturgia_id', liturgia!.id)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as LiturgiaItem[];
    },
    enabled: !!liturgia?.id,
  });

  const { data: equipeDia, isLoading: loadingEquipe } = useQuery({
    queryKey: ['equipe_dia', eventoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('escalas')
        .select(`
          id, funcao, status,
          profiles!escalas_voluntario_id_fkey(id, nome),
          ministerios!escalas_ministerio_id_fkey(id, nome, tipo)
        `)
        .eq('evento_escala_id', eventoId!)
        .neq('status', 'recusado');
      if (error) throw error;
      return ((data ?? []) as any[]).map((r: any): EquipeMembro => ({
        id: r.id,
        funcao: r.funcao,
        status: r.status,
        voluntario_nome: r.profiles?.nome ?? 'Desconhecido',
        ministerio_id: r.ministerios?.id ?? '',
        ministerio_nome: r.ministerios?.nome ?? 'Ministério',
        ministerio_tipo: r.ministerios?.tipo ?? null,
      }));
    },
    enabled: !!eventoId,
  });

  const { data: musicasCulto, isLoading: loadingMusicas } = useQuery({
    queryKey: ['musicas_culto_evento', eventoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('musicas_culto')
        .select(`
          id, ordem, link_youtube, titulo_avulso, artista_avulso,
          musicas_repertorio!musicas_culto_musica_id_fkey(titulo, artista, tom, link_youtube)
        `)
        .eq('evento_id', eventoId!)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as MusicaCulto[];
    },
    enabled: !!eventoId,
  });

  const { data: todosAvisos } = useQuery({
    queryKey: ['avisos_lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos')
        .select('id, titulo, conteudo')
        .order('titulo');
      if (error) throw error;
      return (data ?? []) as Aviso[];
    },
  });

  const { data: avisosCulto } = useQuery({
    queryKey: ['avisos_culto', eventoId, ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avisos_culto')
        .select('id, aviso_id, ordem, avisos(id, titulo, conteudo)')
        .eq('evento_id', eventoId!)
        .eq('ministerio_id', ministerioId)
        .order('ordem');
      if (error) throw error;
      return (data ?? []) as unknown as AvisoCulto[];
    },
    enabled: !!eventoId && !!ministerioId,
  });

  // Realtime subscription for equipe_dia
  useEffect(() => {
    if (!eventoId) return;
    const channel = supabase
      .channel(`escalas_evento_${eventoId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'escalas',
        filter: `evento_escala_id=eq.${eventoId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['equipe_dia', eventoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventoId, queryClient]);

  // ─── Derived data ─────────────────────────────────────────────────────────
  const selectedAvisoIds = new Set((avisosCulto ?? []).map((a) => a.aviso_id));

  const equipePorMinisterio = useMemo(() => {
    const map = new Map<string, { nome: string; tipo: string | null; membros: EquipeMembro[] }>();
    for (const m of equipeDia ?? []) {
      if (!map.has(m.ministerio_id)) {
        map.set(m.ministerio_id, { nome: m.ministerio_nome, tipo: m.ministerio_tipo, membros: [] });
      }
      map.get(m.ministerio_id)!.membros.push(m);
    }
    return Array.from(map.values());
  }, [equipeDia]);

  const totalDuracao = (itens ?? []).reduce((acc, it) => acc + (it.duracao_minutos ?? 0), 0);

  // ─── Ensure liturgia record exists ────────────────────────────────────────
  const ensureLiturgia = async () => {
    if (liturgia) return liturgia.id;
    const { data, error } = await supabase
      .from('liturgia_culto')
      .insert({
        evento_id: eventoId!, ministerio_id: ministerioId,
        observacoes_gerais: null, created_by: user?.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['liturgia_culto', eventoId, ministerioId] });
    return data.id;
  };

  // ─── Mutations ────────────────────────────────────────────────────────────
  const saveItemMutation = useMutation({
    mutationFn: async () => {
      const liturgiaId = await ensureLiturgia();
      const payload = {
        liturgia_id: liturgiaId,
        tipo: itemForm.tipo,
        titulo: itemForm.titulo,
        responsavel: itemForm.responsavel || null,
        duracao_minutos: itemForm.duracao_minutos ? parseInt(itemForm.duracao_minutos) : null,
        observacao: itemForm.observacao || null,
        ordem: editItem ? editItem.ordem : (itens?.length ?? 0) + 1,
      };
      if (editItem) {
        const { error } = await supabase.from('liturgia_itens').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('liturgia_itens').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liturgia_itens', liturgia?.id] });
      queryClient.invalidateQueries({ queryKey: ['liturgia_culto', eventoId, ministerioId] });
      toast.success(editItem ? 'Item atualizado' : 'Item adicionado');
      closeItemModal();
    },
    onError: () => toast.error('Erro ao salvar item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('liturgia_itens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liturgia_itens', liturgia?.id] });
      toast.success('Item removido');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao remover item'),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      await Promise.all(items.map(({ id, ordem }) =>
        supabase.from('liturgia_itens').update({ ordem }).eq('id', id)
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liturgia_itens', liturgia?.id] }),
    onError: () => toast.error('Erro ao reordenar'),
  });

  const saveObsMutation = useMutation({
    mutationFn: async () => {
      const liturgiaId = await ensureLiturgia();
      const { error } = await supabase
        .from('liturgia_culto')
        .update({ observacoes_gerais: obsGerais || null })
        .eq('id', liturgiaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liturgia_culto', eventoId, ministerioId] });
      toast.success('Observações salvas');
    },
    onError: () => toast.error('Erro ao salvar observações'),
  });

  const prepopularMutation = useMutation({
    mutationFn: async () => {
      const liturgiaId = await ensureLiturgia();
      const itemsToInsert: any[] = [];
      let ordem = (itens?.length ?? 0) + 1;

      // Itens de música: um louvor para cada música confirmada
      if (musicasCulto && musicasCulto.length > 0) {
        for (const mc of musicasCulto) {
          const titulo = mc.musicas_repertorio?.titulo ?? mc.titulo_avulso ?? 'Música';
          const artista = mc.musicas_repertorio?.artista ?? mc.artista_avulso ?? null;
          itemsToInsert.push({
            liturgia_id: liturgiaId,
            tipo: 'louvor',
            titulo,
            responsavel: artista,
            duracao_minutos: null,
            observacao: null,
            ordem: ordem++,
            origem: 'musica',
          });
        }
      }

      // Sugestões de equipe por tipo de ministério
      const tiposPresentes = new Set(
        (equipeDia ?? [])
          .filter(m => m.status === 'confirmado')
          .map(m => m.ministerio_tipo)
      );
      if (tiposPresentes.has('recepcao')) {
        itemsToInsert.push({
          liturgia_id: liturgiaId,
          tipo: 'abertura',
          titulo: 'Recepção dos presentes',
          responsavel: 'Equipe de Recepção',
          duracao_minutos: 5,
          observacao: null,
          ordem: ordem++,
          origem: 'equipe',
        });
      }
      if (tiposPresentes.has('mca')) {
        itemsToInsert.push({
          liturgia_id: liturgiaId,
          tipo: 'outro',
          titulo: 'Ministério Kids',
          responsavel: 'Equipe MCA',
          duracao_minutos: null,
          observacao: null,
          ordem: ordem++,
          origem: 'equipe',
        });
      }

      if (itemsToInsert.length === 0) {
        throw new Error('Nenhuma música ou equipe confirmada encontrada para pré-popular.');
      }

      const { error } = await supabase.from('liturgia_itens').insert(itemsToInsert);
      if (error) throw error;
      return itemsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['liturgia_itens', liturgia?.id] });
      queryClient.invalidateQueries({ queryKey: ['liturgia_culto', eventoId, ministerioId] });
      toast.success(`${count} item(s) adicionados à liturgia`);
    },
    onError: (e: Error) => toast.error('Erro ao pré-popular', { description: e.message }),
  });

  const toggleAvisoMutation = useMutation({
    mutationFn: async ({ avisoId, selected }: { avisoId: string; selected: boolean }) => {
      if (selected) {
        const { error } = await supabase.from('avisos_culto').insert({
          evento_id: eventoId!, aviso_id: avisoId,
          ministerio_id: ministerioId, ordem: (avisosCulto?.length ?? 0) + 1,
          created_by: user?.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('avisos_culto').delete()
          .eq('evento_id', eventoId!).eq('aviso_id', avisoId).eq('ministerio_id', ministerioId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avisos_culto', eventoId, ministerioId] }),
    onError: () => toast.error('Erro ao atualizar aviso'),
  });

  const reorderAvisosMutation = useMutation({
    mutationFn: async (items: { id: string; ordem: number }[]) => {
      await Promise.all(items.map(({ id, ordem }) =>
        supabase.from('avisos_culto').update({ ordem }).eq('id', id)
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avisos_culto', eventoId, ministerioId] }),
  });

  const criarAvisoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('avisos')
        .insert({
          titulo: novoAvisoForm.titulo,
          conteudo: novoAvisoForm.conteudo,
          created_by: user?.id,
        })
        .select('id')
        .single();
      if (error) throw error;
      // Automatically add to this culto
      const { error: acError } = await supabase.from('avisos_culto').insert({
        evento_id: eventoId!, aviso_id: data.id,
        ministerio_id: ministerioId, ordem: (avisosCulto?.length ?? 0) + 1,
        created_by: user?.id,
      });
      if (acError) throw acError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos_lista'] });
      queryClient.invalidateQueries({ queryKey: ['avisos_culto', eventoId, ministerioId] });
      toast.success('Aviso criado e adicionado ao culto');
      setShowNovoAviso(false);
      setNovoAvisoForm({ ...emptyAvisoForm });
    },
    onError: (e: Error) => toast.error('Erro ao criar aviso', { description: e.message }),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const closeItemModal = () => {
    setShowItemModal(false);
    setEditItem(null);
    setItemForm({ ...emptyItemForm });
  };

  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ ...emptyItemForm });
    setShowItemModal(true);
  };

  const openEditItem = (item: LiturgiaItem) => {
    setEditItem(item);
    setItemForm({
      tipo: item.tipo, titulo: item.titulo,
      responsavel: item.responsavel ?? '',
      duracao_minutos: item.duracao_minutos?.toString() ?? '',
      observacao: item.observacao ?? '',
    });
    setShowItemModal(true);
  };

  const moverItem = (index: number, direcao: 'up' | 'down') => {
    if (!itens) return;
    const lista = [...itens];
    const swapIdx = direcao === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lista.length) return;
    [lista[index], lista[swapIdx]] = [lista[swapIdx], lista[index]];
    reorderMutation.mutate(lista.map((it, i) => ({ id: it.id, ordem: i + 1 })));
  };

  const moverAviso = (index: number, direcao: 'up' | 'down') => {
    if (!avisosCulto) return;
    const lista = [...avisosCulto];
    const swapIdx = direcao === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lista.length) return;
    [lista[index], lista[swapIdx]] = [lista[swapIdx], lista[index]];
    reorderAvisosMutation.mutate(lista.map((a, i) => ({ id: a.id, ordem: i + 1 })));
  };

  const exportarPDF = () => {
    if (!evento) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(evento.titulo, W / 2, y, { align: 'center' });
    y += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const dataStr = format(parseISO(evento.data_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    pdf.text(dataStr + (evento.horario_inicio ? ` · ${evento.horario_inicio.slice(0, 5)}` : ''), W / 2, y, { align: 'center' });
    y += 5;

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text(`Ministério: ${ministerioNome}`, W / 2, y, { align: 'center' });
    y += 8;

    pdf.setDrawColor(180, 180, 180);
    pdf.line(14, y, W - 14, y);
    y += 6;

    // Liturgia
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Ordem de Liturgia', 14, y);
    y += 7;

    (itens ?? []).forEach((item, idx) => {
      if (y > 265) { pdf.addPage(); y = 20; }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(`${idx + 1}. ${item.titulo}`, 14, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const meta: string[] = [`Tipo: ${tipoLabel(item.tipo)}`];
      if (item.responsavel) meta.push(`Responsável: ${item.responsavel}`);
      if (item.duracao_minutos) meta.push(`Duração: ${item.duracao_minutos} min`);
      pdf.setTextColor(100, 100, 100);
      pdf.text(meta.join('   ·   '), 18, y);
      pdf.setTextColor(0, 0, 0);
      y += 4;
      if (item.observacao) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(item.observacao, 18, y);
        pdf.setTextColor(0, 0, 0);
        y += 4;
      }
      y += 2;
    });

    // Músicas
    if ((musicasCulto ?? []).length > 0) {
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(180, 180, 180);
      pdf.line(14, y, W - 14, y);
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Músicas do Culto', 14, y);
      y += 7;
      (musicasCulto ?? []).forEach((mc, idx) => {
        if (y > 265) { pdf.addPage(); y = 20; }
        const titulo = mc.musicas_repertorio?.titulo ?? mc.titulo_avulso ?? '—';
        const artista = mc.musicas_repertorio?.artista ?? mc.artista_avulso ?? '';
        const tom = mc.musicas_repertorio?.tom ?? '';
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`${idx + 1}. ${titulo}`, 14, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text([artista, tom ? `Tom: ${tom}` : ''].filter(Boolean).join('   ·   '), 18, y);
        pdf.setTextColor(0, 0, 0);
        y += 6;
      });
    }

    // Equipe
    if (equipePorMinisterio.length > 0) {
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(180, 180, 180);
      pdf.line(14, y, W - 14, y);
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Equipe do Dia', 14, y);
      y += 7;
      equipePorMinisterio.forEach((grupo) => {
        if (y > 265) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 80, 120);
        pdf.text(grupo.nome, 14, y);
        pdf.setTextColor(0, 0, 0);
        y += 5;
        grupo.membros.forEach((m) => {
          if (y > 265) { pdf.addPage(); y = 20; }
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text(`• ${m.voluntario_nome} — ${m.funcao} (${statusLabel[m.status] ?? m.status})`, 18, y);
          y += 4;
        });
        y += 2;
      });
    }

    // Avisos
    const selecionados = (avisosCulto ?? []).filter((a) => a.avisos);
    if (selecionados.length > 0) {
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(180, 180, 180);
      pdf.line(14, y, W - 14, y);
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Avisos do Culto', 14, y);
      y += 7;
      selecionados.forEach((ac, idx) => {
        if (y > 265) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`${idx + 1}. ${ac.avisos!.titulo}`, 14, y);
        y += 5;
        const linhas = pdf.splitTextToSize(ac.avisos!.conteudo, W - 28);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(linhas, 18, y);
        pdf.setTextColor(0, 0, 0);
        y += linhas.length * 4 + 4;
      });
    }

    if (liturgia?.observacoes_gerais) {
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(180, 180, 180);
      pdf.line(14, y, W - 14, y);
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Observações gerais', 14, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const linhas = pdf.splitTextToSize(liturgia.observacoes_gerais, W - 28);
      pdf.text(linhas, 14, y);
    }

    const nomeArquivo = `liturgia_${format(parseISO(evento.data_evento), 'yyyy-MM-dd')}.pdf`;
    pdf.save(nomeArquivo);
  };

  const exportarImagem = async () => {
    if (!cardRef.current || !evento) return;
    setExportingImg(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 1080,
        height: 1920,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `culto-${format(parseISO(evento.data_evento), 'yyyy-MM-dd')}-${evento.titulo.toLowerCase().replace(/\s+/g, '-')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch {
      toast.error('Erro ao gerar imagem');
    } finally {
      setExportingImg(false);
    }
  };

  // ─── Derived card data ────────────────────────────────────────────────────
  const cardMusicas = (musicasCulto ?? []).map(mc => ({
    ordem: mc.ordem,
    titulo: mc.musicas_repertorio?.titulo ?? mc.titulo_avulso ?? 'Sem título',
    artista: mc.musicas_repertorio?.artista ?? mc.artista_avulso ?? '',
    tom: mc.musicas_repertorio?.tom ?? null,
  }));

  const cardEquipe = equipePorMinisterio.map(g => ({
    nome: g.nome,
    membros: g.membros.map(m => ({
      nome: m.voluntario_nome,
      funcao: m.funcao,
      status: m.status,
    })),
  }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/leader/${slug}/cultos`)}>
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

        {/* Export buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportarImagem} disabled={exportingImg}>
            {exportingImg
              ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              : <Image className="w-4 h-4 mr-1" />}
            Exportar Imagem
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF} disabled={!itens?.length}>
            <FileDown className="w-4 h-4 mr-1" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* ── Equipe do Dia ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Equipe do Dia
            <Badge variant="outline" className="text-xs font-normal">Tempo real</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEquipe ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-promessa-500" />
            </div>
          ) : equipePorMinisterio.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum voluntário escalado para este evento ainda.
            </p>
          ) : (
            <div className="space-y-5">
              {equipePorMinisterio.map((grupo) => (
                <div key={grupo.nome}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {grupo.nome}
                  </p>
                  <div className="space-y-1.5">
                    {grupo.membros.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 text-sm">
                        <span className="text-base leading-none">{statusIcon(m.status)}</span>
                        <span className="font-medium flex-1">{m.voluntario_nome}</span>
                        <span className="text-muted-foreground">{m.funcao}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${m.status === 'confirmado' ? 'border-green-300 text-green-700 bg-green-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'}`}
                        >
                          {statusLabel[m.status] ?? m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Legenda: ✅ Confirmado · ⏳ Pendente · ❌ Não confirmado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Músicas do Culto (somente leitura) ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Music2 className="w-4 h-4" />
              Músicas do Culto
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              Definidas pelo Ministério de Música
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMusicas ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-promessa-500" />
            </div>
          ) : !musicasCulto || musicasCulto.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma música definida pelo ministério de música para este evento.
            </p>
          ) : (
            <div className="space-y-2">
              {musicasCulto.map((mc, idx) => {
                const titulo = mc.musicas_repertorio?.titulo ?? mc.titulo_avulso ?? '—';
                const artista = mc.musicas_repertorio?.artista ?? mc.artista_avulso ?? '';
                const tom = mc.musicas_repertorio?.tom ?? null;
                const youtube = mc.link_youtube ?? mc.musicas_repertorio?.link_youtube ?? null;
                return (
                  <div key={mc.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                    <span className="text-sm font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{titulo}</p>
                      <p className="text-xs text-muted-foreground">{artista}</p>
                    </div>
                    {tom && (
                      <Badge variant="outline" className="text-xs shrink-0">{tom}</Badge>
                    )}
                    {youtube && (
                      <a
                        href={youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-600 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ordem de Liturgia ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListOrdered className="w-4 h-4" />
              Ordem de Liturgia
            </CardTitle>
            {totalDuracao > 0 && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Total estimado: {totalDuracao} min
              </p>
            )}
          </div>
          <Button size="sm" onClick={openAddItem}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {loadingItens || loadingLiturgia ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-promessa-500" />
            </div>
          ) : !itens || itens.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum item na liturgia ainda.</p>
              {(musicasCulto?.length ?? 0) > 0 || (equipeDia?.length ?? 0) > 0 ? (
                <Button
                  size="sm" variant="outline"
                  onClick={() => prepopularMutation.mutate()}
                  disabled={prepopularMutation.isPending}
                >
                  {prepopularMutation.isPending
                    ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    : <ListOrdered className="w-4 h-4 mr-1" />}
                  Pré-popular com músicas e equipe
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {itens.length > 0 && (musicasCulto?.length ?? 0) > 0 && (
                <div className="flex justify-end mb-1">
                  <Button
                    size="sm" variant="ghost" className="text-xs text-muted-foreground h-7"
                    onClick={() => prepopularMutation.mutate()}
                    disabled={prepopularMutation.isPending}
                  >
                    {prepopularMutation.isPending
                      ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      : <Plus className="w-3 h-3 mr-1" />}
                    Adicionar sugestões
                  </Button>
                </div>
              )}
              {itens.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => openEditItem(item)}
                >
                  <span className="text-sm font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor(item.tipo)}`}>
                        {tipoLabel(item.tipo)}
                      </span>
                      {item.origem === 'musica' && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          Música
                        </span>
                      )}
                      {item.origem === 'equipe' && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          Equipe
                        </span>
                      )}
                      <p className="font-medium text-sm truncate">{item.titulo}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {item.responsavel && <span>{item.responsavel}</span>}
                      {item.duracao_minutos && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.duracao_minutos} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => moverItem(idx, 'up')}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === itens.length - 1} onClick={() => moverItem(idx, 'down')}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item.id)}
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

      {/* ── Avisos do Culto ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="w-4 h-4" />
              Avisos do Culto
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowNovoAviso(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Novo Aviso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {avisosCulto && avisosCulto.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Selecionados — na ordem do culto
              </p>
              {avisosCulto.map((ac, idx) => (
                <div key={ac.id} className="flex items-center gap-2 p-2 rounded-lg bg-promessa-50 border border-promessa-200">
                  <span className="text-xs font-mono text-muted-foreground w-4">{idx + 1}</span>
                  <p className="flex-1 text-sm font-medium">{ac.avisos?.titulo ?? '—'}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moverAviso(idx, 'up')}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === avisosCulto.length - 1} onClick={() => moverAviso(idx, 'down')}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {todosAvisos && todosAvisos.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Todos os avisos disponíveis
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto border rounded-md p-3">
                {todosAvisos.map((av) => (
                  <div key={av.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`av-${av.id}`}
                      checked={selectedAvisoIds.has(av.id)}
                      onCheckedChange={(checked) =>
                        toggleAvisoMutation.mutate({ avisoId: av.id, selected: !!checked })
                      }
                      disabled={toggleAvisoMutation.isPending}
                    />
                    <label htmlFor={`av-${av.id}`} className="flex-1 cursor-pointer">
                      <p className="text-sm font-medium leading-tight">{av.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{av.conteudo}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum aviso cadastrado. Use "Novo Aviso" para criar.</p>
          )}
        </CardContent>
      </Card>

      {/* Observações gerais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={obsGerais}
            onChange={(e) => setObsGerais(e.target.value)}
            placeholder="Anotações para o culto…"
            rows={3}
          />
          <Button size="sm" onClick={() => saveObsMutation.mutate()} disabled={saveObsMutation.isPending}>
            {saveObsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* ── Modal Adicionar/Editar Item ────────────────────────────────────── */}
      <Dialog open={showItemModal} onOpenChange={(open) => { if (!open) closeItemModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Item' : 'Adicionar Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={itemForm.tipo}
                onChange={(e) => setItemForm((p) => ({ ...p, tipo: e.target.value as TipoItem }))}
              >
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                value={itemForm.titulo}
                onChange={(e) => setItemForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Louvor de abertura, Oração pelos enfermos…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Input
                  value={itemForm.responsavel}
                  onChange={(e) => setItemForm((p) => ({ ...p, responsavel: e.target.value }))}
                  placeholder="Nome ou função"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number" min="1"
                  value={itemForm.duracao_minutos}
                  onChange={(e) => setItemForm((p) => ({ ...p, duracao_minutos: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea
                value={itemForm.observacao}
                onChange={(e) => setItemForm((p) => ({ ...p, observacao: e.target.value }))}
                placeholder="Notas internas…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeItemModal}>Cancelar</Button>
            <Button
              onClick={() => saveItemMutation.mutate()}
              disabled={saveItemMutation.isPending || !itemForm.titulo}
            >
              {saveItemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Novo Aviso ───────────────────────────────────────────────── */}
      <Dialog open={showNovoAviso} onOpenChange={(open) => {
        if (!open) { setShowNovoAviso(false); setNovoAvisoForm({ ...emptyAvisoForm }); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                value={novoAvisoForm.titulo}
                onChange={(e) => setNovoAvisoForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Título do aviso"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo *</Label>
              <Textarea
                value={novoAvisoForm.conteudo}
                onChange={(e) => setNovoAvisoForm((p) => ({ ...p, conteudo: e.target.value }))}
                placeholder="Descreva o aviso…"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNovoAviso(false);
              setNovoAvisoForm({ ...emptyAvisoForm });
            }}>
              Cancelar
            </Button>
            <Button
              onClick={() => criarAvisoMutation.mutate()}
              disabled={criarAvisoMutation.isPending || !novoAvisoForm.titulo || !novoAvisoForm.conteudo}
            >
              {criarAvisoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar e Adicionar ao Culto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Este item será removido permanentemente da liturgia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteItemMutation.mutate(deleteTarget)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── CardCulto off-screen para exportação de imagem ─────────────────── */}
      {evento && (
        <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, pointerEvents: 'none' }}>
          <CardCulto
            ref={cardRef}
            formato="stories"
            evento={evento}
            itens={itens ?? []}
            musicas={cardMusicas}
            equipe={cardEquipe}
            logoUrl={config?.logo_url}
            nomeIgreja={config?.nome_igreja}
          />
        </div>
      )}
    </div>
  );
}
