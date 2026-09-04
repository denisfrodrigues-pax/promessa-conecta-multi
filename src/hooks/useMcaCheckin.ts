import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface McaSala { id: string; nome: string }
export interface McaCrianca { id: string; nome: string; sala_id: string | null; foto_url: string | null }
export interface McaCheckinRow {
  id: string;
  crianca_id: string | null;
  sala_id: string;
  checkin_at: string;
  checkout_at: string | null;
  observacao: string | null;
  mca_criancas: { nome: string } | null;
  mca_salas: { nome: string } | null;
}

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Início/fim do dia LOCAL (fuso do navegador), convertidos pra UTC — pra filtrar
 * mca_checkins.checkin_at (timestamptz, gravado em UTC) sem comparar direto uma
 * string de data local contra timestamp UTC. Sem isso, check-ins feitos à noite
 * em fusos atrás de UTC (ex: Brasília, entre ~21h e 23h59) caem no dia seguinte em
 * UTC e somem da visão "hoje" — bug real, reproduzido via SQL: um checkin_at
 * registrado como 2026-09-04T01:18 UTC (= 2026-09-03T22:18 em Brasília) ficava fora
 * do range gte/lte '2026-09-03T00:00:00'..'2026-09-03T23:59:59' interpretado em UTC.
 * `new Date(y, m, d, h, mi, s, ms)` resolve o horário de parede pro instante UTC
 * correto usando o fuso do runtime (navegador), então isso já cobre qualquer fuso,
 * incluindo troca de horário de verão.
 */
function localDayBoundsISO(dateStr: string): { startISO: string; endISO: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

// Visitante = check-in sem crianca_id (mca_checkins não tem coluna própria para isso).
// O nome do visitante fica registrado em observacao ("Visitante: Nome — Responsável: X").
export function isVisitanteCheckin(ci: McaCheckinRow): boolean {
  return !ci.crianca_id;
}

export function checkinNome(ci: McaCheckinRow): string {
  if (!isVisitanteCheckin(ci)) return ci.mca_criancas?.nome ?? '–';
  const nome = ci.observacao?.match(/^Visitante:\s*(.+?)\s*—/)?.[1];
  return nome || 'Visitante';
}

interface CheckinParams {
  salaId: string;
  criancaId?: string;
  visitante?: { nome: string; responsavel: string };
}

/**
 * Dados e mutações do Check-in Kids (mca_checkins/mca_criancas/mca_salas) — compartilhado
 * entre a tela normal (leader/mca/Checkin.tsx) e o modo quiosque (CheckinKiosk.tsx), pra não
 * duplicar as queries/mutações já testadas nas duas variantes de apresentação.
 */
export function useMcaCheckin(ministerioId: string, selectedDate: string) {
  const { user, churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const qc = useQueryClient();
  const [realtime, setRealtime] = useState(true);

  const isToday = selectedDate === todayStr();

  const { data: salas = [] } = useQuery({
    queryKey: ['mca_salas', ministerioId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_salas').select('id, nome').eq('ministerio_id', ministerioId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as McaSala[];
    },
    enabled: !!ministerioId,
  });

  const { data: criancas = [] } = useQuery({
    queryKey: ['mca_criancas', churchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_criancas').select('id, nome, sala_id, foto_url').eq('church_id', churchId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as McaCrianca[];
    },
    enabled: !!churchId,
  });

  const { data: checkins = [], isLoading } = useQuery({
    queryKey: ['mca_checkins_dia', churchId, selectedDate],
    queryFn: async () => {
      const { startISO, endISO } = localDayBoundsISO(selectedDate);
      const { data, error } = await (supabase as any)
        .from('mca_checkins')
        .select('*, mca_criancas(nome), mca_salas(nome)')
        .eq('church_id', churchId)
        .gte('checkin_at', startISO)
        .lte('checkin_at', endISO)
        .order('checkin_at', { ascending: false });
      if (error) throw error;
      return data as McaCheckinRow[];
    },
    enabled: !!churchId,
  });

  useEffect(() => {
    if (!churchId || !isToday) return;
    const channel = supabase
      .channel('mca_checkins_realtime')
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'mca_checkins',
        filter: `church_id=eq.${churchId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      })
      .subscribe((status: string) => {
        setRealtime(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [churchId, isToday, selectedDate, qc]);

  const checkinMutation = useMutation({
    mutationFn: async ({ salaId, criancaId, visitante }: CheckinParams) => {
      if (!salaId) throw new Error('Selecione a sala');
      if (visitante) {
        if (!visitante.nome.trim()) throw new Error('Nome da criança é obrigatório');
        if (!visitante.responsavel.trim()) throw new Error('Nome do responsável é obrigatório');
      } else if (!criancaId) {
        throw new Error('Selecione a criança');
      }
      const checkinAt = isToday
        ? new Date().toISOString()
        : `${selectedDate}T12:00:00.000Z`;

      const payload: Record<string, any> = {
        sala_id: salaId,
        church_id: churchId,
        registrado_por: user?.id,
        checkin_at: checkinAt,
        crianca_id: visitante ? null : criancaId,
      };
      if (visitante) {
        payload.observacao = `Visitante: ${visitante.nome.trim()} — Responsável: ${visitante.responsavel.trim()}`;
      }

      const { error } = await (supabase as any).from('mca_checkins').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      toast.success('Check-in realizado!');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar check-in'),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const checkoutAt = isToday
        ? new Date().toISOString()
        : `${selectedDate}T13:00:00.000Z`;
      const { error } = await (supabase as any)
        .from('mca_checkins').update({ checkout_at: checkoutAt }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mca_checkins_dia', churchId, selectedDate] });
      toast.success('Checkout registrado');
    },
    onError: () => toast.error('Erro ao registrar checkout'),
  });

  const presentes = checkins.filter(c => !c.checkout_at);
  const saidas = checkins.filter(c => c.checkout_at);

  const porSala: Record<string, McaCheckinRow[]> = {};
  presentes.forEach(c => {
    if (!porSala[c.sala_id]) porSala[c.sala_id] = [];
    porSala[c.sala_id].push(c);
  });

  const criancasPresentes = new Set(presentes.filter(c => c.crianca_id).map(c => c.crianca_id!));
  const criancasDisponiveis = criancas.filter(c => !criancasPresentes.has(c.id));

  return {
    churchId,
    isToday,
    realtime,
    salas,
    criancas,
    criancasDisponiveis,
    checkins,
    isLoading,
    presentes,
    saidas,
    porSala,
    checkinMutation,
    checkoutMutation,
    invalidateCriancas: () => qc.invalidateQueries({ queryKey: ['mca_criancas', churchId] }),
  };
}
