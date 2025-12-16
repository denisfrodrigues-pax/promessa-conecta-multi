import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

const getRedirectByRole = (roles: UserRole[]): string => {
  if (roles.includes('admin')) return '/admin/dashboard';
  if (roles.includes('lider')) return '/leader/dashboard';
  return '/home';
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, roles, loading } = useAuth();

  // Show nothing while loading to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, redirect based on role
  if (user) {
    const redirectPath = getRedirectByRole(roles);
    return <Navigate to={redirectPath} replace />;
  }

  // Not authenticated, show the public page
  return <>{children}</>;
};

export default PublicRoute;
