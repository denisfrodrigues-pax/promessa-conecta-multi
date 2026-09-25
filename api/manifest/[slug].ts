import { fetchIgreja, isValidSlug, slugFromPath, HEX_RE } from '../_lib/igreja';

export const config = { runtime: 'edge' };

const GENERIC_MANIFEST_PATH = '/manifest.webmanifest';
const GENERIC_COR = '#020F1E'; // mesmo theme/background do manifest genérico (vite.config.ts)
const GENERIC_DESCRICAO = 'Sistema completo de gestão eclesiástica para organizar, acompanhar e crescer em comunidade.';

// Fail-safe: slug inválido, igreja inexistente ou qualquer falha → devolve o
// manifest genérico gerado pelo vite-plugin-pwa (mesmo espírito do middleware
// de OG). Redirect em vez de proxy: evita um segundo fetch interno (e os
// problemas de Deployment Protection descritos no middleware.ts). Cache curto
// pra uma igreja recém-criada não ficar presa no genérico.
function genericFallback(request: Request): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL(GENERIC_MANIFEST_PATH, request.url).toString(),
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}

export default async function handler(request: Request) {
  try {
    const slug = slugFromPath(request);
    if (!isValidSlug(slug)) return genericFallback(request);

    const igreja = await fetchIgreja(slug);
    if (!igreja) return genericFallback(request);

    const cor = igreja.cor_primaria && HEX_RE.test(igreja.cor_primaria) ? igreja.cor_primaria : GENERIC_COR;
    const base = `/i/${igreja.slug}/`;

    // Ícones: o logo da igreja é guardado como um único arquivo (frequentemente
    // SVG em data URI), sem os tamanhos de PWA — o endpoint manifest-icon
    // rasteriza pra PNG nos tamanhos exigidos. Sem logo utilizável, mantém os
    // ícones genéricos da plataforma (mesmos arquivos do manifest genérico).
    const temLogo = !!igreja.logo_url && /^(https?:\/\/|data:image\/)/i.test(igreja.logo_url);
    const icon = (size: number, purpose: 'any' | 'maskable') =>
      temLogo
        ? { src: `/api/manifest-icon/${igreja.slug}?size=${size}&purpose=${purpose}`, sizes: `${size}x${size}`, type: 'image/png', purpose }
        : { src: `/pwa-${purpose === 'maskable' ? 'maskable-' : ''}${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose };

    const manifest = {
      id: base,
      name: igreja.nome,
      short_name: igreja.nome,
      description: igreja.slogan?.trim() || GENERIC_DESCRICAO,
      lang: 'pt-BR',
      theme_color: cor,
      background_color: cor,
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: base,
      start_url: base,
      icons: [icon(192, 'any'), icon(512, 'any'), icon(192, 'maskable'), icon(512, 'maskable')],
      categories: ['productivity', 'utilities'],
    };

    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'content-type': 'application/manifest+json; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return genericFallback(request);
  }
}
