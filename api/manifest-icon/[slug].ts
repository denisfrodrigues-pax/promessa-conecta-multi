import { ImageResponse } from '@vercel/og';
import { createElement } from 'react';
import { fetchIgreja, isValidSlug, slugFromPath, HEX_RE } from '../_lib/igreja.js';

export const config = { runtime: 'edge' };

const SIZES = new Set([192, 512]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TIMEOUT_MS = 3000;
// @vercel/og (satori) só decodifica estes formatos — webp/avif etc. cairiam em
// erro no meio do stream, então são recusados aqui e caem no ícone genérico.
const OK_MIME = /^image\/(png|jpeg|svg\+xml|gif)$/i;

const MAX_REDIRECTS = 3;

// Anti-SSRF: o endpoint é público, então só busca logos hospedados no storage
// público do próprio projeto Supabase (host de VITE_SUPABASE_URL, https).
// Qualquer outro host/esquema/credencial cai no ícone genérico sem fetch.
function isAllowedLogoUrl(raw: string): boolean {
  const base = process.env.VITE_SUPABASE_URL;
  if (!base) return false;
  try {
    const u = new URL(raw);
    return (
      u.protocol === 'https:' &&
      u.host === new URL(base).host &&
      !u.username &&
      !u.password &&
      u.pathname.startsWith('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

// Devolve o logo como data URI de um formato suportado, ou null.
async function resolveLogo(logoUrl: string): Promise<string | null> {
  if (logoUrl.startsWith('data:')) {
    const end = logoUrl.search(/[;,]/);
    const mime = logoUrl.slice(5, end);
    return OK_MIME.test(mime) ? logoUrl : null;
  }
  if (!isAllowedLogoUrl(logoUrl)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGO_TIMEOUT_MS);
  try {
    // Redirect manual: cada destino é revalidado contra a allowlist antes de ser
    // seguido, então um redirect não leva o servidor pra fora do storage.
    let target = logoUrl;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      res = await fetch(target, { signal: controller.signal, redirect: 'manual' });
      if (res.status < 300 || res.status >= 400) break;
      const location = res.headers.get('location');
      if (!location) return null;
      target = new URL(location, target).toString();
      if (!isAllowedLogoUrl(target)) return null;
      res = null;
    }
    if (!res || !res.ok) return null;
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!OK_MIME.test(mime)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_LOGO_BYTES) return null;
    return `data:${mime};base64,${toBase64(buf)}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function genericIcon(request: Request, size: number, purpose: string): Response {
  const file = `/pwa-${purpose === 'maskable' ? 'maskable-' : ''}${size}x${size}.png`;
  return new Response(null, {
    status: 302,
    headers: { location: new URL(file, request.url).toString(), 'cache-control': 'public, s-maxage=60' },
  });
}

export default async function handler(request: Request) {
  const params = new URL(request.url).searchParams;
  const size = Number(params.get('size'));
  const purpose = params.get('purpose') === 'maskable' ? 'maskable' : 'any';
  const safeSize = SIZES.has(size) ? size : 512;

  try {
    const slug = slugFromPath(request);
    if (!isValidSlug(slug)) return genericIcon(request, safeSize, purpose);
    const igreja = await fetchIgreja(slug);
    if (!igreja?.logo_url) return genericIcon(request, safeSize, purpose);
    const logo = await resolveLogo(igreja.logo_url);
    if (!logo) return genericIcon(request, safeSize, purpose);

    const cor = igreja.cor_primaria && HEX_RE.test(igreja.cor_primaria) ? igreja.cor_primaria : '#020F1E';
    // maskable: o SO recorta até ~40% do raio — logo precisa ficar na safe zone
    // (círculo central de 80%); "any" pode ocupar mais do quadro.
    const logoSize = Math.round(safeSize * (purpose === 'maskable' ? 0.56 : 0.76));

    return new ImageResponse(
      createElement(
        'div',
        { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: cor } },
        createElement('img', { src: logo, width: logoSize, height: logoSize, style: { objectFit: 'contain' } })
      ),
      {
        width: safeSize,
        height: safeSize,
        headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      }
    );
  } catch {
    return genericIcon(request, safeSize, purpose);
  }
}
