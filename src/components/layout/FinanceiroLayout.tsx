import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import FinanceiroSidebar from './FinanceiroSidebar';
import { Loader2 } from 'lucide-react';

export default function FinanceiroLayout() {
  const { user, loading, roles } = useAuth();
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

  if (roles.includes('admin')) {
    return <Navigate to={p('/admin/dashboard')} replace />;
  }

  if (!roles.includes('financeiro')) {
    return <Navigate to={p('/app')} replace />;
  }

  // User has financeiro role but not admin - show financeiro panel

  return (
    <div className="min-h-screen flex w-full bg-background">
      <FinanceiroSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
