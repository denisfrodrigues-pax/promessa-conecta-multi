import { Outlet, Navigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { ChurchLogo } from '@/components/ChurchLogo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LeaderLayout() {
  const { user, loading, profile, isLider } = useAuth();
  const { p } = useIgrejaSlug();

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

  if (!isLider) {
    return <Navigate to={p('/app')} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RouterNavLink to={p('/app')} className="flex items-center gap-3">
              <ChurchLogo size={40} />
            </RouterNavLink>
            <div>
              <h1 className="font-display font-bold text-promessa-700">Painel do Líder</h1>
              <p className="text-xs text-neutral-500">{profile?.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-promessa-700 hover:text-promessa-900 hover:bg-promessa-50">
              <RouterNavLink to={p('/app')}>
                <Home className="w-4 h-4 mr-2" />
                App
              </RouterNavLink>
            </Button>
            <UserAvatarMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
