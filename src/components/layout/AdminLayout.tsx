import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout() {
  const { user, loading, isAdmin, roles } = useAuth();

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

  // Admin panel accessible by 'admin' and 'financeiro' roles
  // isAdmin already includes both roles
  if (!isAdmin) {
    return <Navigate to="/app" replace />;
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
