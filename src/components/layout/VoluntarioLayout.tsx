import { Outlet, Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Home, Loader2 } from "lucide-react";
import { useChurchConfig } from "@/hooks/useChurchConfig";

const VoluntarioLayout = () => {
  const { signOut, profile, user, loading, isVoluntario } = useAuth();
  const { config } = useChurchConfig();
  const { p } = useIgrejaSlug();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(p('/login'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={p('/login')} replace />;
  }

  if (!isVoluntario) {
    return <Navigate to={p('/app')} replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm">Painel Voluntário</h1>
                <p className="text-xs text-muted-foreground">{config?.nome_igreja || "Igreja"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {profile.nome}
                </span>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to={p('/app')}>
                  <Home className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Início</span>
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

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default VoluntarioLayout;
