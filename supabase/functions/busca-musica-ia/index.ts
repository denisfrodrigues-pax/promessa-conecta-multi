import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {}
  // Strip markdown code fences
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(stripped.trim()); } catch {}
  // Find first { ... } block in the string
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  throw new Error('Não foi possível extrair JSON da resposta da IA');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada no servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query } = await req.json() as { query: string };
    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: 'query é obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let anthropicResponse: Response;
    try {
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Busque informações sobre a música gospel "${query.trim()}".

Retorne APENAS um objeto JSON válido, sem explicações, sem markdown, sem texto adicional:
{
  "titulo": "título exato da música",
  "artista": "nome do artista ou banda",
  "tom": "tom original se encontrado, ex: G, Am, C (null se não encontrar)",
  "link_youtube": "URL direta do YouTube se encontrar (null se não encontrar)",
  "link_cifraclub": "URL direta no cifraclub.com.br se encontrar (null se não encontrar)",
  "link_spotify_busca": "https://open.spotify.com/search/[titulo+artista encodado]",
  "link_deezer_busca": "https://www.deezer.com/search/[titulo+artista encodado]",
  "capa_url": "URL de imagem da capa se encontrar (null se não encontrar)"
}`,
          }],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('[busca-musica-ia] Anthropic error:', errText);
      return new Response(JSON.stringify({ error: `Erro na API da IA: ${anthropicResponse.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicResponse.json();

    // Find the last text block in the response (after any tool use/result blocks)
    const textBlocks = (data.content ?? []).filter((b: any) => b.type === 'text');
    const lastText: string = textBlocks[textBlocks.length - 1]?.text ?? '';

    if (!lastText) {
      return new Response(JSON.stringify({ error: 'Resposta vazia da IA' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: Record<string, unknown>;
    try {
      result = extractJson(lastText);
    } catch (e) {
      console.error('[busca-musica-ia] JSON parse error. Raw text:', lastText);
      return new Response(JSON.stringify({ error: 'Formato de resposta inválido da IA', raw: lastText }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = (error as Error).name === 'AbortError'
      ? 'Tempo limite excedido (30s)'
      : (error as Error).message ?? 'Erro interno';
    console.error('[busca-musica-ia]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
