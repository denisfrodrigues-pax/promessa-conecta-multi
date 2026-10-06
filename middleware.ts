import { next } from '@vercel/functions';

// Cobre TODA rota sob /i/:slug — não só as públicas. Motivo: diferente da
// reescrita de OG (só importa pra crawler, que nunca pisa em rota
// autenticada), a reescrita de PWA do iOS (abaixo) precisa valer em qualquer
// página, porque "Adicionar à Tela de Início" no Safari lê o HTML da página
// em que a pessoa está NO MOMENTO do toque — e o caso real mais comum é
// alguém logado reinstalando a partir de dentro de /app, não da home pública.
// Custo da ampliação: a Function só roda em NAVEGAÇÃO DE PÁGINA (reload, link
// direto, abertura do ícone instalado) — trocar de rota dentro do SPA é
// client-side (React Router) e não bate aqui. Dentro da função, o fast path
// (abaixo) é só 2 regex contra o User-Agent já presente no header, sem
// nenhum fetch; o custo real por request é o mesmo overhead de invocar esta
// Routing Middleware (runtime Node.js — não é isolado edge/V8; é a mesma
// Function Node já paga hoje nas rotas públicas) que já existia antes desta
// mudança — só passa a valer pras demais rotas também. Medido: mediana de
// time_starttransfer ~10ms acima da rota raiz "/" (que não passa por
// Middleware alguma) — ver relatório do PR.
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

// Casa tanto `<link rel="x" href="y">` quanto a forma self-closing
// `<link rel="x" href="y" />` (é assim que o vite-plugin-pwa e o index.html
// escrevem essas tags, respectivamente) — só o valor do href é substituído,
// o resto da tag (inclusive o fechamento) segue intocado.
function replaceLinkHref(html: string, rel: string, newHref: string): string {
  const re = new RegExp(`(<link\\s+rel=["']${rel}["']\\s+href=["'])([^"']*)(["'])`, 'i');
  if (!re.test(html)) return html;
  return html.replace(re, `$1${escapeHtmlAttr(newHref)}$3`);
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

// iOS puro por User-Agent. Deliberadamente NÃO tenta o heurístico de
// iPadOS-13+-anunciado-como-Macintosh (que o client usa em src/lib/
// pwaDetect.ts via navigator.maxTouchPoints) — esse sinal não existe do lado
// do servidor, então esse caso específico de iPad continua coberto só pela
// troca via JS em IgrejaSlugContext.tsx (fallback descrito abaixo).
const IOS_USER_AGENT_RE = /iPhone|iPad|iPod/i;

function isIOSRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') ?? '';
  return IOS_USER_AGENT_RE.test(userAgent);
}

// Reescreve as 3 tags que o Safari usa em "Adicionar à Tela de Início" —
// nome, manifest (id/scope/start_url próprios da igreja) e ícone — direto no
// HTML estático, pro caso de alguém instalar antes do JS (IgrejaSlugContext)
// rodar. Função pura e exportada pra poder testar sem precisar de um Request.
export function rewriteIosPwaTags(html: string, slug: string, churchNome: string): string {
  let out = html;
  out = replaceLinkHref(out, 'manifest', `/api/manifest/${slug}`);
  out = replaceMetaContent(out, 'name', 'apple-mobile-web-app-title', churchNome);
  out = replaceLinkHref(out, 'apple-touch-icon', `/api/manifest-icon/${slug}?size=180&purpose=apple`);
  return out;
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

    const crawler = isCrawlerRequest(request);
    const ios = isIOSRequest(request);

    // Fast path: esmagadora maioria do tráfego (navegador real não-iOS,
    // asset, rota sem slug) — next() devolve o controle pro roteamento
    // normal da Vercel sem nenhum fetch adicional, sem nenhuma latência
    // extra medível (só os 2 testes de regex acima, já resolvidos a essa
    // altura).
    if (!slug || (!crawler && !ios)) {
      return next();
    }

    // A partir daqui, só requests de crawler conhecido (compartilhamento
    // social/indexação) ou de iOS (instalação via "Adicionar à Tela de
    // Início") — aqui sim vale pagar o custo de resolver a igreja e
    // reescrever o HTML.
    //
    // SPA estática: toda rota serve o mesmo index.html (via rewrite em vercel.json).
    // Busca o asset estático diretamente — sem passar pela própria rota interceptada,
    // que exigiria "continuar a cadeia" e arriscaria reinvocar esta Middleware.
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
      fetchChurch(slug),
    ]);
    if (!church) {
      // Slug não corresponde a nenhuma igreja, ou fetchChurch falhou (já é
      // fail-open internamente): devolve o index.html sem alterações.
      return new Response(indexResponse.body, {
        status: indexResponse.status,
        headers: indexResponse.headers,
      });
    }

    const html = await indexResponse.text();
    let rewritten = html;
    if (crawler) rewritten = rewriteOgTags(rewritten, church);
    if (ios) rewritten = rewriteIosPwaTags(rewritten, slug, church.nome);

    const headers: Record<string, string> = { 'content-type': 'text/html; charset=utf-8' };
    if (ios) {
      // Conteúdo varia por User-Agent (só iOS recebe as tags trocadas) — não
      // pode virar cache compartilhado: serviria o HTML de iOS pra quem não
      // é iOS, ou o genérico pra quem é. no-store é a garantia real (Vary
      // sozinho não impede CDNs que ignoram a chave); os dois juntos,
      // redundantes de propósito.
      headers['cache-control'] = 'private, no-store';
      headers['vary'] = 'User-Agent';
    } else {
      // Só crawler: conteúdo (tags OG) não varia pela identidade do bot
      // específico, então cache público e compartilhado continua seguro,
      // como já era.
      headers['cache-control'] = 'public, s-maxage=300, stale-while-revalidate=600';
    }

    return new Response(rewritten, { status: 200, headers });
  } catch {
    // Fail-open absoluto: qualquer erro não previsto no pipeline nunca deve
    // derrubar a página pra um usuário real — deixa o roteamento normal seguir,
    // sem nenhum fetch adicional (mesmo mecanismo do fast path acima).
    return next();
  }
}
