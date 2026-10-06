import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import middleware, { rewriteIosPwaTags } from './middleware';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const FACEBOOK_CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

// HTML mínimo com a forma exata que o build (vite-plugin-pwa / index.html)
// produz: manifest sem self-close, apple-* com self-close.
const SAMPLE_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta name="apple-mobile-web-app-title" content="Rede Conect" />
    <link rel="apple-touch-icon" href="/pwa-192x192.png" />
    <meta property="og:title" content="Rede Conect" />
  <link rel="manifest" href="/manifest.webmanifest"></head>
  <body><div id="root"></div></body>
</html>`;

describe('rewriteIosPwaTags (função pura)', () => {
  it('troca manifest, título apple e apple-touch-icon', () => {
    const out = rewriteIosPwaTags(SAMPLE_HTML, 'red', 'Igreja Red');
    expect(out).toContain('<link rel="manifest" href="/api/manifest/red">');
    expect(out).toContain('<meta name="apple-mobile-web-app-title" content="Igreja Red" />');
    expect(out).toContain('<link rel="apple-touch-icon" href="/api/manifest-icon/red?size=180&amp;purpose=apple" />');
  });

  it('tag de manifest ausente: não quebra, só não mexe nessa tag', () => {
    const semManifest = SAMPLE_HTML.replace('<link rel="manifest" href="/manifest.webmanifest">', '');
    const out = rewriteIosPwaTags(semManifest, 'red', 'Igreja Red');
    expect(out).not.toContain('rel="manifest"');
    // as outras duas tags continuam sendo trocadas normalmente
    expect(out).toContain('<meta name="apple-mobile-web-app-title" content="Igreja Red" />');
    expect(out).toContain('/api/manifest-icon/red?size=180&amp;purpose=apple');
  });
});

function mockFetchFor(options: { church: { nome: string } | null; indexHtml?: string }) {
  return vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes('/rest/v1/igrejas')) {
      return new Response(JSON.stringify(options.church ? [{ nome: options.church.nome, slogan: null, logo_url: null, cor_primaria: null }] : []), {
        status: 200,
      });
    }
    if (url.includes('/index.html')) {
      return new Response(options.indexHtml ?? SAMPLE_HTML, { status: 200, headers: { 'content-type': 'text/html' } });
    }
    throw new Error('fetch inesperado: ' + url);
  });
}

function req(path: string, userAgent: string) {
  return new Request(`https://promessa-conecta-multi.vercel.app${path}`, { headers: { 'user-agent': userAgent } });
}

describe('middleware (default export)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'anon-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('iOS com slug válido: reescreve manifest/título/ícone e não cacheia', async () => {
    const fetchMock = mockFetchFor({ church: { nome: 'Igreja Red' } });
    vi.stubGlobal('fetch', fetchMock);

    const res = await middleware(req('/i/red', IPHONE_UA));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('/api/manifest/red');
    expect(html).toContain('Igreja Red');
    expect(html).toContain('/api/manifest-icon/red?size=180&amp;purpose=apple');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('vary')).toBe('User-Agent');
  });

  it('UA não-iOS e não-crawler: fast path, next() sem nenhum fetch', async () => {
    const fetchMock = mockFetchFor({ church: { nome: 'Igreja Red' } });
    vi.stubGlobal('fetch', fetchMock);

    const res = await middleware(req('/i/red', ANDROID_UA));

    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('slug inexistente: fail-open, devolve o HTML original sem reescrever', async () => {
    const fetchMock = mockFetchFor({ church: null, indexHtml: SAMPLE_HTML });
    vi.stubGlobal('fetch', fetchMock);

    const res = await middleware(req('/i/nao-existe', IPHONE_UA));
    const html = await res.text();

    expect(html).toBe(SAMPLE_HTML);
    expect(html).toContain('/manifest.webmanifest');
  });

  it('crawler: continua reescrevendo as tags OG (comportamento existente)', async () => {
    const fetchMock = mockFetchFor({ church: { nome: 'Igreja Red' } });
    vi.stubGlobal('fetch', fetchMock);

    const res = await middleware(req('/i/red/publico', FACEBOOK_CRAWLER_UA));
    const html = await res.text();

    expect(html).toContain('<meta property="og:title" content="Igreja Red" />');
    // crawler não é iOS: as tags de PWA do iOS não são tocadas
    expect(html).toContain('/manifest.webmanifest');
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=300, stale-while-revalidate=600');
  });

  it('erro inesperado: fail-open absoluto (next(), sem propagar)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('rede fora do ar');
      })
    );

    const res = await middleware(req('/i/red', IPHONE_UA));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
