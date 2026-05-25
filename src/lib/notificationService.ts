import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreateNotificationParams {
  voluntario_id: string;
  escala_id: string;
  tipo: 'nova_escala' | 'lembrete' | 'status_alterado';
  mensagem: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { error } = await supabase.from('notificacoes').insert({
      voluntario_id: params.voluntario_id,
      escala_id: params.escala_id,
      tipo: params.tipo,
      mensagem: params.mensagem,
    });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createNotification:', error);
  }
}

export async function notifyNewEscala(
  escalaId: string,
  voluntarioId: string,
  data: Date,
  funcao: string,
  ministerioNome: string
) {
  const dataFormatada = format(data, "dd 'de' MMMM", { locale: ptBR });
  const mensagem = `Você foi escalado para servir em ${dataFormatada} como ${funcao} no ministério ${ministerioNome}.`;

  await createNotification({
    voluntario_id: voluntarioId,
    escala_id: escalaId,
    tipo: 'nova_escala',
    mensagem,
  });
}

export async function notifyStatusChanged(
  escalaId: string,
  voluntarioId: string,
  voluntarioNome: string,
  status: 'confirmado' | 'ausente',
  justificativa?: string | null
) {
  // Busca a escala incluindo created_by (criador) e fallback lider_id do ministério
  const { data: escala } = await supabase
    .from('escalas')
    .select('data, funcao, ministerio_id, created_by, ministerios(lider_id)')
    .eq('id', escalaId)
    .maybeSingle();

  if (!escala) return;

  // Destinatário: criador da escala, com fallback para lider_id do ministério
  const responsavelId = (escala as any).created_by
    ?? (escala as any).ministerios?.lider_id;

  // Sem destinatário ou voluntário respondendo a si mesmo → encerra
  if (!responsavelId || responsavelId === voluntarioId) return;

  const dataFormatada = format(new Date(escala.data), "dd/MM/yyyy", { locale: ptBR });
  const statusTexto = status === 'confirmado' ? 'confirmou presença na' : 'recusou a';
  let mensagem = `${voluntarioNome} ${statusTexto} escala de ${dataFormatada} como ${escala.funcao}.`;

  if (justificativa && status === 'ausente') {
    mensagem += ` Justificativa: ${justificativa}`;
  }

  // Exatamente 1 notificação para o responsável pela escala
  await createNotification({
    voluntario_id: responsavelId,
    escala_id: escalaId,
    tipo: 'status_alterado',
    mensagem,
  });
}

export async function notifyBatchNewEscalas(
  escalas: Array<{
    id: string;
    voluntario_id: string;
    data: string;
    funcao: string;
    ministerio_nome: string;
  }>
) {
  for (const escala of escalas) {
    await notifyNewEscala(
      escala.id,
      escala.voluntario_id,
      new Date(escala.data),
      escala.funcao,
      escala.ministerio_nome
    );
  }
}
