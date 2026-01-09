import { useAuth } from "@/contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute - Used for pages like /auth
 * 
 * This guard does NOT redirect authenticated users automatically.
 * The page itself (e.g., Auth.tsx) handles navigation after login.
 * This prevents guard interception of programmatic navigation.
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render children without redirect - page handles its own navigation
  return <>{children}</>;
};

export default PublicRoute;
