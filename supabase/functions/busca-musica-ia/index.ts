import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function nullify(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s.toLowerCase() === 'null' ? null : s;
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const trimmed = text.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(),
  ];
  for (const c of candidates) {
    try {
      const p = JSON.parse(c);
      if (Array.isArray(p)) return p;
      if (typeof p === 'object' && p !== null) return [p];
    } catch {}
  }
  // Try to find [...] block
  const arrM = trimmed.match(/\[[\s\S]*\]/);
  if (arrM) {
    try {
      const p = JSON.parse(arrM[0]);
      if (Array.isArray(p)) return p;
    } catch {}
  }
  // Fall back to first {...} block as single item
  const objM = trimmed.match(/\{[\s\S]*\}/);
  if (objM) {
    try { return [JSON.parse(objM[0])]; } catch {}
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

    const q = query.trim();
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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Você é especialista em música gospel brasileira. Retorne informações sobre a música: "${q}"

Retorne APENAS um array JSON válido com até 3 versões/intérpretes diferentes (sem texto extra, sem markdown):
[
  {
    "titulo": "título exato",
    "artista": "nome do artista ou banda — nunca retorne null, use o nome mais conhecido",
    "tom": "tom musical mais comum, ex: G, Am, C — null se não souber",
    "link_cifraclub": "URL exata no cifraclub.com.br se tiver certeza, ex: https://www.cifraclub.com.br/artista/musica — null se não souber"
  }
]

Se houver apenas um intérprete conhecido, retorne array com 1 item. Nunca retorne o campo "artista" como null.`,
          }],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await anthropicResponse.text();
    console.log('[busca-musica-ia] Status:', anthropicResponse.status);
    console.log('[busca-musica-ia] Body:', responseText);

    if (!anthropicResponse.ok) {
      return new Response(JSON.stringify({ error: responseText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data: any;
    try { data = JSON.parse(responseText); } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido da Anthropic', raw: responseText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const textBlocks = (data.content ?? []).filter((b: any) => b.type === 'text');
    const lastText: string = textBlocks[textBlocks.length - 1]?.text ?? '';

    if (!lastText) {
      return new Response(JSON.stringify({ error: 'Resposta vazia da IA' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let raw: Record<string, unknown>[];
    try {
      raw = extractJsonArray(lastText);
    } catch {
      console.error('[busca-musica-ia] JSON parse error. Raw:', lastText);
      return new Response(JSON.stringify({ error: 'Formato inválido da IA', raw: lastText }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize each item and generate search links from titulo+artista
    const results = raw.slice(0, 3).map((item) => {
      const titulo = nullify(item.titulo) ?? q;
      const artista = nullify(item.artista) ?? 'Artista não identificado';
      const searchTerm = encodeURIComponent(`${titulo} ${artista}`.trim());
      // CifraClub: use AI-provided direct URL when confident, else generate search URL
      const cifraclubDirect = nullify(item.link_cifraclub);
      return {
        titulo,
        artista,
        tom: nullify(item.tom),
        // YouTube: always a search URL so user can preview (not saved to form)
        link_youtube: `https://www.youtube.com/results?search_query=${searchTerm}`,
        link_cifraclub: cifraclubDirect ?? `https://www.cifraclub.com.br/busca/?q=${encodeURIComponent(titulo)}`,
        link_spotify_busca: `https://open.spotify.com/search/${searchTerm}`,
        link_deezer_busca: `https://www.deezer.com/search/${searchTerm}`,
        capa_url: null,
      };
    });

    return new Response(JSON.stringify(results), {
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
