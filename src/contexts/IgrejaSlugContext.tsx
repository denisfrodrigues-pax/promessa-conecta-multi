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
  // churchId efetivo que o AuthContext está expondo no momento
  const { churchId: currentAuthChurchId } = useAuth();

  useEffect(() => {
    if (church?.id) {
      setChurchIdOverride(church.id);
    }
    return () => {
      setChurchIdOverride(null);
    };
  }, [church?.id, setChurchIdOverride]);

  // 4.1 — favicon dinâmico + título por igreja
  useEffect(() => {
    if (!church) return;
    console.log('[FAVICON DEBUG] church.nome:', church.nome, '| church.logo_url:', church.logo_url);

    // Título
    const prevTitle = document.title;
    document.title = `${church.nome} — Promessa Conecta`;

    if (church.logo_url) {
      // Tentar pegar o link específico da plataforma primeiro, depois qualquer icon link
      let link =
        (document.getElementById('favicon-default') as HTMLLinkElement | null) ??
        (document.querySelector("link[rel='icon']") as HTMLLinkElement | null);

      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.id = 'favicon-church';
        document.head.appendChild(link);
      }
      const prevHref = link.href;
      link.type = 'image/png';
      link.href = church.logo_url;
      console.log('[FAVICON DEBUG] set href to', church.logo_url);

      return () => {
        if (link) link.href = prevHref;
        document.title = prevTitle;
      };
    }

    return () => { document.title = prevTitle; };
  }, [church?.logo_url, church?.nome]);

  const value = useMemo<IgrejaSlugContextType>(() => ({
    slug: churchSlug,
    churchId: church?.id ?? null,
    churchNome: church?.nome ?? null,
    churchLoading: loading,
    p: (path: string) => `/i/${churchSlug}${path}`,
  }), [churchSlug, church, loading]);

  // Aguarda enquanto:
  // - church ainda carregando
  // - superadmin: useAuth().churchId ainda não recebeu o override correto
  //   Verifica o valor REAL em vez de usar overrideReady, eliminando a race condition
  //   onde overrideReady=true mas useAuth().churchId ainda não propagou.
  const shouldWait = loading || (isSuperAdmin && !!church?.id && currentAuthChurchId !== church.id);

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
