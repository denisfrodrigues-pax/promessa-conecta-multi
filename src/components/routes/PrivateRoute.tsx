import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/** Extrai o slug de igreja da URL se estiver dentro de /i/:churchSlug/... */
function extractChurchSlug(pathname: string): string | null {
  const m = pathname.match(/^\/i\/([^/]+)/);
  return m ? m[1] : null;
}

/** Pra onde mandar um usuário (não-superadmin) dentro da própria igreja, conforme o papel. */
function homePathForRoles(roles: UserRole[], slug: string): string {
  if (roles.includes('admin'))      return `/i/${slug}/admin/dashboard`;
  if (roles.includes('financeiro')) return `/i/${slug}/financeiro`;
  if (roles.includes('lider'))      return `/i/${slug}/leader/hub`;
  if (roles.includes('voluntario')) return `/i/${slug}/voluntario`;
  return `/i/${slug}/app`;
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, roles, loading, churchId: myChurchId, churchSlug: myChurchSlug } = useAuth();
  const { churchId: urlChurchId } = useIgrejaSlug();
  const location = useLocation();

  const churchSlug = extractChurchSlug(location.pathname);
  const loginPath = churchSlug ? `/i/${churchSlug}/login` : '/';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${loginPath}?redirect=${redirectPath}`} replace />;
  }

  // superadmin bypassa qualquer verificação de role — acesso total
  if (roles.includes('superadmin')) {
    return <>{children}</>;
  }

  // O slug na URL não é o da igreja do usuário logado (ex: trocou manualmente
  // /i/convergencia/... por /i/radiacao/... estando logado como admin da
  // Convergência). churchId do useAuth já é sempre o da própria igreja pra
  // quem não é superadmin (ver AuthContext), então esse mismatch só pode vir
  // do slug — nunca deixar renderizar com a igreja errada, manda de volta
  // pra dentro da própria.
  if (myChurchId && urlChurchId && myChurchId !== urlChurchId) {
    return <Navigate to={myChurchSlug ? homePathForRoles(roles, myChurchSlug) : '/'} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      if (churchSlug) {
        return <Navigate to={homePathForRoles(roles, churchSlug)} replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
