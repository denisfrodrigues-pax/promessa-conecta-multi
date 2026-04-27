import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Route Guards
import PublicRoute from "@/components/routes/PublicRoute";
import PrivateRoute from "@/components/routes/PrivateRoute";
import RequireMinistry from "@/components/routes/RequireMinistry";

// Layouts (not lazy — needed immediately)
import AdminLayout from "@/components/layout/AdminLayout";
import LeaderLayout from "@/components/layout/LeaderLayout";
import LeaderMinisterioLayout from "@/components/layout/LeaderMinisterioLayout";
import KidsLayout from "@/components/layout/KidsLayout";
import MinisterioLayout from "@/components/layout/MinisterioLayout";
import VoluntarioLayout from "@/components/layout/VoluntarioLayout";
import VolunteerMinisterioLayout from "@/components/layout/VolunteerMinisterioLayout";
import AppLayout from "@/components/layout/AppLayout";
import FinanceiroLayout from "@/components/layout/FinanceiroLayout";

// ─── Lazy page imports ───────────────────────────────────────────────────────

// Auth
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const InstallPWA = lazy(() => import("@/pages/InstallPWA"));
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsuarios = lazy(() => import("@/pages/admin/Usuarios"));
const AdminEventos = lazy(() => import("@/pages/admin/Eventos"));
const AdminAvisos = lazy(() => import("@/pages/admin/Avisos"));
const AdminEscalas = lazy(() => import("@/pages/admin/Escalas"));
const AdminEscalasPeriodos = lazy(() => import("@/pages/admin/EscalasPeriodos"));
const AdminEscalasPeriodoDetalhe = lazy(() => import("@/pages/admin/EscalasPeriodoDetalhe"));
const AdminMinisterios = lazy(() => import("@/pages/admin/Ministerios"));
const AdminVoluntariosMinisterios = lazy(() => import("@/pages/admin/VoluntariosMinisterios"));
const AdminFuncoesMinisterio = lazy(() => import("@/pages/admin/FuncoesMinisterio"));
const AdminNotificacoes = lazy(() => import("@/pages/admin/Notificacoes"));
const AdminVisitantes = lazy(() => import("@/pages/admin/Visitantes"));
const AdminVisitanteDetalhes = lazy(() => import("@/pages/admin/VisitanteDetalhes"));
const AdminMembros = lazy(() => import("@/pages/admin/Membros"));
const AdminMembroNovo = lazy(() => import("@/pages/admin/MembroNovo"));
const AdminMembroDetalhes = lazy(() => import("@/pages/admin/MembroDetalhes"));
const AdminMembroRelatorio = lazy(() => import("@/pages/admin/MembroRelatorio"));
const AdminBases = lazy(() => import("@/pages/admin/Bases"));
const AdminBaseNova = lazy(() => import("@/pages/admin/BaseNova"));
const AdminBaseDetalhes = lazy(() => import("@/pages/admin/BaseDetalhes"));
const AdminBaseRelatorio = lazy(() => import("@/pages/admin/BaseRelatorio"));
const AdminAcompanhamento = lazy(() => import("@/pages/admin/Acompanhamento"));
const AdminAuditoria = lazy(() => import("@/pages/admin/Auditoria"));
const AdminConfiguracoes = lazy(() => import("@/pages/admin/Configuracoes"));
const WhatsAppTest = lazy(() => import("@/pages/admin/WhatsAppTest"));

// Admin — Kids
const KidsCheckins = lazy(() => import("@/pages/admin/kids/KidsCheckins"));
const KidsCheckinDetalhes = lazy(() => import("@/pages/admin/kids/KidsCheckinDetalhes"));
const KidsCriancas = lazy(() => import("@/pages/admin/kids/KidsCriancas"));
const KidsResponsaveis = lazy(() => import("@/pages/admin/kids/KidsResponsaveis"));
const KidsSalas = lazy(() => import("@/pages/admin/kids/KidsSalas"));
const KidsRelatorio = lazy(() => import("@/pages/admin/kids/KidsRelatorio"));

// Admin — Financeiro
const FinanceiroDashboard = lazy(() => import("@/pages/admin/financeiro/FinanceiroDashboard"));
const Transacoes = lazy(() => import("@/pages/admin/financeiro/Transacoes"));
const TransacaoForm = lazy(() => import("@/pages/admin/financeiro/TransacaoForm"));
const Contas = lazy(() => import("@/pages/admin/financeiro/Contas"));
const Categorias = lazy(() => import("@/pages/admin/financeiro/Categorias"));
const FinanceiroRelatorio = lazy(() => import("@/pages/admin/financeiro/FinanceiroRelatorio"));
const FinanceiroAuditoria = lazy(() => import("@/pages/admin/financeiro/FinanceiroAuditoria"));

// Admin — Relatórios
const RelatorioGeral = lazy(() => import("@/pages/admin/relatorios/RelatorioGeral"));
const RelatorioVisitantes = lazy(() => import("@/pages/admin/relatorios/RelatorioVisitantes"));
const RelatorioBases = lazy(() => import("@/pages/admin/relatorios/RelatorioBases"));
const RelatorioMembros = lazy(() => import("@/pages/admin/relatorios/RelatorioMembros"));
const RelatorioFinanceiro = lazy(() => import("@/pages/admin/relatorios/RelatorioFinanceiro"));
const RelatorioKids = lazy(() => import("@/pages/admin/relatorios/RelatorioKids"));
const RelatorioComunicacoes = lazy(() => import("@/pages/admin/relatorios/RelatorioComunicacoes"));

// Member
const MemberHome = lazy(() => import("@/pages/member/Home"));
const BasesPublic = lazy(() => import("@/pages/member/BasesPublic"));
const BaseDetalhesPublic = lazy(() => import("@/pages/member/BaseDetalhesPublic"));
const MinhaBase = lazy(() => import("@/pages/member/MinhaBase"));
const MemberEventos = lazy(() => import("@/pages/member/Eventos"));
const MemberEventoDetalhes = lazy(() => import("@/pages/member/EventoDetalhes"));
const MemberAvisos = lazy(() => import("@/pages/member/Avisos"));
const MemberPerfil = lazy(() => import("@/pages/member/Perfil"));
const SouNovo = lazy(() => import("@/pages/member/SouNovo"));
const Contribuicoes = lazy(() => import("@/pages/Contribuicoes"));
const Oracao = lazy(() => import("@/pages/member/Oracao"));
const MinhasEscalas = lazy(() => import("@/pages/member/MinhasEscalas"));
const HistoricoEscalas = lazy(() => import("@/pages/member/HistoricoEscalas"));
const MemberNotificacoes = lazy(() => import("@/pages/member/Notificacoes"));
const MinhasContribuicoes = lazy(() => import("@/pages/member/MinhasContribuicoes"));
const Contribuir = lazy(() => import("@/pages/member/Contribuir"));

// App
const AppHome = lazy(() => import("@/pages/app/AppHome"));
const VoluntariosDoDia = lazy(() => import("@/pages/app/VoluntariosDoDia"));

// Kids Panel
const KidsCheckinPanel = lazy(() => import("@/pages/kids/KidsCheckinPanel"));

// Ministério Modular
const MinisterioHome = lazy(() => import("@/pages/ministerio/MinisterioHome"));
const MinisterioModulo = lazy(() => import("@/pages/ministerio/MinisterioModulo"));
const MinisterioEscalas = lazy(() => import("@/pages/ministerio/MinisterioEscalas"));

// Voluntário
const VoluntarioDashboard = lazy(() => import("@/pages/voluntario/VoluntarioDashboard"));
const VolunteerMinisterioDashboard = lazy(() => import("@/pages/voluntario/VolunteerMinisterioDashboard"));

// Líder
const LeaderDashboard = lazy(() => import("@/pages/leader/Dashboard"));
const LeaderEntry = lazy(() => import("@/pages/leader/LeaderEntry"));
const LeaderHub = lazy(() => import("@/pages/leader/LeaderHub"));
const LeaderBases = lazy(() => import("@/pages/leader/Bases"));
const LeaderBaseDetalhes = lazy(() => import("@/pages/leader/LeaderBaseDetalhes"));
const LeaderRelatorios = lazy(() => import("@/pages/leader/Relatorios"));
const LeaderEscalas = lazy(() => import("@/pages/leader/Escalas"));
const LeaderMinhaEquipe = lazy(() => import("@/pages/leader/MinhaEquipe"));
const LeaderMinhasFuncoes = lazy(() => import("@/pages/leader/MinhasFuncoes"));
const LeaderNotificacoes = lazy(() => import("@/pages/leader/Notificacoes"));
const LeaderDocumentos = lazy(() => import("@/pages/leader/Documentos"));
const LeaderMusicaEscalaCulto = lazy(() => import("@/pages/leader/musica/EscalaCulto"));
const LeaderMusicaEscalaCultoDetalhe = lazy(() => import("@/pages/leader/musica/EscalaCultoDetalhe"));
const LeaderMusicaRepertorio = lazy(() => import("@/pages/leader/musica/Repertorio"));
const LeaderCelebracaoCultos = lazy(() => import("@/pages/leader/celebracao/Cultos"));
const LeaderCelebracaoCultoDetalhe = lazy(() => import("@/pages/leader/celebracao/CultoDetalhe"));
const LeaderRecepcaoVisitantesDia = lazy(() => import("@/pages/leader/recepcao/VisitantesDia"));
const LeaderRecepcaoVisitantesHistorico = lazy(() => import("@/pages/leader/recepcao/VisitantesHistorico"));
const LeaderMcaSalas = lazy(() => import("@/pages/leader/mca/Salas"));
const LeaderMcaCriancas = lazy(() => import("@/pages/leader/mca/Criancas"));
const LeaderMcaCheckin = lazy(() => import("@/pages/leader/mca/Checkin"));
const LeaderMcaPlanos = lazy(() => import("@/pages/leader/mca/Planos"));
const LeaderMcaPlanoDetalhe = lazy(() => import("@/pages/leader/mca/PlanoDetalhe"));
const LeaderMcaComunicacao = lazy(() => import("@/pages/leader/mca/Comunicacao"));
const LeaderEnsinoTurmas = lazy(() => import("@/pages/leader/ensino/Turmas"));
const LeaderEnsinoPlanos = lazy(() => import("@/pages/leader/ensino/Planos"));
const LeaderEnsinoPlanoDetalhe = lazy(() => import("@/pages/leader/ensino/PlanoDetalhe"));
const LeaderEnsinoChamada = lazy(() => import("@/pages/leader/ensino/Chamada"));

// Institucional
const QuemSomos = lazy(() => import("@/pages/institutional/QuemSomos"));
const Contato = lazy(() => import("@/pages/institutional/Contato"));
const Teologia = lazy(() => import("@/pages/institutional/quem-somos/Teologia"));
const MissaoVisao = lazy(() => import("@/pages/institutional/quem-somos/MissaoVisao"));
const HistoriaPage = lazy(() => import("@/pages/institutional/quem-somos/Historia"));
const Pastores = lazy(() => import("@/pages/institutional/quem-somos/Pastores"));
const LideresMinisterios = lazy(() => import("@/pages/institutional/quem-somos/LideresMinisterios"));
const TrilhaAmarServir = lazy(() => import("@/pages/institutional/TrilhaAmarServir"));
const BasesPublicas = lazy(() => import("@/pages/institutional/BasesPublicas"));
const SejaVoluntario = lazy(() => import("@/pages/institutional/SejaVoluntario"));
const CadastroInfantil = lazy(() => import("@/pages/institutional/CadastroInfantil"));
const CheckinKids = lazy(() => import("@/pages/institutional/CheckinKids"));

// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // dados frescos por 5 min — evita refetch em toda navegação
      gcTime: 1000 * 60 * 10,     // cache mantido 10 min após componente desmontar
      retry: 1,                    // 1 retry em erros de rede antes de falhar
      refetchOnWindowFocus: false, // não refaz query ao voltar para a aba
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-3 w-full max-w-sm px-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── PUBLIC ──────────────────────────────────────────────────── */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/install" element={<InstallPWA />} />
            <Route path="/sou-novo" element={<SouNovo />} />
            <Route path="/contribuicoes" element={<Contribuicoes />} />

            {/* ── INSTITUCIONAL ────────────────────────────────────────────── */}
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

            {/* ── APP MEMBRO ───────────────────────────────────────────────── */}
            <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
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

            {/* Redirects legados */}
            <Route path="/home" element={<Navigate to="/app/home" replace />} />
            <Route path="/minha-base" element={<Navigate to="/app/minha-base" replace />} />
            <Route path="/bases" element={<Navigate to="/app/bases" replace />} />
            <Route path="/eventos" element={<Navigate to="/app/eventos" replace />} />
            <Route path="/avisos" element={<Navigate to="/app/avisos" replace />} />
            <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
            <Route path="/oracao" element={<Navigate to="/app/oracao" replace />} />
            <Route path="/minhas-escalas" element={<Navigate to="/app/escalas" replace />} />
            <Route path="/notificacoes" element={<Navigate to="/app/notificacoes" replace />} />
            <Route path="/financeiro/minhas-contribuicoes" element={<Navigate to="/app/contribuicoes" replace />} />
            <Route path="/app/minhas-contribuicoes" element={<Navigate to="/app/contribuicoes" replace />} />

            {/* ── ADMIN ────────────────────────────────────────────────────── */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="eventos" element={<AdminEventos />} />
              <Route path="avisos" element={<AdminAvisos />} />
              <Route path="ministerios" element={<AdminMinisterios />} />
              <Route path="voluntarios-ministerios" element={<AdminVoluntariosMinisterios />} />
              <Route path="funcoes-ministerio" element={<AdminFuncoesMinisterio />} />
              <Route path="escalas" element={<AdminEscalas />} />
              <Route path="escalas/periodos" element={<AdminEscalasPeriodos />} />
              <Route path="escalas/periodos/:id" element={<AdminEscalasPeriodoDetalhe />} />
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
              {/* Kids */}
              <Route path="kids" element={<KidsCheckins />} />
              <Route path="kids/checkins" element={<KidsCheckins />} />
              <Route path="kids/checkins/:id" element={<KidsCheckinDetalhes />} />
              <Route path="kids/criancas" element={<KidsCriancas />} />
              <Route path="kids/responsaveis" element={<KidsResponsaveis />} />
              <Route path="kids/salas" element={<KidsSalas />} />
              <Route path="kids/relatorio" element={<KidsRelatorio />} />
              {/* Financeiro */}
              <Route path="financeiro" element={<FinanceiroDashboard />} />
              <Route path="financeiro/transacoes" element={<Transacoes />} />
              <Route path="financeiro/transacoes/novo" element={<TransacaoForm />} />
              <Route path="financeiro/transacoes/:id" element={<TransacaoForm />} />
              <Route path="financeiro/contas" element={<Contas />} />
              <Route path="financeiro/categorias" element={<Categorias />} />
              <Route path="financeiro/relatorios" element={<FinanceiroRelatorio />} />
              <Route path="financeiro/auditoria" element={<FinanceiroAuditoria />} />
              {/* Relatórios */}
              <Route path="relatorios" element={<RelatorioGeral />} />
              <Route path="relatorios/visitantes" element={<RelatorioVisitantes />} />
              <Route path="relatorios/bases" element={<RelatorioBases />} />
              <Route path="relatorios/membros" element={<RelatorioMembros />} />
              <Route path="relatorios/financeiro" element={<RelatorioFinanceiro />} />
              <Route path="relatorios/kids" element={<RelatorioKids />} />
              <Route path="relatorios/comunicacoes" element={<RelatorioComunicacoes />} />
              {/* Config & Audit */}
              <Route path="auditoria" element={<AdminAuditoria />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
              <Route path="whatsapp-test" element={<WhatsAppTest />} />
            </Route>

            {/* ── FINANCEIRO (role financeiro, não-admin) ───────────────────── */}
            <Route path="/financeiro" element={<PrivateRoute allowedRoles={["financeiro"]}><FinanceiroLayout /></PrivateRoute>}>
              <Route index element={<FinanceiroDashboard />} />
              <Route path="transacoes" element={<Transacoes />} />
              <Route path="transacoes/novo" element={<TransacaoForm />} />
              <Route path="transacoes/:id" element={<TransacaoForm />} />
              <Route path="contas" element={<Contas />} />
              <Route path="categorias" element={<Categorias />} />
              <Route path="relatorios" element={<FinanceiroRelatorio />} />
              <Route path="auditoria" element={<FinanceiroAuditoria />} />
            </Route>

            {/* ── LÍDER (hub) ──────────────────────────────────────────────── */}
            <Route path="/leader" element={<PrivateRoute allowedRoles={["lider", "admin"]}><LeaderLayout /></PrivateRoute>}>
              <Route index element={<LeaderEntry />} />
              <Route path="hub" element={<LeaderHub />} />
            </Route>

            {/* ── LÍDER (ministério específico) ────────────────────────────── */}
            <Route path="/leader/:slug" element={<PrivateRoute allowedRoles={["lider", "admin"]}><LeaderMinisterioLayout /></PrivateRoute>}>
              <Route index element={<LeaderDashboard />} />
              <Route path="equipe" element={<LeaderMinhaEquipe />} />
              <Route path="funcoes" element={<LeaderMinhasFuncoes />} />
              <Route path="escalas" element={<LeaderEscalas />} />
              <Route path="bases" element={<LeaderBases />} />
              <Route path="bases/:id" element={<LeaderBaseDetalhes />} />
              <Route path="notificacoes" element={<LeaderNotificacoes />} />
              <Route path="relatorios" element={<LeaderRelatorios />} />
              <Route path="documentos" element={<LeaderDocumentos />} />
              {/* Música */}
              <Route path="escala-culto" element={<LeaderMusicaEscalaCulto />} />
              <Route path="escala-culto/:eventoId" element={<LeaderMusicaEscalaCultoDetalhe />} />
              <Route path="repertorio" element={<LeaderMusicaRepertorio />} />
              {/* Celebração */}
              <Route path="cultos" element={<LeaderCelebracaoCultos />} />
              <Route path="cultos/:eventoId" element={<LeaderCelebracaoCultoDetalhe />} />
              {/* Recepção */}
              <Route path="visitantes-dia" element={<LeaderRecepcaoVisitantesDia />} />
              <Route path="visitantes" element={<LeaderRecepcaoVisitantesHistorico />} />
              {/* MCA */}
              <Route path="salas" element={<LeaderMcaSalas />} />
              <Route path="criancas" element={<LeaderMcaCriancas />} />
              <Route path="checkin" element={<LeaderMcaCheckin />} />
              <Route path="planos" element={<LeaderMcaPlanos />} />
              <Route path="planos/:planoId" element={<LeaderMcaPlanoDetalhe />} />
              <Route path="comunicacao" element={<LeaderMcaComunicacao />} />
              {/* Ensino */}
              <Route path="turmas" element={<LeaderEnsinoTurmas />} />
              <Route path="planos" element={<LeaderEnsinoPlanos />} />
              <Route path="planos/:planoId" element={<LeaderEnsinoPlanoDetalhe />} />
              <Route path="chamada" element={<LeaderEnsinoChamada />} />
            </Route>

            {/* ── VOLUNTÁRIO ───────────────────────────────────────────────── */}
            <Route path="/voluntario" element={<PrivateRoute allowedRoles={["voluntario", "admin", "lider"]}><VoluntarioLayout /></PrivateRoute>}>
              <Route index element={<VoluntarioDashboard />} />
            </Route>

            <Route path="/volunteer/:slug" element={<PrivateRoute allowedRoles={["voluntario", "admin", "lider"]}><VolunteerMinisterioLayout /></PrivateRoute>}>
              <Route index element={<VolunteerMinisterioDashboard />} />
            </Route>

            {/* ── KIDS PANEL ───────────────────────────────────────────────── */}
            <Route path="/kids" element={
              <PrivateRoute allowedRoles={["admin", "lider", "voluntario"]}>
                <RequireMinistry slug="kids"><KidsLayout /></RequireMinistry>
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/kids/check-in" replace />} />
              <Route path="check-in" element={<KidsCheckinPanel />} />
            </Route>

            {/* ── MINISTÉRIO MODULAR ───────────────────────────────────────── */}
            <Route path="/ministerio/:slug" element={<PrivateRoute allowedRoles={["admin", "lider", "voluntario"]}><MinisterioLayout /></PrivateRoute>}>
              <Route index element={<MinisterioHome />} />
              <Route path="escalas" element={<MinisterioEscalas />} />
              <Route path=":modulo" element={<MinisterioModulo />} />
            </Route>

            {/* ── 404 ──────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
