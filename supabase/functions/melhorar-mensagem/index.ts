import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mensagem, contexto } = await req.json() as { mensagem: string; contexto?: string };

    if (!mensagem?.trim()) {
      return new Response(JSON.stringify({ error: 'mensagem é obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      console.warn('[melhorar-mensagem] ANTHROPIC_API_KEY não configurada — retornando original');
      return new Response(JSON.stringify({ mensagem_melhorada: mensagem }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Você é um assistente do ministério infantil de uma igreja evangélica. Melhore a mensagem abaixo para ser enviada ao responsável de uma criança via WhatsApp. Torne-a mais clara, carinhosa e profissional. Mantenha o tom cristão e acolhedor. Retorne APENAS a mensagem melhorada, sem comentários ou explicações adicionais.

Contexto: ${contexto ?? 'Comunicado geral do ministério infantil'}

Mensagem original:
${mensagem}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[melhorar-mensagem] Anthropic API error:', err);
      return new Response(JSON.stringify({ mensagem_melhorada: mensagem, aviso: 'IA indisponível' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const mensagem_melhorada = (data.content?.[0]?.text as string | undefined)?.trim() ?? mensagem;

    return new Response(JSON.stringify({ mensagem_melhorada }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[melhorar-mensagem] Erro:', error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
