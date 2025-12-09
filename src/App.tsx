import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import MemberLayout from "@/components/layout/MemberLayout";
import LeaderLayout from "@/components/layout/LeaderLayout";

// Auth
import Auth from "@/pages/Auth";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsuarios from "@/pages/admin/Usuarios";
import AdminGrupos from "@/pages/admin/Grupos";
import AdminEventos from "@/pages/admin/Eventos";
import AdminAvisos from "@/pages/admin/Avisos";
import AdminEscalas from "@/pages/admin/Escalas";
import AdminMinisterios from "@/pages/admin/Ministerios";
import AdminVoluntariosMinisterios from "@/pages/admin/VoluntariosMinisterios";
import AdminFuncoesMinisterio from "@/pages/admin/FuncoesMinisterio";
import AdminNotificacoes from "@/pages/admin/Notificacoes";

// Member Pages
import MemberHome from "@/pages/member/Home";
import MemberGrupos from "@/pages/member/Grupos";
import MemberEventos from "@/pages/member/Eventos";
import MemberAvisos from "@/pages/member/Avisos";
import MemberPerfil from "@/pages/member/Perfil";
import SouNovo from "@/pages/member/SouNovo";
import Oracao from "@/pages/member/Oracao";
import MinhasEscalas from "@/pages/member/MinhasEscalas";
import MemberNotificacoes from "@/pages/member/Notificacoes";

// Leader Pages
import LeaderDashboard from "@/pages/leader/Dashboard";
import LeaderEscalas from "@/pages/leader/Escalas";
import LeaderMinhaEquipe from "@/pages/leader/MinhaEquipe";
import LeaderMinhasFuncoes from "@/pages/leader/MinhasFuncoes";
import LeaderNotificacoes from "@/pages/leader/Notificacoes";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="grupos" element={<AdminGrupos />} />
              <Route path="eventos" element={<AdminEventos />} />
              <Route path="avisos" element={<AdminAvisos />} />
              <Route path="ministerios" element={<AdminMinisterios />} />
              <Route path="voluntarios-ministerios" element={<AdminVoluntariosMinisterios />} />
              <Route path="funcoes-ministerio" element={<AdminFuncoesMinisterio />} />
              <Route path="escalas" element={<AdminEscalas />} />
              <Route path="notificacoes" element={<AdminNotificacoes />} />
              <Route path="infantil" element={<AdminDashboard />} />
              <Route path="auditoria" element={<AdminDashboard />} />
              <Route path="configuracoes" element={<AdminDashboard />} />
            </Route>

            {/* Leader Routes */}
            <Route path="/lider" element={<LeaderLayout />}>
              <Route index element={<LeaderDashboard />} />
              <Route path="grupos" element={<LeaderDashboard />} />
              <Route path="escalas" element={<LeaderEscalas />} />
              <Route path="equipe" element={<LeaderMinhaEquipe />} />
              <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
              <Route path="notificacoes" element={<LeaderNotificacoes />} />
              <Route path="relatorios" element={<LeaderDashboard />} />
            </Route>

            {/* Member Routes */}
            <Route element={<MemberLayout />}>
              <Route path="/" element={<MemberHome />} />
              <Route path="/grupos" element={<MemberGrupos />} />
              <Route path="/eventos" element={<MemberEventos />} />
              <Route path="/avisos" element={<MemberAvisos />} />
              <Route path="/perfil" element={<MemberPerfil />} />
              <Route path="/sou-novo" element={<SouNovo />} />
              <Route path="/oracao" element={<Oracao />} />
              <Route path="/minhas-escalas" element={<MinhasEscalas />} />
              <Route path="/notificacoes" element={<MemberNotificacoes />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
