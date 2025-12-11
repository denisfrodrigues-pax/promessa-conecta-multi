import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret to prevent unauthorized calls
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('x-cron-secret');
  
  // If CRON_SECRET is set, validate it
  if (cronSecret && authHeader !== cronSecret) {
    console.error('Unauthorized: Invalid or missing cron secret');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Looking for escalas on date: ${tomorrowStr}`);

    // Find all escalas scheduled for tomorrow
    const { data: escalas, error: escalasError } = await supabase
      .from('escalas')
      .select(`
        id,
        data,
        funcao,
        voluntario_id,
        ministerio_id,
        ministerios(nome)
      `)
      .eq('data', tomorrowStr)
      .not('voluntario_id', 'is', null);

    if (escalasError) {
      console.error('Error fetching escalas:', escalasError);
      throw escalasError;
    }

    console.log(`Found ${escalas?.length || 0} escalas for tomorrow`);

    let notificationsCreated = 0;

    // Create reminder notifications for each escala
    for (const escala of escalas || []) {
      // Check if a reminder was already sent for this escala
      const { data: existingReminder } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('escala_id', escala.id)
        .eq('tipo', 'lembrete')
        .maybeSingle();

      if (!existingReminder) {
        // Handle ministerios - can be object or array depending on Supabase response
        let ministerioNome = 'um ministério';
        if (escala.ministerios) {
          if (Array.isArray(escala.ministerios)) {
            ministerioNome = escala.ministerios[0]?.nome || 'um ministério';
          } else {
            ministerioNome = (escala.ministerios as { nome: string }).nome || 'um ministério';
          }
        }
        
        const dataFormatada = new Date(escala.data).toLocaleDateString('pt-BR');

        const { error: insertError } = await supabase
          .from('notificacoes')
          .insert({
            voluntario_id: escala.voluntario_id,
            escala_id: escala.id,
            ministerio_id: escala.ministerio_id,
            tipo: 'lembrete',
            titulo: 'Lembrete de escala',
            mensagem: `Amanhã você serve no ${ministerioNome} como ${escala.funcao}.`,
          });

        if (insertError) {
          console.error('Error creating notification:', insertError);
        } else {
          notificationsCreated++;
        }
      }
    }

    console.log(`Created ${notificationsCreated} reminder notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${notificationsCreated} reminder notifications`,
        date: tomorrowStr 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in daily-reminders function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
