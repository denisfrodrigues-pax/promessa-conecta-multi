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
import AdminEventos from "@/pages/admin/Eventos";
import AdminAvisos from "@/pages/admin/Avisos";
import AdminEscalas from "@/pages/admin/Escalas";
import AdminMinisterios from "@/pages/admin/Ministerios";
import AdminVoluntariosMinisterios from "@/pages/admin/VoluntariosMinisterios";
import AdminFuncoesMinisterio from "@/pages/admin/FuncoesMinisterio";
import AdminNotificacoes from "@/pages/admin/Notificacoes";
import AdminVisitantes from "@/pages/admin/Visitantes";
import AdminVisitanteDetalhes from "@/pages/admin/VisitanteDetalhes";
import AdminMembros from "@/pages/admin/Membros";
import AdminMembroNovo from "@/pages/admin/MembroNovo";
import AdminMembroDetalhes from "@/pages/admin/MembroDetalhes";
import AdminMembroRelatorio from "@/pages/admin/MembroRelatorio";
import AdminBases from "@/pages/admin/Bases";
import AdminBaseNova from "@/pages/admin/BaseNova";
import AdminBaseDetalhes from "@/pages/admin/BaseDetalhes";
import AdminBaseRelatorio from "@/pages/admin/BaseRelatorio";
import AdminAcompanhamento from "@/pages/admin/Acompanhamento";
import KidsCheckins from "@/pages/admin/kids/KidsCheckins";
import KidsCheckinDetalhes from "@/pages/admin/kids/KidsCheckinDetalhes";
import KidsCriancas from "@/pages/admin/kids/KidsCriancas";
import KidsResponsaveis from "@/pages/admin/kids/KidsResponsaveis";
import KidsSalas from "@/pages/admin/kids/KidsSalas";

// Member Pages
import MemberHome from "@/pages/member/Home";
import BasesPublic from "@/pages/member/BasesPublic";
import BaseDetalhesPublic from "@/pages/member/BaseDetalhesPublic";
import MemberEventos from "@/pages/member/Eventos";
import MemberAvisos from "@/pages/member/Avisos";
import MemberPerfil from "@/pages/member/Perfil";
import SouNovo from "@/pages/member/SouNovo";
import Oracao from "@/pages/member/Oracao";
import MinhasEscalas from "@/pages/member/MinhasEscalas";
import HistoricoEscalas from "@/pages/member/HistoricoEscalas";
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
            
            {/* Public Routes */}
            <Route path="/sou-novo" element={<SouNovo />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="eventos" element={<AdminEventos />} />
              <Route path="avisos" element={<AdminAvisos />} />
              <Route path="ministerios" element={<AdminMinisterios />} />
              <Route path="voluntarios-ministerios" element={<AdminVoluntariosMinisterios />} />
              <Route path="funcoes-ministerio" element={<AdminFuncoesMinisterio />} />
              <Route path="escalas" element={<AdminEscalas />} />
              <Route path="notificacoes" element={<AdminNotificacoes />} />
              <Route path="visitantes" element={<AdminVisitantes />} />
              <Route path="visitantes/:id" element={<AdminVisitanteDetalhes />} />
              <Route path="membros" element={<AdminMembros />} />
              <Route path="membros/novo" element={<AdminMembroNovo />} />
              <Route path="membros/relatorio" element={<AdminMembroRelatorio />} />
              <Route path="membros/:id" element={<AdminMembroDetalhes />} />
              <Route path="bases" element={<AdminBases />} />
              <Route path="bases/nova" element={<AdminBaseNova />} />
              <Route path="bases/relatorio" element={<AdminBaseRelatorio />} />
              <Route path="bases/:id" element={<AdminBaseDetalhes />} />
              <Route path="acompanhamento" element={<AdminAcompanhamento />} />
              <Route path="kids" element={<KidsCheckins />} />
              <Route path="kids/checkin/:id" element={<KidsCheckinDetalhes />} />
              <Route path="kids/criancas" element={<KidsCriancas />} />
              <Route path="kids/responsaveis" element={<KidsResponsaveis />} />
              <Route path="kids/salas" element={<KidsSalas />} />
              <Route path="auditoria" element={<AdminDashboard />} />
              <Route path="configuracoes" element={<AdminDashboard />} />
            </Route>

            {/* Leader Routes */}
            <Route path="/lider" element={<LeaderLayout />}>
              <Route index element={<LeaderDashboard />} />
              <Route path="bases" element={<LeaderDashboard />} />
              <Route path="escalas" element={<LeaderEscalas />} />
              <Route path="equipe" element={<LeaderMinhaEquipe />} />
              <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
              <Route path="notificacoes" element={<LeaderNotificacoes />} />
              <Route path="relatorios" element={<LeaderDashboard />} />
            </Route>

            {/* Member Routes */}
            <Route element={<MemberLayout />}>
              <Route path="/" element={<MemberHome />} />
              <Route path="/bases" element={<BasesPublic />} />
              <Route path="/bases/:id" element={<BaseDetalhesPublic />} />
              <Route path="/eventos" element={<MemberEventos />} />
              <Route path="/avisos" element={<MemberAvisos />} />
              <Route path="/perfil" element={<MemberPerfil />} />
              <Route path="/oracao" element={<Oracao />} />
              <Route path="/minhas-escalas" element={<MinhasEscalas />} />
              <Route path="/historico-escalas" element={<HistoricoEscalas />} />
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
