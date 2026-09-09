import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Papéis que um admin comum (não superadmin) pode conceder por aqui — mesmo
// conjunto exibido em ROLE_OPTIONS (admin/Usuarios.tsx). 'superadmin' nunca
// entra nessa lista nem em nenhuma outra: é bloqueado antes de checar quem
// está chamando, não só pra admin comum.
const ADMIN_ASSIGNABLE_ROLES = ['admin', 'lider', 'voluntario', 'membro', 'financeiro'];

interface InviteAdminRequest {
  email: string;
  nome: string;
  church_id: string;
  role?: string;
  redirectTo: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) throw new Error('Unauthorized');

    const body: InviteAdminRequest = await req.json();
    const email = body.email?.trim();
    const nome = body.nome?.trim();
    const churchId = body.church_id;
    const role = (body.role || 'admin').trim();
    const redirectTo = body.redirectTo;

    if (!email || !nome || !churchId || !redirectTo) {
      throw new Error('Campos obrigatórios: email, nome, church_id, redirectTo');
    }

    // 'superadmin' nunca é atribuível por este endpoint, seja quem for que chamou.
    if (role === 'superadmin') {
      throw new Error('Não é permitido conceder o papel superadmin por este fluxo');
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isSuperadmin = (callerRoles || []).some((r: { role: string }) => r.role === 'superadmin');
    const isAdmin = (callerRoles || []).some((r: { role: string }) => r.role === 'admin');

    let authorized = isSuperadmin;
    if (!authorized && isAdmin) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('user_id', caller.id)
        .maybeSingle();
      authorized = !!callerProfile?.church_id && callerProfile.church_id === churchId;
    }

    if (!authorized) {
      throw new Error('Apenas admins da própria igreja ou o superadmin podem convidar usuários');
    }

    // Admin comum só pode conceder os papéis operacionais normais da própria
    // igreja — não pode usar este fluxo pra conceder um papel que ele mesmo
    // não deveria poder conceder. Superadmin não tem essa restrição adicional
    // (mas 'superadmin' já foi bloqueado acima, pra qualquer chamador).
    if (!isSuperadmin && !ADMIN_ASSIGNABLE_ROLES.includes(role)) {
      throw new Error(`Papel "${role}" não pode ser concedido por um admin comum`);
    }

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { nome },
      redirectTo,
    });

    if (inviteError || !inviteData?.user) {
      throw new Error(inviteError?.message || 'Falha ao convidar usuário');
    }

    const newUserId = inviteData.user.id;

    // O trigger on_auth_user_created já criou profiles (sem church_id) e
    // user_roles (role='membro', sem church_id) — corrige os dois agora pro
    // papel e igreja certos, em vez de confiar só no que o trigger faz.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ church_id: churchId })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Erro ao corrigir profiles.church_id:', profileError);
      throw new Error('Usuário convidado, mas falhou ao vincular à igreja. Contate o suporte.');
    }

    const { error: deleteRoleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', newUserId);

    if (deleteRoleError) {
      console.error('Erro ao limpar role padrão do trigger:', deleteRoleError);
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: newUserId, role, church_id: churchId });

    if (roleError) {
      console.error('Erro ao atribuir role:', roleError);
      throw new Error('Usuário convidado, mas falhou ao atribuir o papel. Contate o suporte.');
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId, email, role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error in invite-admin function:', error);
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
