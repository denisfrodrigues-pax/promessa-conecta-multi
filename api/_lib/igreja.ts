// Leitura de dados de igreja por slug — mesma origem de dados (REST anônimo do
// Supabase, tabela igrejas) e mesmo espírito fail-open do middleware.ts de OG.
// Pasta _lib: prefixo "_" impede a Vercel de expor este arquivo como rota.

const SUPABASE_TIMEOUT_MS = 2000;

export type IgrejaPwa = {
  nome: string;
  slug: string;
  slogan: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
};

// Slugs reais são minúsculos com hífen; rejeitar qualquer outra forma antes de
// tocar no banco evita consulta inútil e qualquer surpresa no filtro PostgREST.
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function isValidSlug(slug: string | undefined | null): slug is string {
  return !!slug && SLUG_RE.test(slug);
}

export function slugFromPath(request: Request): string | undefined {
  const last = new URL(request.url).pathname.split('/').filter(Boolean).pop();
  return last ? decodeURIComponent(last) : undefined;
}

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function fetchIgreja(slug: string): Promise<IgrejaPwa | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isValidSlug(slug)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${url}/rest/v1/igrejas?slug=eq.${encodeURIComponent(slug)}&select=nome,slug,slogan,logo_url,cor_primaria&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Partial<IgrejaPwa>>;
    const row = rows[0];
    if (!row || !row.nome || !row.slug) return null;
    return {
      nome: row.nome,
      slug: row.slug,
      slogan: row.slogan ?? null,
      logo_url: row.logo_url ?? null,
      cor_primaria: row.cor_primaria ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
