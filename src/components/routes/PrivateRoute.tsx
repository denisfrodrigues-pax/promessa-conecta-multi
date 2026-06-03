import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/** Extrai o slug de igreja da URL se estiver dentro de /i/:churchSlug/... */
function extractChurchSlug(pathname: string): string | null {
  const m = pathname.match(/^\/i\/([^/]+)/);
  return m ? m[1] : null;
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, roles, loading } = useAuth();
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

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      if (churchSlug) {
        if (roles.includes('admin'))      return <Navigate to={`/i/${churchSlug}/admin/dashboard`} replace />;
        if (roles.includes('financeiro')) return <Navigate to={`/i/${churchSlug}/financeiro`} replace />;
        if (roles.includes('lider'))      return <Navigate to={`/i/${churchSlug}/leader/hub`} replace />;
        if (roles.includes('voluntario')) return <Navigate to={`/i/${churchSlug}/voluntario`} replace />;
        return <Navigate to={`/i/${churchSlug}/app`} replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
