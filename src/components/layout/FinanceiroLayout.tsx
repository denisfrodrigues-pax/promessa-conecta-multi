import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FinanceiroSidebar from './FinanceiroSidebar';
import { Loader2 } from 'lucide-react';

export default function FinanceiroLayout() {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is admin, redirect to admin panel (admin has full access there)
  if (roles.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }

  // If user doesn't have financeiro role at all, redirect to app
  if (!roles.includes('financeiro')) {
    return <Navigate to="/app" replace />;
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
