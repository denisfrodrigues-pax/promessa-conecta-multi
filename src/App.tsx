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
import KidsLayout from "@/components/layout/KidsLayout";
import AppLayout from "@/components/layout/AppLayout";

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

// App Home
import AppHome from "@/pages/app/AppHome";

// Kids Panel Pages
import KidsCheckinPanel from "@/pages/kids/KidsCheckinPanel";

// Leader Pages
import LeaderDashboard from "@/pages/leader/Dashboard";
import LeaderBases from "@/pages/leader/Bases";
import LeaderBaseDetalhes from "@/pages/leader/LeaderBaseDetalhes";
import LeaderRelatorios from "@/pages/leader/Relatorios";
import LeaderEscalas from "@/pages/leader/Escalas";
import LeaderMinhaEquipe from "@/pages/leader/MinhaEquipe";
import LeaderMinhasFuncoes from "@/pages/leader/MinhasFuncoes";
import LeaderNotificacoes from "@/pages/leader/Notificacoes";

// Admin placeholder pages
import AdminAuditoria from "@/pages/admin/Auditoria";
import AdminConfiguracoes from "@/pages/admin/Configuracoes";
import WhatsAppTest from "@/pages/admin/WhatsAppTest";

import NotFound from "./pages/NotFound";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          {/* Home - accessible to all (shows different content based on auth state) */}
          <Route path="/" element={<Index />} />
          
          {/* Auth - for unauthenticated users */}
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          
          {/* Semi-public Routes - accessible to all */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<InstallPWA />} />
          <Route path="/sou-novo" element={<SouNovo />} />
          <Route path="/contribuicoes" element={<Contribuicoes />} />
          
          {/* Institutional Pages - public */}
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

          {/* ==================== AUTHENTICATED ROUTES ==================== */}
          
          {/* App Routes - All authenticated member pages under /app */}
          <Route path="/app" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }>
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
          </Route>

          {/* Legacy redirects - redirect old paths to new /app/* paths */}
          <Route path="/home" element={<Navigate to="/app" replace />} />
          <Route path="/minha-base" element={<Navigate to="/app/minha-base" replace />} />
          <Route path="/bases" element={<Navigate to="/app/bases" replace />} />
          <Route path="/bases/:id" element={<Navigate to="/app/bases/:id" replace />} />
          <Route path="/eventos" element={<Navigate to="/app/eventos" replace />} />
          <Route path="/eventos/:id" element={<Navigate to="/app/eventos/:id" replace />} />
          <Route path="/avisos" element={<Navigate to="/app/avisos" replace />} />
          <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
          <Route path="/oracao" element={<Navigate to="/app/oracao" replace />} />
          <Route path="/minhas-escalas" element={<Navigate to="/app/escalas" replace />} />
          <Route path="/historico-escalas" element={<Navigate to="/app/historico-escalas" replace />} />
          <Route path="/notificacoes" element={<Navigate to="/app/notificacoes" replace />} />
          <Route path="/financeiro/minhas-contribuicoes" element={<Navigate to="/app/contribuicoes" replace />} />

          {/* Admin Routes - only admin and financeiro */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin', 'financeiro']}>
              <AdminLayout />
            </PrivateRoute>
          }>
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
            <Route path="kids/relatorio" element={<KidsRelatorio />} />
            {/* Financeiro Routes */}
            <Route path="financeiro" element={<FinanceiroDashboard />} />
            <Route path="financeiro/transacoes" element={<Transacoes />} />
            <Route path="financeiro/transacoes/novo" element={<TransacaoForm />} />
            <Route path="financeiro/transacoes/:id" element={<TransacaoForm />} />
            <Route path="financeiro/contas" element={<Contas />} />
            <Route path="financeiro/categorias" element={<Categorias />} />
            <Route path="financeiro/relatorios" element={<FinanceiroRelatorio />} />
            <Route path="financeiro/auditoria" element={<FinanceiroAuditoria />} />
            {/* Relatorios Routes */}
            <Route path="relatorios" element={<RelatorioGeral />} />
            <Route path="relatorios/visitantes" element={<RelatorioVisitantes />} />
            <Route path="relatorios/bases" element={<RelatorioBases />} />
            <Route path="relatorios/membros" element={<RelatorioMembros />} />
            <Route path="relatorios/financeiro" element={<RelatorioFinanceiro />} />
            <Route path="relatorios/kids" element={<RelatorioKids />} />
            <Route path="relatorios/comunicacoes" element={<RelatorioComunicacoes />} />
            <Route path="auditoria" element={<AdminAuditoria />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
            <Route path="whatsapp-test" element={<WhatsAppTest />} />
          </Route>

          {/* Leader Routes - only lider */}
          <Route path="/leader" element={
            <PrivateRoute allowedRoles={['lider', 'admin']}>
              <LeaderLayout />
            </PrivateRoute>
          }>
            <Route index element={<LeaderDashboard />} />
            <Route path="dashboard" element={<LeaderDashboard />} />
            <Route path="bases" element={<LeaderBases />} />
            <Route path="bases/:id" element={<LeaderBaseDetalhes />} />
            <Route path="escalas" element={<LeaderEscalas />} />
            <Route path="equipe" element={<LeaderMinhaEquipe />} />
            <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
            <Route path="notificacoes" element={<LeaderNotificacoes />} />
            <Route path="relatorios" element={<LeaderRelatorios />} />
          </Route>

          {/* Kids Panel Routes - admin, lider, voluntario */}
          <Route path="/kids" element={
            <PrivateRoute allowedRoles={['admin', 'lider', 'voluntario']}>
              <KidsLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/kids/check-in" replace />} />
            <Route path="check-in" element={<KidsCheckinPanel />} />
          </Route>

          {/* 404 - Show not found page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
