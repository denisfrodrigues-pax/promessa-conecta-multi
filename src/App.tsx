import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Route Guards
import PublicRoute from "@/components/routes/PublicRoute";
import PrivateRoute from "@/components/routes/PrivateRoute";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import LeaderLayout from "@/components/layout/LeaderLayout";
import LeaderMinisterioLayout from "@/components/layout/LeaderMinisterioLayout"; // ✅ ADICIONADO
import KidsLayout from "@/components/layout/KidsLayout";
import MinisterioLayout from "@/components/layout/MinisterioLayout";
import VoluntarioLayout from "@/components/layout/VoluntarioLayout";
import VolunteerMinisterioLayout from "@/components/layout/VolunteerMinisterioLayout";
import AppLayout from "@/components/layout/AppLayout";

// Auth
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import InstallPWA from "@/pages/InstallPWA";
import Index from "@/pages/Index";

// Leader Pages
import LeaderDashboard from "@/pages/leader/Dashboard";
import LeaderEntry from "@/pages/leader/LeaderEntry";
import LeaderHub from "@/pages/leader/LeaderHub";
import LeaderRelatorios from "@/pages/leader/Relatorios";
import LeaderEscalas from "@/pages/leader/Escalas";
import LeaderMinhaEquipe from "@/pages/leader/MinhaEquipe";
import LeaderMinhasFuncoes from "@/pages/leader/MinhasFuncoes";
import LeaderNotificacoes from "@/pages/leader/Notificacoes";

// Ministerio Modular
import MinisterioHome from "@/pages/ministerio/MinisterioHome";
import MinisterioModulo from "@/pages/ministerio/MinisterioModulo";

// Voluntário
import VoluntarioDashboard from "@/pages/voluntario/VoluntarioDashboard";
import VolunteerMinisterioDashboard from "@/pages/voluntario/VolunteerMinisterioDashboard";

// Kids
import KidsCheckinPanel from "@/pages/kids/KidsCheckinPanel";

// Outros
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          {/* ==================== PUBLIC ==================== */}
          <Route path="/" element={<Index />} />

          <Route
            path="/auth"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<InstallPWA />} />

          {/* ==================== APP (MEMBRO) ==================== */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />

          {/* ==================== LEADER HUB ==================== */}
          <Route
            path="/leader"
            element={
              <PrivateRoute allowedRoles={["lider", "admin"]}>
                <LeaderLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<LeaderEntry />} />
            <Route path="hub" element={<LeaderHub />} />
          </Route>

          {/* ==================== LEADER MINISTÉRIO (LAYOUT FIXO) ==================== */}
          <Route
            path="/leader/:slug"
            element={
              <PrivateRoute allowedRoles={["lider", "admin"]}>
                <LeaderMinisterioLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<LeaderDashboard />} />
            <Route path="equipe" element={<LeaderMinhaEquipe />} />
            <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
            <Route path="escalas" element={<LeaderEscalas />} />
            <Route path="relatorios" element={<LeaderRelatorios />} />
            <Route path="notificacoes" element={<LeaderNotificacoes />} />
          </Route>

          {/* ==================== VOLUNTÁRIO ==================== */}
          <Route
            path="/voluntario"
            element={
              <PrivateRoute allowedRoles={["voluntario", "admin", "lider"]}>
                <VoluntarioLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<VoluntarioDashboard />} />
          </Route>

          <Route
            path="/volunteer/:slug"
            element={
              <PrivateRoute allowedRoles={["voluntario", "admin", "lider"]}>
                <VolunteerMinisterioLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<VolunteerMinisterioDashboard />} />
          </Route>

          {/* ==================== KIDS ==================== */}
          <Route path="/kids" element={<KidsLayout />}>
            <Route index element={<Navigate to="/kids/check-in" replace />} />
            <Route path="check-in" element={<KidsCheckinPanel />} />
          </Route>

          {/* ==================== MINISTÉRIO MODULAR (MANTIDO) ==================== */}
          <Route
            path="/ministerio/:slug"
            element={
              <PrivateRoute allowedRoles={["admin", "lider", "voluntario"]}>
                <MinisterioLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<MinisterioHome />} />
            <Route path=":modulo" element={<MinisterioModulo />} />
          </Route>

          {/* ==================== 404 ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
