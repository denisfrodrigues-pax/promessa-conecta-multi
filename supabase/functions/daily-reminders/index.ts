import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Escala {
  id: string;
  data: string;
  funcao: string;
  horario: string | null;
  voluntario_id: string;
  ministerio_id: string;
  lembrete_automatico_dias_antes: number | null;
  ministerios: { nome: string }[] | null;
  voluntario: { id: string; nome: string; telefone: string | null }[] | null;
}

/**
 * Parse a date string (YYYY-MM-DD) as local date without timezone conversion.
 */
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format date as DD/MM/YYYY for pt-BR display.
 */
const formatDateBR = (dateString: string): string => {
  const date = parseLocalDate(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    
    // Check if WhatsApp is enabled
    const whatsappEnabled = !!whatsappApiKey;
    if (!whatsappEnabled) {
      console.log('[daily-reminders] ⚠️ WHATSAPP_API_KEY not configured - WhatsApp messages will be skipped');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    console.log(`Running daily reminders for date: ${today.toISOString().split('T')[0]}`);

    // Find all escalas with automatic reminders configured
    const { data: escalas, error: escalasError } = await supabase
      .from('escalas')
      .select(`
        id,
        data,
        funcao,
        horario,
        voluntario_id,
        ministerio_id,
        lembrete_automatico_dias_antes,
        ministerios(nome),
        voluntario:profiles!escalas_voluntario_id_fkey(id, nome, telefone)
      `)
      .not('lembrete_automatico_dias_antes', 'is', null)
      .not('voluntario_id', 'is', null)
      .eq('status', 'pendente');

    if (escalasError) {
      console.error('Error fetching escalas:', escalasError);
      throw escalasError;
    }

    console.log(`Found ${escalas?.length || 0} escalas with automatic reminders configured`);

    let notificationsCreated = 0;
    let whatsappSent = 0;
    let whatsappFailed = 0;
    let skippedAlreadySent = 0;

  for (const escala of (escalas || []) as Escala[]) {
    const voluntarioData = Array.isArray(escala.voluntario) ? escala.voluntario[0] : escala.voluntario;
    if (!escala.lembrete_automatico_dias_antes || !voluntarioData) continue;

      // Calculate if today is the right day to send the reminder
      const escalaDate = parseLocalDate(escala.data);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffTime = escalaDate.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays !== escala.lembrete_automatico_dias_antes) {
        continue; // Not the right day to send this reminder
      }

      console.log(`Processing escala ${escala.id} - ${diffDays} days before`);

      // Check if automatic reminder was already sent today for this escala
      const todayStr = today.toISOString().split('T')[0];
      const { data: existingReminder } = await supabase
        .from('historico_comunicacoes')
        .select('id')
        .eq('escala_id', escala.id)
        .eq('tipo', 'whatsapp_auto')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`)
        .maybeSingle();

      if (existingReminder) {
        console.log(`Skipping escala ${escala.id} - already sent today`);
        skippedAlreadySent++;
        continue;
      }

      // Get ministerio name
      let ministerioNome = 'um ministério';
      if (escala.ministerios) {
        if (Array.isArray(escala.ministerios) && escala.ministerios.length > 0) {
          ministerioNome = escala.ministerios[0]?.nome || 'um ministério';
        }
      }

      const dataFormatada = formatDateBR(escala.data);
      const horario = escala.horario || 'horário a confirmar';
      const voluntario = voluntarioData;

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notificacoes')
        .insert({
          voluntario_id: escala.voluntario_id,
          escala_id: escala.id,
          ministerio_id: escala.ministerio_id,
          tipo: 'lembrete',
          titulo: 'Lembrete de escala',
          mensagem: `Em ${diffDays} dia(s) você serve no ${ministerioNome} como ${escala.funcao}.`,
        });

      if (!notifError) {
        notificationsCreated++;
      }

      // Send WhatsApp only if API is configured and phone is available
      if (whatsappEnabled && voluntario.telefone) {
        try {
          const mensagem = `Olá ${voluntario.nome}, você está escalado(a) para ${escala.funcao} no ${ministerioNome} no dia ${dataFormatada} às ${horario}. Acesse o sistema para confirmar sua presença.`;
          const mensagemPreview = mensagem.substring(0, 255);

          // Call send-whatsapp-message function
          const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              phone_number: voluntario.telefone,
              message_body: mensagem,
              template_id: 'escala_reminder_auto',
            }),
          });

          const whatsappData = await whatsappResponse.json();

          if (whatsappData.success) {
            whatsappSent++;
            // Log success (with status indicating if it was simulated)
            await supabase.from('historico_comunicacoes').insert({
              escala_id: escala.id,
              voluntario_id: voluntario.id,
              tipo: 'whatsapp_auto',
              status: whatsappData.status === 'simulacao_desativada' ? 'simulacao_desativada' : 'sucesso',
              mensagem_preview: mensagemPreview,
              detalhes_erro: null,
            });
          } else {
            whatsappFailed++;
            // Log error
            await supabase.from('historico_comunicacoes').insert({
              escala_id: escala.id,
              voluntario_id: voluntario.id,
              tipo: 'whatsapp_auto',
              status: 'erro_api',
              mensagem_preview: mensagemPreview,
              detalhes_erro: whatsappData.error || 'Erro na API de WhatsApp',
            });
          }
        } catch (err) {
          whatsappFailed++;
          console.error('Error sending WhatsApp:', err);
          // Log error
          await supabase.from('historico_comunicacoes').insert({
            escala_id: escala.id,
            voluntario_id: voluntario.id,
            tipo: 'whatsapp_auto',
            status: 'erro_api',
            mensagem_preview: null,
            detalhes_erro: err instanceof Error ? err.message : 'Erro desconhecido',
          });
        }
      } else if (!whatsappEnabled) {
        // WhatsApp disabled - log skip
        console.log(`[daily-reminders] Skipping WhatsApp for ${voluntario.nome} - API not configured`);
      } else {
        // Log sem_telefone
        await supabase.from('historico_comunicacoes').insert({
          escala_id: escala.id,
          voluntario_id: voluntario.id,
          tipo: 'whatsapp_auto',
          status: 'sem_telefone',
          mensagem_preview: null,
          detalhes_erro: 'Voluntário não possui telefone cadastrado',
        });
      }
    }

    const summary = {
      success: true,
      notifications_created: notificationsCreated,
      whatsapp_sent: whatsappSent,
      whatsapp_failed: whatsappFailed,
      skipped_already_sent: skippedAlreadySent,
      date: today.toISOString().split('T')[0],
    };

    console.log('Daily reminders summary:', summary);

    return new Response(
      JSON.stringify(summary),
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
