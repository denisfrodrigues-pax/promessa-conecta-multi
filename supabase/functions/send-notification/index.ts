import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id?: string;
  titulo: string;
  mensagem: string;
  tipo: 'sistema' | 'escala' | 'ministerio' | 'aviso_admin' | 'nova_escala' | 'lembrete' | 'status_alterado';
  ministerio_id?: string;
  escala_id?: string;
  url?: string;
  send_to_all?: boolean;
  send_to_ministerio?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    webpush.setVapidDetails(
      'mailto:contato@promessahortolandia.com.br',
      vapidPublic,
      vapidPrivate,
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((r: { role: string }) => r.role === 'admin' || r.role === 'superadmin');
    const isLeader = userRoles?.some((r: { role: string }) => r.role === 'lider');

    const body: NotificationRequest = await req.json();
    console.log('Received notification request:', body);

    if (!body.titulo || !body.mensagem || !body.tipo) {
      throw new Error('Missing required fields: titulo, mensagem, tipo');
    }

    let targetUserIds: string[] = [];

    if (body.send_to_all) {
      if (!isAdmin) throw new Error('Only admins can send notifications to all users');

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id');

      targetUserIds = (allProfiles || []).map((p: { id: string }) => p.id);
    } else if (body.send_to_ministerio) {
      if (!isAdmin) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: ministry } = await supabase
          .from('ministerios')
          .select('lider_id')
          .eq('id', body.send_to_ministerio)
          .single();

        if (!isLeader || ministry?.lider_id !== userProfile?.id) {
          throw new Error('You can only send notifications to your own ministry');
        }
      }

      // A tabela foi renomeada pra ministerio_usuarios em algum momento (as FK constraints
      // não foram renomeadas junto, continuam com o prefixo antigo ministerio_voluntarios_*).
      // O embed via hint de constraint (profiles!ministerio_voluntarios_user_id_fkey)
      // retornava vazio nesta função mesmo com o schema cache do PostgREST recarregado —
      // busca em duas etapas (já é o padrão usado mais abaixo pra profilesForPush) evita
      // depender da resolução de embed por trás do rename.
      const { data: activeVolunteers } = await supabase
        .from('ministerio_usuarios')
        .select('user_id')
        .eq('ministerio_id', body.send_to_ministerio)
        .eq('ativo', true);

      const volunteerAuthIds = (activeVolunteers || []).map((v: { user_id: string }) => v.user_id);

      if (volunteerAuthIds.length > 0) {
        const { data: volunteerProfiles } = await supabase
          .from('profiles')
          .select('id')
          .in('user_id', volunteerAuthIds);

        targetUserIds = (volunteerProfiles || []).map((p: { id: string }) => p.id);
      }
    } else if (body.user_id) {
      if (!isAdmin && !isLeader) throw new Error('Only admins and leaders can send notifications');

      if (!isAdmin && isLeader) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: leaderMinistries } = await supabase
          .from('ministerios')
          .select('id')
          .eq('lider_id', userProfile?.id);

        const ministryIds = (leaderMinistries || []).map((m: { id: string }) => m.id);

        const { data: targetVolunteer } = await supabase
          .from('ministerio_usuarios')
          .select('ministerio_id')
          .eq('user_id', body.user_id)
          .in('ministerio_id', ministryIds)
          .maybeSingle();

        if (!targetVolunteer) {
          throw new Error('You can only send notifications to members of your ministry');
        }
      }

      targetUserIds = [body.user_id];
    } else {
      throw new Error('Must specify user_id, send_to_all, or send_to_ministerio');
    }

    console.log(`Sending notification to ${targetUserIds.length} users`);

    // ── Insert in-app notifications ─────────────────────────────────────────
    const notifications = targetUserIds.map(userId => ({
      voluntario_id: userId,
      titulo: body.titulo,
      mensagem: body.mensagem,
      tipo: body.tipo,
      ministerio_id: body.ministerio_id || body.send_to_ministerio || null,
      escala_id: body.escala_id || null,
    }));

    const { error: insertError } = await supabase
      .from('notificacoes')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    // ── Send push notifications ─────────────────────────────────────────────
    const pushPayload = JSON.stringify({
      title: body.titulo,
      body: body.mensagem,
      url: body.url || '/app/notificacoes',
    });

    let pushSent = 0;
    let pushFailed = 0;

    // push_subscriptions.user_id guarda o id de auth.users, enquanto targetUserIds
    // acima são todos profiles.id (voluntario_id/profile.id) — sem este mapeamento,
    // a query abaixo nunca encontra nenhuma subscription (bug real encontrado ao
    // testar o envio de ponta a ponta: nenhum push saía, apesar de tudo mais certo).
    const { data: profilesForPush } = await supabase
      .from('profiles')
      .select('id, user_id')
      .in('id', targetUserIds);

    const authUserIds = (profilesForPush || [])
      .map((p: { user_id: string | null }) => p.user_id)
      .filter((id): id is string => !!id);

    for (const authUserId of authUserIds) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', authUserId);

      for (const sub of subscriptions || []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload,
          );
          pushSent++;
        } catch (err) {
          console.error(`Push failed for subscription ${sub.id}:`, err);
          pushFailed++;
          // Remove expired/invalid subscriptions (410 Gone)
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    console.log(`Push: ${pushSent} sent, ${pushFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${targetUserIds.length} user(s)`,
        push: { sent: pushSent, failed: pushFailed },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: err.message === 'Unauthorized' ? 401 : 400,
      },
    );
  }
});
