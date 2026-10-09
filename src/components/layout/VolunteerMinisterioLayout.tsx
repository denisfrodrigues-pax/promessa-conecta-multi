import { useEffect, useState } from "react";
import { Outlet, Navigate, NavLink as RouterNavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/ChurchLogo";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { NavLink } from "@/components/NavLink";
import { Home, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MinisterioInfo {
  id: string;
  nome: string;
  papel: string;
}

export default function VolunteerMinisterioLayout() {
  const { slug } = useParams<{ slug: string }>();
  const {
    user, loading: authLoading, profile,
    isVoluntario, roles,
    myMinistries, myMinistriesLoading,
  } = useAuth();
  const { p } = useIgrejaSlug();
  const [ministerio, setMinisterio] = useState<MinisterioInfo | null>(null);
  const [loadingMin, setLoadingMin] = useState(true);
  const [noAccess, setNoAccess] = useState(false);
  // Permissões por função (mesma RPC/padrão de LeaderMinisterioLayout) — usado
  // por rotas-filhas que exigem uma função específica (ex.: Check-in do Kids,
  // mca.checkin.qualquer_sala), não só o papel líder/voluntário/admin.
  const [minhasPermissoes, setMinhasPermissoes] = useState<string[]>([]);
  // A RPC é assíncrona — sem este flag, uma guarda de rota-filha (ver
  // RequireVolunteerFuncaoPermissao) que lê minhasPermissoes na primeira
  // renderização vê [] (estado inicial, não "carregando") e redireciona antes
  // da resposta chegar. Entrar direto em /volunteer/mca/checkin (link, F5,
  // reload do quiosque) sempre voltava pro painel, mesmo com a permissão.
  const [permissoesCarregadas, setPermissoesCarregadas] = useState(false);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    // Wait for auth and myMinistries to finish loading
    if (authLoading || myMinistriesLoading || !user || !slug) return;

    // Primary: use already-loaded myMinistries from AuthContext (RPC runs with SECURITY DEFINER)
    const match = myMinistries.find((m) => m.slug === slug);
    if (match) {
      setMinisterio({
        id: match.ministerio_id,
        nome: match.nome,
        papel: match.papel ?? "voluntario",
      });
      setLoadingMin(false);
      return;
    }

    // Admin fallback: direct lookup when user is admin but not in myMinistries
    if (isAdmin) {
      supabase
        .from("ministerios")
        .select("id, nome")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMinisterio({
              id: data.id,
              nome: data.nome,
              papel: "admin",
            });
          } else {
            setNoAccess(true);
          }
          setLoadingMin(false);
        });
      return;
    }

    setNoAccess(true);
    setLoadingMin(false);
  }, [user, authLoading, myMinistries, myMinistriesLoading, slug, isAdmin]);

  useEffect(() => {
    // Reseta pra "carregando" a cada troca de ministério — sem isso, trocar
    // de /volunteer/mca pra /volunteer/musica manteria por um instante as
    // permissões (já carregadas) do ministério anterior.
    setPermissoesCarregadas(false);
    if (!ministerio?.id) {
      // Ministério ainda não resolveu (ou nunca resolve — "sem acesso" já é
      // tratado por noAccess/!ministerio logo abaixo, que redireciona antes
      // do Outlet/guarda sequer montarem). NUNCA marcar carregado aqui: como
      // este efeito e o de cima (resolve ministerio) rodam no mesmo lote de
      // commit no mount, marcar permissoesCarregadas=true neste ramo (mesmo
      // que só por um instante, com minhasPermissoes=[]) fica visível pra
      // guarda de rota antes da RPC real sequer começar — ela decide "sem
      // permissão" e redireciona cedo demais. Bug real, pego em teste.
      setMinhasPermissoes([]);
      return;
    }

    let cancelled = false;
    supabase
      .rpc('get_my_funcao_permissoes', { _ministerio_id: ministerio.id })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Fail-safe: trata como "carregado, sem permissões" — a guarda
          // nega acesso (comportamento mais seguro) em vez de travar a tela
          // de carregamento pra sempre.
          console.error('get_my_funcao_permissoes error:', error);
          setMinhasPermissoes([]);
        } else {
          setMinhasPermissoes(data ?? []);
        }
        setPermissoesCarregadas(true);
      });
    return () => { cancelled = true; };
  }, [ministerio?.id]);

  if (authLoading || myMinistriesLoading || loadingMin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to={p('/login')} replace />;
  if (!isVoluntario && !isAdmin) return <Navigate to={p('/app')} replace />;
  if (noAccess || !ministerio) return <Navigate to={p('/voluntario')} replace />;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to={p('/voluntario')} className="flex items-center gap-3">
              <ChurchLogo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-stone-900">{ministerio.nome}</h1>
              <p className="text-xs text-stone-500">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="rounded-xl min-h-[44px]">
              <RouterNavLink to={p('/voluntario')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hub
              </RouterNavLink>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl min-h-[44px]">
              <RouterNavLink to={p('/app')}>
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet context={{ ministerioId: ministerio.id, ministerioNome: ministerio.nome, papel: ministerio.papel, minhasPermissoes, permissoesCarregadas }} />
      </main>
    </div>
  );
}
