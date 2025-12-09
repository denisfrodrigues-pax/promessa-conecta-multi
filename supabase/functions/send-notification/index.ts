import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  send_to_all?: boolean;
  send_to_ministerio?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    const isLeader = userRoles?.some(r => r.role === 'lider');

    // Parse request body
    const body: NotificationRequest = await req.json();
    console.log('Received notification request:', body);

    // Validate required fields
    if (!body.titulo || !body.mensagem || !body.tipo) {
      throw new Error('Missing required fields: titulo, mensagem, tipo');
    }

    let targetUserIds: string[] = [];

    if (body.send_to_all) {
      // Only admins can send to all
      if (!isAdmin) {
        throw new Error('Only admins can send notifications to all users');
      }
      
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id');
      
      targetUserIds = (allProfiles || []).map((p: { id: string }) => p.id);
    } else if (body.send_to_ministerio) {
      // Leaders can only send to their own ministry
      if (!isAdmin) {
        // Check if user is leader of this ministry
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

      // Get all volunteers from the ministry
      const { data: volunteers } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          profile:profiles!ministerio_voluntarios_user_id_fkey(id)
        `)
        .eq('ministerio_id', body.send_to_ministerio)
        .eq('ativo', true);

      targetUserIds = (volunteers || [])
        .filter((v: { profile: { id: string }[] | null }) => v.profile && v.profile.length > 0)
        .map((v: { profile: { id: string }[] }) => v.profile[0].id);
    } else if (body.user_id) {
      // Sending to specific user
      if (!isAdmin && !isLeader) {
        throw new Error('Only admins and leaders can send notifications');
      }

      // If leader, verify the user is in their ministry
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

        // Check if target user is in leader's ministry
        const { data: targetVolunteer } = await supabase
          .from('ministerio_voluntarios')
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

    // Create notifications
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${targetUserIds.length} user(s)` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: err.message === 'Unauthorized' ? 401 : 400 
      }
    );
  }
});
