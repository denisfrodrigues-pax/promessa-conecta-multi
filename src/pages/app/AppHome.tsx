import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaConfig } from "@/hooks/useIgrejaConfig";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import {
  Heart,
  Sparkles,
  Clock,
  Users,
  ArrowRight,
  Calendar,
  BookOpen,
  Bell,
} from "lucide-react";
import DevocionaldaSemana from "@/components/app/DevocionaldaSemana";
import AniversariantesDoMes from "@/components/app/AniversariantesDoMes";

export default function AppHome() {
  const { profile, roles } = useAuth();
  const { config } = useIgrejaConfig();
  const { slug, p } = useIgrejaSlug();
  const isSuperAdmin = roles.includes('superadmin');
  const firstName = profile?.nome?.split(' ')[0] || 'membro';

  // Cultos dinâmicos a partir de cultos_config
  const cc = config?.cultos_config as Record<string, { ativo?: boolean; nome?: string; dia?: string; horario?: string; descricao?: string }> | null | undefined;
  const cultosAtivos = [
    cc?.escola_biblica?.ativo  !== false && cc?.escola_biblica  ? { nome: cc.escola_biblica.nome  ?? 'Escola Bíblica',    detalhe: cc.escola_biblica.descricao  ?? (cc.escola_biblica.dia  ? `${cc.escola_biblica.dia} ${cc.escola_biblica.horario}` : ''), icon: Clock } : null,
    cc?.culto_principal?.ativo !== false && cc?.culto_principal ? { nome: cc.culto_principal.nome ?? 'Culto de Celebração', detalhe: cc.culto_principal.descricao ?? (cc.culto_principal.dia ? `${cc.culto_principal.dia} ${cc.culto_principal.horario}` : ''), icon: Clock } : null,
    cc?.pequenos_grupos?.ativo !== false && cc?.pequenos_grupos ? { nome: cc.pequenos_grupos.nome  ?? 'Pequenos Grupos',    detalhe: cc.pequenos_grupos.descricao ?? '', icon: Users } : null,
  ].filter(Boolean) as { nome: string; detalhe: string; icon: typeof Clock }[];

  const missao = config?.missao ?? null;
  const visao  = config?.visao  ?? null;
  const nomeIgreja = config?.nome ?? 'Igreja';

  const quickActions = [
    { label: 'Minha Base', icon: Users,    href: p('/app/minha-base') },
    { label: 'Eventos',    icon: Calendar, href: p('/app/eventos') },
    { label: 'Devocionais',icon: BookOpen, href: p('/app/meu-ensino') },
    { label: 'Notificações',icon: Bell,   href: p('/app/notificacoes') },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ============================================
          HERO SECTION — compacto
      ============================================ */}
      <section className="relative py-8 md:py-10 px-4 bg-gradient-to-b from-promessa-50/50 to-background">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Olá, <span style={{ color: 'var(--color-primary)' }}>{firstName}</span>!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Você faz parte dessa missão. Bem-vindo(a), {nomeIgreja}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          AÇÕES RÁPIDAS
      ============================================ */}
      <section className="py-6 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                to={href}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: DEVOCIONAL DA SEMANA
      ============================================ */}
      <section className="py-10 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <DevocionaldaSemana />
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: ANIVERSARIANTES DO MÊS
      ============================================ */}
      <AniversariantesDoMes />

      {/* ============================================
          SEÇÃO: QUEM SOMOS (RESUMO)
      ============================================ */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-6 text-center">
              Quem Somos
            </h2>

            {/* Mission & Vision — borda esquerda com cor primária */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow duration-200"
                style={{ borderLeft: '4px solid var(--color-primary)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="text-sm font-semibold text-foreground">Nossa Missão</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {missao ? `"${missao}"` : 'Em breve'}
                </p>
              </div>

              <div
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-sm transition-shadow duration-200"
                style={{ borderLeft: '4px solid var(--color-primary)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="text-sm font-semibold text-foreground">Nossa Visão</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {visao ? `"${visao}"` : 'Em breve'}
                </p>
              </div>
            </div>

            {/* CTA — site público (5.5) */}
            <Button
              variant="outline"
              size="lg"
              className="group border-promessa-300 text-promessa-700 hover:bg-promessa-50 hover:border-promessa-400 hover:text-promessa-800 transition-all duration-300"
              asChild
            >
              <a href={`${window.location.origin}/i/${slug}/publico`} className="flex items-center gap-2">
                Conheça mais sobre a Igreja
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: NOSSOS ENCONTROS
      ============================================ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-center text-foreground mb-10">
            Nossos Encontros
          </h2>
          <div className={`grid gap-5 max-w-4xl mx-auto ${cultosAtivos.length === 2 ? 'md:grid-cols-2' : cultosAtivos.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-sm'}`}>
            {cultosAtivos.length > 0 ? cultosAtivos.map((c, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                  <c.icon className="w-6 h-6 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-2">{c.nome}</h3>
                <p className="text-promessa-600 font-semibold text-lg">{c.detalhe || 'A confirmar'}</p>
              </div>
            )) : (
              <div className="bg-card rounded-2xl p-6 text-center border border-border">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Horários em breve</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: CONTRIBUIÇÕES
      ============================================ */}
      <section className="py-16 md:py-20 bg-promessa-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-semibold mb-5">
              Contribuições
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-6 max-w-2xl mx-auto">
              As contribuições são voluntárias e fazem parte da nossa missão de servir a Deus e às pessoas.
              Cada oferta é usada para manter e expandir o trabalho da {nomeIgreja}.
            </p>
            <Button 
              size="lg"
              className="bg-white text-promessa-700 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link to="/app/contribuicoes" className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Contribuir
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5.3 — Painéis para superadmin */}
      {isSuperAdmin && (
        <section className="py-8 bg-amber-50 border-t border-amber-200">
          <div className="container mx-auto px-4 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">⚡ Acesso Super Admin</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100" asChild>
                <Link to={p('/admin/dashboard')}><LayoutDashboard className="h-4 w-4 mr-2" />Painel Admin da Igreja</Link>
              </Button>
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100" asChild>
                <Link to="/admin"><Building2 className="h-4 w-4 mr-2" />Super Admin</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Promessa Conecta © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
