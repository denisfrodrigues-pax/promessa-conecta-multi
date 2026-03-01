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
import FinanceiroLayout from "@/components/layout/FinanceiroLayout";

// Auth
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import InstallPWA from "@/pages/InstallPWA";
import Index from "@/pages/Index";

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
import KidsRelatorio from "@/pages/admin/kids/KidsRelatorio";

// Financeiro Pages
import FinanceiroDashboard from "@/pages/admin/financeiro/FinanceiroDashboard";
import Transacoes from "@/pages/admin/financeiro/Transacoes";
import TransacaoForm from "@/pages/admin/financeiro/TransacaoForm";
import Contas from "@/pages/admin/financeiro/Contas";
import Categorias from "@/pages/admin/financeiro/Categorias";
import FinanceiroRelatorio from "@/pages/admin/financeiro/FinanceiroRelatorio";
import FinanceiroAuditoria from "@/pages/admin/financeiro/FinanceiroAuditoria";

// Relatorios Pages
import RelatorioGeral from "@/pages/admin/relatorios/RelatorioGeral";
import RelatorioVisitantes from "@/pages/admin/relatorios/RelatorioVisitantes";
import RelatorioBases from "@/pages/admin/relatorios/RelatorioBases";
import RelatorioMembros from "@/pages/admin/relatorios/RelatorioMembros";
import RelatorioFinanceiro from "@/pages/admin/relatorios/RelatorioFinanceiro";
import RelatorioKids from "@/pages/admin/relatorios/RelatorioKids";
import RelatorioComunicacoes from "@/pages/admin/relatorios/RelatorioComunicacoes";

// Member Pages
import MemberHome from "@/pages/member/Home";
import BasesPublic from "@/pages/member/BasesPublic";
import BaseDetalhesPublic from "@/pages/member/BaseDetalhesPublic";
import MinhaBase from "@/pages/member/MinhaBase";
import MemberEventos from "@/pages/member/Eventos";
import MemberEventoDetalhes from "@/pages/member/EventoDetalhes";
import MemberAvisos from "@/pages/member/Avisos";
import MemberPerfil from "@/pages/member/Perfil";
import SouNovo from "@/pages/member/SouNovo";
import Contribuicoes from "@/pages/Contribuicoes";
import Oracao from "@/pages/member/Oracao";
import MinhasEscalas from "@/pages/member/MinhasEscalas";
import HistoricoEscalas from "@/pages/member/HistoricoEscalas";
import MemberNotificacoes from "@/pages/member/Notificacoes";
import MinhasContribuicoes from "@/pages/member/MinhasContribuicoes";
import Contribuir from "@/pages/member/Contribuir";

// App Home
import AppHome from "@/pages/app/AppHome";
import VoluntariosDoDia from "@/pages/app/VoluntariosDoDia";

// Kids Panel
import KidsCheckinPanel from "@/pages/kids/KidsCheckinPanel";

// Ministerio Modular
import MinisterioHome from "@/pages/ministerio/MinisterioHome";
import MinisterioModulo from "@/pages/ministerio/MinisterioModulo";

// Voluntario Pages
import VoluntarioDashboard from "@/pages/voluntario/VoluntarioDashboard";
import VolunteerMinisterioDashboard from "@/pages/voluntario/VolunteerMinisterioDashboard";

// Leader Pages
import LeaderDashboard from "@/pages/leader/Dashboard";
import LeaderEntry from "@/pages/leader/LeaderEntry";
import LeaderHub from "@/pages/leader/LeaderHub";
import LeaderRelatorios from "@/pages/leader/Relatorios";
import LeaderEscalas from "@/pages/leader/Escalas";
import LeaderMinhaEquipe from "@/pages/leader/MinhaEquipe";
import LeaderMinhasFuncoes from "@/pages/leader/MinhasFuncoes";
import LeaderNotificacoes from "@/pages/leader/Notificacoes";

// Institutional Pages
import QuemSomos from "@/pages/institutional/QuemSomos";
import Contato from "@/pages/institutional/Contato";
import Teologia from "@/pages/institutional/quem-somos/Teologia";
import MissaoVisao from "@/pages/institutional/quem-somos/MissaoVisao";
import HistoriaPage from "@/pages/institutional/quem-somos/Historia";
import Pastores from "@/pages/institutional/quem-somos/Pastores";
import LideresMinisterios from "@/pages/institutional/quem-somos/LideresMinisterios";
import TrilhaAmarServir from "@/pages/institutional/TrilhaAmarServir";
import BasesPublicas from "@/pages/institutional/BasesPublicas";
import SejaVoluntario from "@/pages/institutional/SejaVoluntario";
import CadastroInfantil from "@/pages/institutional/CadastroInfantil";
import CheckinKids from "@/pages/institutional/CheckinKids";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          {/* PUBLIC */}
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
          <Route path="/sou-novo" element={<SouNovo />} />
          <Route path="/contribuicoes" element={<Contribuicoes />} />

          {/* INSTITUCIONAL */}
          <Route path="/quem-somos" element={<QuemSomos />} />
          <Route path="/quem-somos/teologia" element={<Teologia />} />
          <Route path="/quem-somos/missao-visao" element={<MissaoVisao />} />
          <Route path="/quem-somos/historia" element={<HistoriaPage />} />
          <Route path="/quem-somos/pastores" element={<Pastores />} />
          <Route path="/quem-somos/lideres-ministerios" element={<LideresMinisterios />} />
          <Route path="/trilha-amar-servir" element={<TrilhaAmarServir />} />
          <Route path="/bases-publicas" element={<BasesPublicas />} />
          <Route path="/seja-voluntario" element={<SejaVoluntario />} />
          <Route path="/cadastro-infantil" element={<CadastroInfantil />} />
          <Route path="/check-in-kids" element={<CheckinKids />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/contato/:section" element={<Contato />} />

          {/* APP MEMBRO */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AppHome />} />
            <Route path="home" element={<MemberHome />} />
            <Route path="minha-base" element={<MinhaBase />} />
            <Route path="bases" element={<BasesPublic />} />
            <Route path="bases/:id" element={<BaseDetalhesPublic />} />
            <Route path="eventos" element={<MemberEventos />} />
            <Route path="eventos/:id" element={<MemberEventoDetalhes />} />
            <Route path="avisos" element={<MemberAvisos />} />
            <Route path="perfil" element={<MemberPerfil />} />
            <Route path="oracao" element={<Oracao />} />
            <Route path="escalas" element={<MinhasEscalas />} />
            <Route path="historico-escalas" element={<HistoricoEscalas />} />
            <Route path="notificacoes" element={<MemberNotificacoes />} />
            <Route path="contribuicoes" element={<MinhasContribuicoes />} />
            <Route path="contribuir" element={<Contribuir />} />
            <Route path="voluntarios-do-dia" element={<VoluntariosDoDia />} />
          </Route>

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="eventos" element={<AdminEventos />} />
            <Route path="avisos" element={<AdminAvisos />} />
            <Route path="ministerios" element={<AdminMinisterios />} />
            <Route path="voluntarios-ministerios" element={<AdminVoluntariosMinisterios />} />
            <Route path="funcoes-ministerio" element={<AdminFuncoesMinisterio />} />
            <Route path="escalas" element={<AdminEscalas />} />
            <Route path="notificacoes" element={<AdminNotificacoes />} />
          </Route>

          {/* LEADER */}
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

            {/* ✅ MINISTÉRIO FIXO ANINHADO */}
            <Route path=":slug" element={<LeaderMinisterioLayout />}>
              <Route index element={<LeaderDashboard />} />
              <Route path="equipe" element={<LeaderMinhaEquipe />} />
              <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
              <Route path="escalas" element={<LeaderEscalas />} />
              <Route path="relatorios" element={<LeaderRelatorios />} />
              <Route path="notificacoes" element={<LeaderNotificacoes />} />
            </Route>
          </Route>

          {/* VOLUNTÁRIO */}
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

          {/* KIDS */}
          <Route path="/kids" element={<KidsLayout />}>
            <Route index element={<Navigate to="/kids/check-in" replace />} />
            <Route path="check-in" element={<KidsCheckinPanel />} />
          </Route>

          {/* MINISTÉRIO MODULAR */}
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
