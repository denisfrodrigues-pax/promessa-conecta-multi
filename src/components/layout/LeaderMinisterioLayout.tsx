import { useEffect, useState } from "react";
import { Outlet, Navigate, NavLink as RouterNavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Users, ClipboardList, CalendarDays, Bell, BarChart3, Home, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaderNotifications } from "@/hooks/useLeaderNotifications";

interface MinisterioInfo {
  id: string;
  nome: string;
}

export default function LeaderMinisterioLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading, profile, isLider } = useAuth();
  const { unreadCount } = useLeaderNotifications();
  const [ministerio, setMinisterio] = useState<MinisterioInfo | null>(null);
  const [loadingMin, setLoadingMin] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !slug) return;

    const fetch = async () => {
      setLoadingMin(true);
      setError(false);

      // Get ministry by slug where user is active leader
      const { data: vinculo, error: errV } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id, ministerios!ministerio_voluntarios_ministerio_id_fkey(id, nome, slug)")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (errV || !vinculo) {
        setError(true);
        setLoadingMin(false);
        return;
      }

      const match = vinculo.find((v: any) => {
        const m = v.ministerios;
        return m && m.slug === slug;
      });

      if (!match) {
        // Admin fallback: try direct lookup
        const { data: adm } = await supabase
          .from("ministerios")
          .select("id, nome")
          .eq("slug", slug)
          .eq("ativo", true)
          .maybeSingle();

        if (adm) {
          setMinisterio({ id: adm.id, nome: adm.nome });
        } else {
          setError(true);
        }
        setLoadingMin(false);
        return;
      }

      const m = (match as any).ministerios;
      setMinisterio({ id: m.id, nome: m.nome });
      setLoadingMin(false);
    };

    fetch();
  }, [user, authLoading, slug]);

  if (authLoading || loadingMin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isLider) return <Navigate to="/app" replace />;

  if (error || !ministerio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ministério não encontrado</h2>
          <p className="text-muted-foreground">Você não tem acesso a este ministério ou ele não existe.</p>
          <Button asChild variant="outline">
            <RouterNavLink to="/leader/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Hub
            </RouterNavLink>
          </Button>
        </div>
      </div>
    );
  }

  const basePath = `/leader/${slug}`;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: ClipboardList, label: "Funções", path: `${basePath}/funcoes` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to="/leader/hub" className="flex items-center gap-3">
              <Logo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-promessa-700">{ministerio.nome}</h1>
              <p className="text-xs text-neutral-500">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to="/leader/hub">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Hub
              </RouterNavLink>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to="/app">
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>

        <div className="container mx-auto px-4 pb-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors whitespace-nowrap"
                activeClassName="bg-promessa-100 text-promessa-700 font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                {item.showBadge && unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-promessa-500 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet context={{ ministerioId: ministerio.id, ministerioNome: ministerio.nome }} />
      </main>
    </div>
  );
}
