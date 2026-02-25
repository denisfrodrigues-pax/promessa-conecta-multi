import { useEffect, useState } from "react";
import { Outlet, Navigate, NavLink as RouterNavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { NavLink } from "@/components/NavLink";
import { Home, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import moduleRegistry from "@/config/moduleRegistry";

interface MinisterioInfo {
  id: string;
  nome: string;
  papel: string;
  filosofia_pdf: string | null;
}

export default function VolunteerMinisterioLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading, profile, isVoluntario, roles } = useAuth();
  const [ministerio, setMinisterio] = useState<MinisterioInfo | null>(null);
  const [loadingMin, setLoadingMin] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (authLoading || !user || !slug) return;

    const fetchMinistry = async () => {
      setLoadingMin(true);
      setNoAccess(false);

      // Get user's active ministry links
      const { data: vinculos, error: errV } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id, papel, ministerios!ministerio_voluntarios_ministerio_id_fkey(id, nome, slug, filosofia_pdf)")
        .eq("user_id", user.id)
        .eq("ativo", true);

      if (!errV && vinculos) {
        const match = vinculos.find((v: any) => v.ministerios?.slug === slug);
        if (match) {
          const m = (match as any).ministerios;
          setMinisterio({ id: m.id, nome: m.nome, papel: (match as any).papel, filosofia_pdf: m.filosofia_pdf ?? null });
          setLoadingMin(false);
          return;
        }
      }

      // Admin fallback: direct lookup
      if (isAdmin) {
        const { data: adm } = await supabase
          .from("ministerios")
          .select("id, nome, filosofia_pdf")
          .eq("slug", slug)
          .eq("ativo", true)
          .maybeSingle();

        if (adm) {
          setMinisterio({ id: adm.id, nome: adm.nome, papel: "admin", filosofia_pdf: adm.filosofia_pdf ?? null });
          setLoadingMin(false);
          return;
        }
      }

      setNoAccess(true);
      setLoadingMin(false);
    };

    fetchMinistry();
  }, [user, authLoading, slug, isAdmin]);

  if (authLoading || loadingMin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isVoluntario && !isAdmin) return <Navigate to="/app" replace />;
  if (noAccess || !ministerio) return <Navigate to="/voluntario" replace />;

  const basePath = `/volunteer/${slug}`;

  // Nav items (currently empty — tabs are inside the dashboard page)
  const navItems: { icon: any; label: string; path: string; end: boolean }[] = [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to="/voluntario" className="flex items-center gap-3">
              <Logo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-foreground">{ministerio.nome}</h1>
              <p className="text-xs text-muted-foreground">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <RouterNavLink to="/voluntario">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hub
              </RouterNavLink>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <RouterNavLink to="/app">
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>

        {navItems.length > 0 && (
          <div className="container mx-auto px-4 pb-2">
            <nav className="flex gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet context={{ ministerioId: ministerio.id, ministerioNome: ministerio.nome, papel: ministerio.papel, filosofiaPdf: ministerio.filosofia_pdf }} />
      </main>
    </div>
  );
}
