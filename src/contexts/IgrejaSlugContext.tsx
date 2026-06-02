import { createContext, useContext, useMemo, useEffect, useState, ReactNode } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useIgrejaBySlug } from '@/hooks/useIgrejaBySlug';
import { useAuth } from '@/contexts/AuthContext';

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
  const { setChurchIdOverride, roles } = useAuth();

  const isSuperAdmin = roles.includes('superadmin');

  // Rastreia se o override já foi commitado no AuthContext.
  // Em React 18, setChurchIdOverride e setOverrideReady são batched no mesmo
  // ciclo de render, garantindo que quando overrideReady=true, useAuth().churchId
  // já retorna o valor correto — filhos nunca veem churchId=null.
  const [overrideReady, setOverrideReady] = useState(false);

  useEffect(() => {
    if (church?.id) {
      setChurchIdOverride(church.id);  // atualiza AuthContext
      setOverrideReady(true);          // ambos batched → mesmo render
    }
    return () => {
      setChurchIdOverride(null);
      setOverrideReady(false);
    };
  }, [church?.id, setChurchIdOverride]);

  const value = useMemo<IgrejaSlugContextType>(() => ({
    slug: churchSlug,
    churchId: church?.id ?? null,
    churchNome: church?.nome ?? null,
    churchLoading: loading,
    p: (path: string) => `/i/${churchSlug}${path}`,
  }), [churchSlug, church, loading]);

  // Aguarda enquanto:
  // - church ainda carregando
  // - superadmin: override ainda não foi aplicado no AuthContext
  // Usuários normais não precisam esperar (seu churchId do profile já está correto)
  const shouldWait = loading || (isSuperAdmin && !overrideReady);

  if (shouldWait) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
