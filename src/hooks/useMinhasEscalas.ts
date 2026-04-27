import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { endOfMonth, format } from 'date-fns';

export interface EscalaCalendario {
  id: string;
  data: Date;
  titulo_evento: string;
  tipo_evento: string | null;
  ministerio_nome: string;
  ministerio_slug: string;
  funcao: string;
  status: string;
  tem_evento_vinculado: boolean;
}

export function useMinhasEscalas(mes: number, ano: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['minhas_escalas_calendario', profile?.id, mes, ano],
    queryFn: async () => {
      const inicio = format(new Date(ano, mes - 1, 1), 'yyyy-MM-dd');
      const fim = format(endOfMonth(new Date(ano, mes - 1, 1)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('escalas')
        .select('id, data, funcao, status, ministerios(nome, slug), eventos_escala(titulo, tipo, data_evento)')
        .eq('voluntario_id', profile!.id)
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((e: any): EscalaCalendario => ({
        id: e.id,
        data: new Date(e.data + 'T12:00:00'),
        titulo_evento: e.eventos_escala?.titulo ?? e.funcao,
        tipo_evento: e.eventos_escala?.tipo ?? null,
        ministerio_nome: e.ministerios?.nome ?? 'Ministério',
        ministerio_slug: e.ministerios?.slug ?? '',
        funcao: e.funcao,
        status: e.status,
        tem_evento_vinculado: !!e.eventos_escala,
      }));
    },
    enabled: !!profile?.id,
  });
}

export function useProximasEscalas(dias = 30) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['proximas_escalas', profile?.id, dias],
    queryFn: async () => {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const limite = format(
        new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );

      const { data, error } = await supabase
        .from('escalas')
        .select('id, data, funcao, status, ministerios(nome, slug), eventos_escala(titulo, tipo)')
        .eq('voluntario_id', profile!.id)
        .gte('data', hoje)
        .lte('data', limite)
        .order('data', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((e: any): EscalaCalendario => ({
        id: e.id,
        data: new Date(e.data + 'T12:00:00'),
        titulo_evento: e.eventos_escala?.titulo ?? e.funcao,
        tipo_evento: e.eventos_escala?.tipo ?? null,
        ministerio_nome: e.ministerios?.nome ?? 'Ministério',
        ministerio_slug: e.ministerios?.slug ?? '',
        funcao: e.funcao,
        status: e.status,
        tem_evento_vinculado: !!e.eventos_escala,
      }));
    },
    enabled: !!profile?.id,
  });
}
