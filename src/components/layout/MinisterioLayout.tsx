import { Suspense, useEffect, useState } from "react";
import { Outlet, Link, useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getModuleDefinition, getIconByName, isModuleRegistered } from "@/config/moduleRegistry";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, LogOut, Loader2, ChevronRight } from "lucide-react";
import { useChurchConfig } from "@/hooks/useChurchConfig";
import { toast } from "@/components/ui/use-toast";

interface MinisterioModulo {
  id: string;
  modulo_slug: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
}

const MinisterioLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, roles, myMinistries, myMinistriesLoading, canMinistry, loading, signOut } = useAuth();
  const { config } = useChurchConfig();
  const navigate = useNavigate();

  const [modulos, setModulos] = useState<MinisterioModulo[]>([]);
  const [modulosLoading, setModulosLoading] = useState(true);
  const [ministerioId, setMinisterioId] = useState<string | null>(null);
  const [ministerioNome, setMinisterioNome] = useState<string>("");

  const isAdmin = roles.includes("admin");

  // Resolve ministry by slug
  useEffect(() => {
    if (myMinistriesLoading || loading) return;

    const ministry = myMinistries.find((m) => m.slug === slug);
    if (ministry) {
      setMinisterioId(ministry.ministerio_id);
      setMinisterioNome(ministry.nome);
    } else if (isAdmin && slug) {
      // Admins can access any ministry even if not in myMinistries
      supabase
        .from("ministerios")
        .select("id, nome")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMinisterioId(data.id);
            setMinisterioNome(data.nome);
          } else {
            setMinisterioId(null);
          }
        });
    } else {
      setMinisterioId(null);
    }
  }, [slug, myMinistries, myMinistriesLoading, loading, isAdmin]);

  // Fetch active modules for this ministry
  useEffect(() => {
    if (!ministerioId) {
      setModulosLoading(false);
      return;
    }

    setModulosLoading(true);
    supabase
      .from("ministerio_modulos")
      .select("id, modulo_slug, nome, descricao, icone, ordem")
      .eq("ministerio_id", ministerioId)
      .eq("ativo", true)
      .order("ordem")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching modules:", error);
          setModulos([]);
        } else {
          setModulos((data as MinisterioModulo[]) ?? []);
        }
        setModulosLoading(false);
      });
  }, [ministerioId]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Loading states
  if (loading || myMinistriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Access check
  if (!isAdmin) {
    const hasAccess = myMinistries.some((m) => m.slug === slug);
    if (!hasAccess) {
      toast({
        title: "Sem permissão",
        description: "Você não tem acesso a este ministério.",
        variant: "destructive",
      });
      return <Navigate to="/voluntario" replace />;
    }
  }

  // Ministry not found
  if (!modulosLoading && !ministerioId) {
    return <Navigate to="/voluntario" replace />;
  }

  // Filter to registered modules only
  const registeredModulos = modulos.filter((m) => isModuleRegistered(m.modulo_slug));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                {(() => {
                  const firstMod = modulos[0];
                  const Icon = getIconByName(firstMod?.icone);
                  return <Icon className="w-5 h-5 text-primary" />;
                })()}
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm">{ministerioNome}</h1>
                <p className="text-xs text-muted-foreground">{config?.nome_igreja || "Igreja"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile && <span className="text-sm text-muted-foreground hidden sm:inline">{profile.nome}</span>}

              {/* Module navigation tabs (when multiple modules) */}
              {registeredModulos.length > 1 && (
                <nav className="hidden md:flex items-center gap-1">
                  {registeredModulos.map((mod) => {
                    const Icon = getIconByName(mod.icone);
                    return (
                      <Button key={mod.id} variant="ghost" size="sm" asChild>
                        <Link to={`/ministerio/${slug}/${mod.modulo_slug}`}>
                          <Icon className="w-4 h-4 mr-1" />
                          {mod.nome}
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link to={roles.includes("lider") ? "/leader" : "/voluntario"}>
                  <Home className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Hub</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile module tabs */}
      {registeredModulos.length > 1 && (
        <div className="md:hidden bg-background border-b overflow-x-auto">
          <div className="flex px-4 gap-1 py-1">
            {registeredModulos.map((mod) => {
              const Icon = getIconByName(mod.icone);
              return (
                <Button key={mod.id} variant="ghost" size="sm" asChild className="whitespace-nowrap">
                  <Link to={`/ministerio/${slug}/${mod.modulo_slug}`}>
                    <Icon className="w-4 h-4 mr-1" />
                    {mod.nome}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {modulosLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
          >
            <Outlet context={{ ministerioId, ministerioNome, modulos: registeredModulos }} />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default MinisterioLayout;
