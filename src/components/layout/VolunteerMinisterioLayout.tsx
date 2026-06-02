import { useEffect, useState } from "react";
import { Outlet, Navigate, NavLink as RouterNavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { NavLink } from "@/components/NavLink";
import { Home, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MinisterioInfo {
  id: string;
  nome: string;
  papel: string;
  filosofia_pdf: string | null;
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
        filosofia_pdf: null,
      });
      setLoadingMin(false);
      return;
    }

    // Admin fallback: direct lookup when user is admin but not in myMinistries
    if (isAdmin) {
      supabase
        .from("ministerios")
        .select("id, nome, filosofia_pdf")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMinisterio({
              id: data.id,
              nome: data.nome,
              papel: "admin",
              filosofia_pdf: (data as any).filosofia_pdf ?? null,
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

  if (authLoading || myMinistriesLoading || loadingMin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to={p('/login')} replace />;
  if (!isVoluntario && !isAdmin) return <Navigate to={p('/app')} replace />;
  if (noAccess || !ministerio) return <Navigate to={p('/voluntario')} replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to={p('/voluntario')} className="flex items-center gap-3">
              <Logo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-foreground">{ministerio.nome}</h1>
              <p className="text-xs text-muted-foreground">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <RouterNavLink to={p('/voluntario')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hub
              </RouterNavLink>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <RouterNavLink to={p('/app')}>
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet context={{ ministerioId: ministerio.id, ministerioNome: ministerio.nome, papel: ministerio.papel, filosofiaPdf: ministerio.filosofia_pdf }} />
      </main>
    </div>
  );
}
