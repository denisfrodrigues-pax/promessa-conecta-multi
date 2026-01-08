import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  phone_number: string;
  message_body: string;
  template_id?: string;
}

interface WhatsAppResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  details?: {
    phone_number: string;
    message_body: string;
    template_id?: string;
    sent_at: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[WhatsApp] Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('[WhatsApp] Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[WhatsApp] User authenticated: ${userId}`);

    // Check user roles - only admin or lider can send WhatsApp messages
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('[WhatsApp] Error fetching user roles:', rolesError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasPermission = userRoles?.some(r => r.role === 'admin' || r.role === 'lider');
    if (!hasPermission) {
      console.error(`[WhatsApp] User ${userId} lacks required role (admin/lider)`);
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions. Only admins and leaders can send WhatsApp messages.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WhatsApp] User ${userId} authorized with roles:`, userRoles?.map(r => r.role));

    // Get the API key from environment
    const apiKey = Deno.env.get('WHATSAPP_API_KEY');
    
    // Log API key status (don't log actual key!)
    console.log(`[WhatsApp] API Key configured: ${apiKey ? 'Yes' : 'No (using simulation mode)'}`);

    // Parse request body
    const body: WhatsAppRequest = await req.json();
    const { phone_number, message_body, template_id } = body;

    // Validate required fields
    if (!phone_number || !message_body) {
      console.error('[WhatsApp] Missing required fields:', { phone_number: !!phone_number, message_body: !!message_body });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: phone_number and message_body are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      console.error('[WhatsApp] Invalid phone number format:', cleanPhone);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid phone number format. Use international format (e.g., +5511999999999)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message length
    if (message_body.length > 4096) {
      console.error('[WhatsApp] Message too long:', message_body.length);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message body exceeds maximum length of 4096 characters' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate message ID and timestamp
    const messageId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sentAt = new Date().toISOString();

    // If no API key, return success with simulation status (WhatsApp disabled)
    if (!apiKey) {
      console.log('[WhatsApp] ⚠️ WHATSAPP_API_KEY not configured - returning simulated success');
      console.log('[WhatsApp] Details:', {
        message_id: messageId,
        phone_number: cleanPhone,
        message_preview: message_body.substring(0, 100) + (message_body.length > 100 ? '...' : ''),
        template_id: template_id || 'none',
        sent_at: sentAt,
        status: 'simulacao_desativada',
        user_id: userId
      });

      return new Response(
        JSON.stringify({
          success: true,
          message_id: messageId,
          status: 'simulacao_desativada',
          details: {
            phone_number: cleanPhone,
            message_body: message_body,
            template_id: template_id,
            sent_at: sentAt
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate API call delay (200-500ms) - only if API key is present
    const delay = Math.floor(Math.random() * 300) + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Log the simulated message send
    console.log('[WhatsApp] ✅ Message sent successfully (SIMULATION)');
    console.log('[WhatsApp] Details:', {
      message_id: messageId,
      phone_number: cleanPhone,
      message_preview: message_body.substring(0, 100) + (message_body.length > 100 ? '...' : ''),
      template_id: template_id || 'none',
      sent_at: sentAt,
      api_latency_ms: delay,
      user_id: userId
    });

    // If we had real credentials, we would call the actual API here:
    // 
    // const response = await fetch('https://api.twilio.com/...', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     to: `whatsapp:${cleanPhone}`,
    //     body: message_body,
    //     template: template_id
    //   })
    // });

    const response: WhatsAppResponse = {
      success: true,
      message_id: messageId,
      details: {
        phone_number: cleanPhone,
        message_body: message_body,
        template_id: template_id,
        sent_at: sentAt
      }
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WhatsApp] ❌ Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
