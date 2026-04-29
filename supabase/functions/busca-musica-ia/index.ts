import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch {}
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(stripped.trim()); } catch {}
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
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: `Você é um especialista em música gospel brasileira. Com base no seu conhecimento de treinamento, retorne informações sobre a música: "${query.trim()}"

Retorne APENAS um objeto JSON válido, sem explicações, sem markdown, sem texto antes ou depois:
{
  "titulo": "título exato da música",
  "artista": "nome do artista ou banda principal",
  "tom": "tom musical original mais comum, ex: G, Am, C, D, E — null se não souber",
  "link_youtube": null,
  "link_cifraclub": "URL direta no cifraclub.com.br se tiver certeza que existe, ex: https://www.cifraclub.com.br/artista/musica — null se não souber",
  "link_spotify_busca": "https://open.spotify.com/search/${encodeURIComponent(query.trim())}",
  "link_deezer_busca": "https://www.deezer.com/search/${encodeURIComponent(query.trim())}",
  "capa_url": null
}

Se não conhecer a música, mesmo assim retorne o JSON com titulo e artista preenchidos com a melhor estimativa, e null nos demais campos opcionais.`,
          }],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('[busca-musica-ia] Anthropic error:', anthropicResponse.status, errText);
      return new Response(JSON.stringify({ error: `Erro na API da IA: ${anthropicResponse.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicResponse.json();

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
    } catch {
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
