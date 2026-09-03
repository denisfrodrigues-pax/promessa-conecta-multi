import { supabase } from '@/integrations/supabase/client';

/**
 * Helpers para substituir o padrão N+1 recorrente no projeto:
 *   Promise.all(items.map(async item => supabase.from(t).select(...).eq(fk, item.id)))
 * (uma query por linha da lista) por uma única query com `.in()`, agrupando
 * o resultado em memória. Usam `supabase as any` de propósito — o nome da
 * tabela/coluna é dinâmico por chamador, o mesmo padrão já usado em outros
 * pontos do projeto (ex.: GruposHub.tsx) para consultas assim.
 */

/** Conta linhas de `table` agrupadas por `fkColumn`, para uma lista de ids. */
export async function fetchCountsByIds(
  table: string,
  fkColumn: string,
  ids: string[],
  extraFilters?: (query: any) => any,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;

  let query = (supabase as any).from(table).select(fkColumn).in(fkColumn, ids);
  if (extraFilters) query = extraFilters(query);
  const { data } = await query;

  for (const row of (data ?? []) as Record<string, string>[]) {
    const key = row[fkColumn];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Busca uma linha de `table` por id, para uma lista de ids — retorna um Map id -> linha. */
export async function fetchByIds<T = any>(
  table: string,
  ids: string[],
  select: string,
): Promise<Map<string, T>> {
  const map = new Map<string, T>();
  if (ids.length === 0) return map;

  const { data } = await (supabase as any).from(table).select(select).in('id', ids);
  for (const row of (data ?? []) as any[]) {
    map.set(row.id, row as T);
  }
  return map;
}

/** Busca todas as linhas de `table` agrupadas por `fkColumn` (relação 1-N) — retorna um Map id -> linhas[]. */
export async function groupByIds<T = any>(
  table: string,
  fkColumn: string,
  ids: string[],
  select: string,
): Promise<Map<string, T[]>> {
  const map = new Map<string, T[]>();
  if (ids.length === 0) return map;

  const { data } = await (supabase as any).from(table).select(select).in(fkColumn, ids);
  for (const row of (data ?? []) as any[]) {
    const key = row[fkColumn];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row as T);
  }
  return map;
}
