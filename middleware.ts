export const config = {
  matcher: ['/i/:slug', '/i/:slug/:path*'],
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const SITE_URL = 'https://promessa-conecta-multi.vercel.app';
const GENERIC_DESCRICAO = 'Plataforma de gestão eclesiástica para igrejas que crescem.';
const CACHE_TTL_MS = 5 * 60 * 1000;

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
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/igrejas?slug=eq.${encodeURIComponent(slug)}&select=nome,slogan,logo_url,cor_primaria&limit=1`,
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
    return null;
  }
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Só reescreve documentos de rota (HTML) — qualquer path com extensão é asset
  // (JS/CSS/imagens/etc.) e deve seguir direto, sem custo extra.
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return fetch(request);
  }

  const match = url.pathname.match(/^\/i\/([^/]+)/);
  const slug = match?.[1];
  if (!slug) {
    return fetch(request);
  }

  const church = await fetchChurch(slug);
  if (!church) {
    return fetch(request);
  }

  const response = await fetch(request);

  const rewritten = new HTMLRewriter()
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', church.nome);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', church.descricao);
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', church.imageUrl);
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', church.nome);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', church.descricao);
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', church.imageUrl);
      },
    })
    .transform(response);

  const headers = new Headers(rewritten.headers);
  headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers,
  });
}
