export const config = {
  matcher: ['/i/:slug', '/i/:slug/:path*'],
  runtime: 'nodejs',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SITE_URL = 'https://promessa-conecta-multi.vercel.app';
const GENERIC_DESCRICAO = 'Plataforma de gestão eclesiástica para igrejas que crescem.';
const CACHE_TTL_MS = 5 * 60 * 1000;
const SUPABASE_TIMEOUT_MS = 2000;
const INDEX_HTML_TIMEOUT_MS = 3000;

async function fetchWithTimeout(url: string | URL, timeoutMs: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

type ChurchOgData = {
  nome: string;
  descricao: string;
  imageUrl: string;
};

// Cache em memória — melhor esforço apenas (instâncias de Edge são distribuídas
// e efêmeras); o Cache-Control abaixo é o mecanismo real de redução de carga no Supabase.
const cache = new Map<string, { data: ChurchOgData; expiresAt: number }>();

async function fetchChurch(slug: string): Promise<ChurchOgData | null> {
  const cached = cache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/igrejas?slug=eq.${encodeURIComponent(slug)}&select=nome,slogan,logo_url,cor_primaria&limit=1`,
      SUPABASE_TIMEOUT_MS,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{
      nome: string | null;
      slogan: string | null;
      logo_url: string | null;
      cor_primaria: string | null;
    }>;

    const igreja = rows[0];
    if (!igreja || !igreja.nome) return null;

    const temLogoReal = !!igreja.logo_url && /^https?:\/\//i.test(igreja.logo_url);
    const imageUrl = temLogoReal
      ? igreja.logo_url!
      : `${SITE_URL}/api/og?nome=${encodeURIComponent(igreja.nome)}${
          igreja.cor_primaria ? `&cor=${encodeURIComponent(igreja.cor_primaria)}` : ''
        }`;

    const data: ChurchOgData = {
      nome: igreja.nome,
      descricao: igreja.slogan?.trim() || GENERIC_DESCRICAO,
      imageUrl,
    };

    cache.set(slug, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    // Qualquer falha (rede, timeout via AbortController, JSON inválido, etc.):
    // fail-open — trata como "igreja não resolvida", nunca propaga o erro.
    return null;
  }
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replaceMetaContent(html: string, attr: 'property' | 'name', key: string, newValue: string): string {
  const re = new RegExp(`(<meta\\s+${attr}=["']${key}["']\\s+content=["'])([^"']*)(["'])`, 'i');
  if (!re.test(html)) return html;
  return html.replace(re, `$1${escapeHtmlAttr(newValue)}$3`);
}

function rewriteOgTags(html: string, church: ChurchOgData): string {
  let out = html;
  out = replaceMetaContent(out, 'property', 'og:title', church.nome);
  out = replaceMetaContent(out, 'property', 'og:description', church.descricao);
  out = replaceMetaContent(out, 'property', 'og:image', church.imageUrl);
  out = replaceMetaContent(out, 'name', 'twitter:title', church.nome);
  out = replaceMetaContent(out, 'name', 'twitter:description', church.descricao);
  out = replaceMetaContent(out, 'name', 'twitter:image', church.imageUrl);
  return out;
}

// Navegadores reais já recebem título/favicon dinâmicos via IgrejaSlugContext no
// client — as tags og:*/twitter:* do HTML inicial só importam pra crawlers de
// compartilhamento, que não executam JS. Então só vale a pena pagar o custo da
// consulta ao Supabase (~0,3-0,9s, medido) quando o requester é um desses bots
// conhecidos — pra um usuário real, isso seria latência pura sem benefício algum.
const CRAWLER_USER_AGENT_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|SkypeUriPreview|redditbot|Pinterest|vkShare|Applebot|Googlebot|Bingbot|DuckDuckBot|YandexBot|W3C_Validator/i;

function isCrawlerRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') ?? '';
  return CRAWLER_USER_AGENT_RE.test(userAgent);
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  try {
    // Só reescreve documentos de rota (HTML) — qualquer path com extensão é asset
    // (JS/CSS/imagens/etc.) e deve seguir direto, sem custo extra. Na prática o
    // matcher já restringe a Middleware a /i/:slug*, então isto é defensivo.
    const isAsset = /\.[a-zA-Z0-9]+$/.test(url.pathname);
    const match = isAsset ? null : url.pathname.match(/^\/i\/([^/]+)/);
    const slug = match?.[1];

    const shouldResolveChurch = !!slug && isCrawlerRequest(request);

    // SPA estática: toda rota serve o mesmo index.html (via rewrite em vercel.json).
    // Busca o asset estático diretamente — sem passar pela própria rota interceptada,
    // que exigiria "continuar a cadeia" e arriscaria reinvocar esta Middleware.
    // As duas buscas são independentes — rodam em paralelo (relevante só pro caso
    // de crawler, que é o único que paga o custo da consulta ao Supabase).
    //
    // Repassa cookie/bypass da requisição original pro fetch interno: é uma busca
    // nova, sem qualquer credencial por padrão — se o deployment tiver Deployment
    // Protection ativo (caso de todo preview, e potencialmente de produção também
    // no futuro), esse fetch cairia na tela de login da Vercel em vez do
    // index.html real, e a página inteira quebraria pra qualquer visitante.
    const internalFetchHeaders = new Headers();
    const cookie = request.headers.get('cookie');
    if (cookie) internalFetchHeaders.set('cookie', cookie);
    const bypassHeader = request.headers.get('x-vercel-protection-bypass');
    if (bypassHeader) internalFetchHeaders.set('x-vercel-protection-bypass', bypassHeader);

    const [indexResponse, church] = await Promise.all([
      fetchWithTimeout(new URL('/index.html', url.origin), INDEX_HTML_TIMEOUT_MS, { headers: internalFetchHeaders }),
      shouldResolveChurch ? fetchChurch(slug!) : Promise.resolve(null),
    ]);
    if (!church) {
      // Sem igreja resolvida (asset, rota fora de /i/:slug, slug inválido, ou
      // qualquer falha em fetchChurch — que já é fail-open internamente):
      // devolve o index.html sem alterações.
      const headers = new Headers(indexResponse.headers);
      headers.set('x-og-debug', `slug=${slug ?? '(none)'};shouldResolve=${shouldResolveChurch};ua=${(request.headers.get('user-agent') ?? '').slice(0, 80)}`);
      return new Response(indexResponse.body, {
        status: indexResponse.status,
        headers,
      });
    }

    const html = await indexResponse.text();
    const rewritten = rewriteOgTags(html, church);

    return new Response(rewritten, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    // Fail-open absoluto: qualquer erro não previsto no pipeline (ex.: falha ou
    // timeout ao buscar o próprio /index.html) nunca deve derrubar a página para
    // um usuário real — cai para uma busca direta do documento, sem reescrita.
    const fallbackHeaders = new Headers();
    const cookie = request.headers.get('cookie');
    if (cookie) fallbackHeaders.set('cookie', cookie);
    const bypassHeader = request.headers.get('x-vercel-protection-bypass');
    if (bypassHeader) fallbackHeaders.set('x-vercel-protection-bypass', bypassHeader);
    return fetchWithTimeout(new URL('/index.html', url.origin), INDEX_HTML_TIMEOUT_MS, { headers: fallbackHeaders });
  }
}
