import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Baby, LogOut, Home } from "lucide-react";
import { useChurchConfig } from "@/hooks/useChurchConfig";

const KidsLayout = () => {
  const { signOut, profile } = useAuth();
  const { config } = useChurchConfig();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header minimalista */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Baby className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground text-sm">Check-in Kids</h1>
                <p className="text-xs text-muted-foreground">{config?.nome_igreja || "Igreja"}</p>
              </div>
            </div>

            {/* User info e ações */}
            <div className="flex items-center gap-3">
              {profile && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {profile.nome}
                </span>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/home">
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

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default KidsLayout;
