import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated, redirect to auth with current path as redirect
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // Check if user has required role (if specified)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on their actual role
      if (roles.includes('admin') || roles.includes('financeiro')) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (roles.includes('lider')) {
        return <Navigate to="/leader/dashboard" replace />;
      }
      if (roles.includes('voluntario')) {
        return <Navigate to="/kids/check-in" replace />;
      }
      return <Navigate to="/app" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
