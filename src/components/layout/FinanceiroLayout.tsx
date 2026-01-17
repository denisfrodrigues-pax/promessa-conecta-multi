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

  // Financeiro layout only for 'financeiro' role (not admin)
  const isFinanceiroOnly = roles.includes('financeiro') && !roles.includes('admin');
  
  if (!isFinanceiroOnly) {
    // Admin users should use AdminLayout
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <FinanceiroSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
