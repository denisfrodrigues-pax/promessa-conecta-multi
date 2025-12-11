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
  // Get the scale details
  const { data: escala } = await supabase
    .from('escalas')
    .select(`
      data,
      funcao,
      ministerio_id,
      ministerios(nome, lider_id)
    `)
    .eq('id', escalaId)
    .maybeSingle();

  if (!escala) return;

  const dataFormatada = format(new Date(escala.data), "dd/MM/yyyy", { locale: ptBR });
  const statusTexto = status === 'confirmado' ? 'confirmou' : 'recusou';
  let mensagem = `${voluntarioNome} ${statusTexto} a escala de ${dataFormatada} como ${escala.funcao}.`;
  
  if (justificativa && status === 'ausente') {
    mensagem += ` Justificativa: ${justificativa}`;
  }

  // Notify the ministry leader if exists
  if (escala.ministerios?.lider_id) {
    await createNotification({
      voluntario_id: escala.ministerios.lider_id,
      escala_id: escalaId,
      tipo: 'status_alterado',
      mensagem,
    });
  }

  // Get admins to notify
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (adminRoles) {
    for (const adminRole of adminRoles) {
      // Get profile id for admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', adminRole.user_id)
        .maybeSingle();

      if (adminProfile && adminProfile.id !== escala.ministerios?.lider_id) {
        await createNotification({
          voluntario_id: adminProfile.id,
          escala_id: escalaId,
          tipo: 'status_alterado',
          mensagem,
        });
      }
    }
  }
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
