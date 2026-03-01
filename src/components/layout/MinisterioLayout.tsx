import { Suspense, useEffect, useState } from "react";
import { Outlet, Link, useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isModuleRegistered } from "@/config/moduleRegistry";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Loader2 } from "lucide-react";
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

type PapelMinisterial = "admin" | "lider" | "voluntario" | null;

const MinisterioLayout = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, roles, loading, signOut } = useAuth();
  const { config } = useChurchConfig();
  const navigate = useNavigate();

  const [ministerioId, setMinisterioId] = useState<string | null>(null);
  const [ministerioNome, setMinisterioNome] = useState<string>("");
  const [modulos, setModulos] = useState<MinisterioModulo[]>([]);
  const [papel, setPapel] = useState<PapelMinisterial>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!user || !profile || !slug) return;

    const loadMinisterio = async () => {
      setLoadingPage(true);

      // 1️⃣ Buscar ministério por slug + igreja
      const { data: ministerio, error } = await supabase
        .from("ministerios")
        .select("id, nome, igreja_id")
        .eq("slug", slug)
        .eq("igreja_id", profile.igreja_id)
        .eq("ativo", true)
        .maybeSingle();

      if (error || !ministerio) {
        setLoadingPage(false);
        return;
      }

      let papelUsuario: PapelMinisterial = null;

      // 2️⃣ Admin tem acesso total
      if (isAdmin) {
        papelUsuario = "admin";
      } else {
        // 3️⃣ Validar vínculo ativo
        const { data: vinculo } = await supabase
          .from("ministerio_usuarios")
          .select("papel")
          .eq("ministerio_id", ministerio.id)
          .eq("user_id", user.id)
          .eq("ativo", true)
          .maybeSingle();

        if (!vinculo) {
          toast({
            title: "Sem permissão",
            description: "Você não tem acesso a este ministério.",
            variant: "destructive",
          });
          setLoadingPage(false);
          navigate("/voluntario");
          return;
        }

        papelUsuario = vinculo.papel as PapelMinisterial;
      }

      setMinisterioId(ministerio.id);
      setMinisterioNome(ministerio.nome);
      setPapel(papelUsuario);

      // 4️⃣ Buscar módulos
      const { data: mods } = await supabase
        .from("ministerio_modulos")
        .select("id, modulo_slug, nome, descricao, icone, ordem")
        .eq("ministerio_id", ministerio.id)
        .eq("ativo", true)
        .order("ordem");

      setModulos(mods ?? []);
      setLoadingPage(false);
    };

    loadMinisterio();
  }, [slug, user, profile, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!ministerioId) {
    return <Navigate to="/voluntario" replace />;
  }

  const registeredModulos = modulos.filter((m) => isModuleRegistered(m.modulo_slug));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 h-14 flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-sm">{ministerioNome}</h1>
            <p className="text-xs text-muted-foreground">{config?.nome_igreja || "Igreja"}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={roles.includes("lider") ? "/leader/hub" : "/voluntario"}>
                <Home className="w-4 h-4 mr-1" />
                Hub
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        >
          <Outlet
            context={{
              ministerioId,
              ministerioNome,
              modulos: registeredModulos,
              papel,
              isAdmin,
            }}
          />
        </Suspense>
      </main>
    </div>
  );
};

export default MinisterioLayout;
