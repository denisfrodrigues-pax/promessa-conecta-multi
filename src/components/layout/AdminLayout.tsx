import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import AdminSidebar from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout() {
  const { user, loading, isAdmin, roles } = useAuth();
  const { p } = useIgrejaSlug();

  // superadmin tem acesso irrestrito a qualquer painel de igreja
  const canAccess = isAdmin || roles.includes('superadmin');

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={p('/login')} replace />;
  }

  if (!canAccess) {
    return <Navigate to={p('/app')} replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
