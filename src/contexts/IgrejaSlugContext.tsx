import { createContext, useContext, useMemo, ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useIgrejaBySlug } from '@/hooks/useIgrejaBySlug';

interface IgrejaSlugContextType {
  slug: string;
  churchId: string | null;
  churchNome: string | null;
  churchLoading: boolean;
  /** Retorna o caminho prefixado com /i/:slug. Ex: p('/app') → '/i/minha-igreja/app' */
  p: (path: string) => string;
}

const IgrejaSlugContext = createContext<IgrejaSlugContextType>({
  slug: '',
  churchId: null,
  churchNome: null,
  churchLoading: false,
  p: (path) => path,
});

/** Layout wrapper que provê o contexto de igreja por slug para todas as rotas filhas. */
export function IgrejaSlugLayout() {
  const { churchSlug = '' } = useParams<{ churchSlug: string }>();
  const { church, loading } = useIgrejaBySlug(churchSlug);

  const value = useMemo<IgrejaSlugContextType>(() => ({
    slug: churchSlug,
    churchId: church?.id ?? null,
    churchNome: church?.nome ?? null,
    churchLoading: loading,
    p: (path: string) => `/i/${churchSlug}${path}`,
  }), [churchSlug, church, loading]);

  return (
    <IgrejaSlugContext.Provider value={value}>
      <Outlet />
    </IgrejaSlugContext.Provider>
  );
}

/** Provider alternativo para quando se quer envolver JSX explicitamente (não via Outlet). */
export function IgrejaSlugProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const { church, loading } = useIgrejaBySlug(slug);

  const value = useMemo<IgrejaSlugContextType>(() => ({
    slug,
    churchId: church?.id ?? null,
    churchNome: church?.nome ?? null,
    churchLoading: loading,
    p: (path: string) => `/i/${slug}${path}`,
  }), [slug, church, loading]);

  return (
    <IgrejaSlugContext.Provider value={value}>
      {children}
    </IgrejaSlugContext.Provider>
  );
}

/** Acessa o contexto de slug de igreja. Retorna p() que prefixa /i/:slug automaticamente. */
export function useIgrejaSlug() {
  return useContext(IgrejaSlugContext);
}
