import { useEffect, useState } from "react";
import { Outlet, Navigate, NavLink as RouterNavLink, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaConfig } from "@/hooks/useIgrejaConfig";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/ChurchLogo";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, CalendarDays, Bell, BarChart3,
  FolderOpen, Home, Loader2, ArrowLeft, Music2, ListMusic, UserCheck, History,
  Baby, ClipboardCheck, MessageCircle, BookOpenCheck, GraduationCap, Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaderNotifications } from "@/hooks/useLeaderNotifications";

interface MinisterioInfo {
  id: string;
  nome: string;
  tipo: string | null;
}

export default function LeaderMinisterioLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading, profile, isLider } = useAuth();
  const { nomeModulo } = useIgrejaConfig();
  const { p, churchId } = useIgrejaSlug();
  const { unreadCount } = useLeaderNotifications();
  const [ministerio, setMinisterio] = useState<MinisterioInfo | null>(null);
  const [loadingMin, setLoadingMin] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !slug || !churchId) return;

    const fetch = async () => {
      setLoadingMin(true);
      setError(false);

      // Get ministry by slug where user is active leader
      const { data: vinculo, error: errV } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id, ministerios!ministerio_voluntarios_ministerio_id_fkey(id, nome, slug, tipo)")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (errV || !vinculo) {
        setError(true);
        setLoadingMin(false);
        return;
      }

      interface VinculoItem {
        ministerio_id: string;
        ministerios: { id: string; nome: string; slug: string; tipo: string | null } | null;
      }

      const match = (vinculo as unknown as VinculoItem[]).find((v) => v.ministerios?.slug === slug);

      if (!match) {
        // Admin fallback: busca direta pelo ministério, escopada pela igreja
        // do usuário — slug não é globalmente único (constraint real é
        // composta church_id+slug; toda igreja nova recebe os mesmos slugs
        // fixos via fn_seed_nova_igreja), só filtrar por slug faz
        // .maybeSingle() falhar assim que duas igrejas tiverem o mesmo slug.
        const { data: adm } = await (supabase as any)
          .from("ministerios")
          .select("id, nome, tipo")
          .eq("slug", slug)
          .eq("church_id", churchId)
          .eq("ativo", true)
          .maybeSingle();

        if (adm) {
          setMinisterio({ id: adm.id, nome: adm.nome, tipo: adm.tipo ?? null });
        } else {
          setError(true);
        }
        setLoadingMin(false);
        return;
      }

      const m = match.ministerios!;
      setMinisterio({ id: m.id, nome: m.nome, tipo: m.tipo ?? null });
      setLoadingMin(false);
    };

    fetch();
  }, [user, authLoading, slug, churchId]);

  if (authLoading || loadingMin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to={p('/login')} replace />;
  if (!isLider) return <Navigate to={p('/app')} replace />;

  if (error || !ministerio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-stone-900">Ministério não encontrado</h2>
          <p className="text-stone-500 leading-relaxed">Você não tem acesso a este ministério ou ele não existe.</p>
          <Button asChild variant="outline" className="rounded-xl min-h-[44px]">
            <RouterNavLink to={p('/leader/hub')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Hub
            </RouterNavLink>
          </Button>
        </div>
      </div>
    );
  }

  const basePath = p(`/leader/${slug}`);

  const defaultNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
  ];

  const musicaNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: ListMusic, label: `Escala de ${nomeModulo.culto}s`, path: `${basePath}/escala-culto` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Music2, label: "Repertório", path: `${basePath}/repertorio` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const celebracaoNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: CalendarDays, label: `${nomeModulo.culto}s`, path: `${basePath}/cultos` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const recepcaoNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: UserCheck, label: "Visitantes do Dia", path: `${basePath}/visitantes-dia` },
    { icon: History, label: "Histórico", path: `${basePath}/visitantes` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const mcaNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: GraduationCap, label: "Gestão", path: `${basePath}/kids` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const ensinoNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: GraduationCap, label: nomeModulo.escolaBiblica, path: `${basePath}/escola-biblica` },
    { icon: Users, label: "Turmas", path: `${basePath}/turmas` },
    { icon: BookOpenCheck, label: "Espaço do Professor", path: `${basePath}/planos` },
    { icon: ClipboardCheck, label: "Chamada", path: `${basePath}/chamada` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const pequenosGruposNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: basePath, end: true },
    { icon: Network, label: nomeModulo.bases, path: `${basePath}/grupos` },
    { icon: CalendarDays, label: "Escalas", path: `${basePath}/escalas` },
    { icon: Users, label: "Equipe", path: `${basePath}/equipe` },
    { icon: BarChart3, label: "Relatórios", path: `${basePath}/relatorios` },
    { icon: FolderOpen, label: "Documentos", path: `${basePath}/documentos` },
    { icon: Bell, label: "Notificações", path: `${basePath}/notificacoes`, showBadge: true },
  ];

  const navBySlug: Record<string, typeof defaultNavItems> = {
    musica: musicaNavItems,
    celebracao: celebracaoNavItems,
    recepcao: recepcaoNavItems,
    mca: mcaNavItems,
    ensino: ensinoNavItems,
    'pequenos-grupos': pequenosGruposNavItems,
  };

  const navItems = navBySlug[ministerio.tipo ?? ''] ?? defaultNavItems;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to={p('/leader/hub')} className="flex items-center gap-3">
              <ChurchLogo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-promessa-700">{ministerio.nome}</h1>
              <p className="text-xs text-stone-500">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Button asChild variant="ghost" size="sm" className="rounded-xl min-h-[44px] text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to={p('/leader/hub')}>
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Hub</span>
              </RouterNavLink>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl min-h-[44px] text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to={p('/app')}>
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">App</span>
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
                className="relative flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50 transition-colors whitespace-nowrap"
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

      <main className="container mx-auto px-4 py-8">
        <Outlet context={{ ministerioId: ministerio.id, ministerioNome: ministerio.nome, ministerioTipo: ministerio.tipo }} />
      </main>
    </div>
  );
}
