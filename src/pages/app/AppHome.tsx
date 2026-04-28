import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Sparkles,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";
import familiaPastoral from "@/assets/familia-pastoral.png";

export default function AppHome() {
  const { profile } = useAuth();
  const firstName = profile?.nome?.split(' ')[0] || 'membro';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ============================================
          HERO SECTION - Authenticated
      ============================================ */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 md:py-28 px-4 overflow-hidden">
        {/* Background with subtle image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${familiaPastoral})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-promessa-50/80 via-background/90 to-background" />
        
        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-4">
            Olá, <span className="text-promessa-600">{firstName}</span>!
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-normal max-w-xl mx-auto leading-relaxed">
            Você faz parte dessa missão. Juntos, amamos e servimos a Deus e às pessoas.
          </p>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: QUEM SOMOS (RESUMO)
      ============================================ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-semibold text-foreground mb-10">
              Quem Somos
            </h2>
            
            {/* Mission & Vision cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Mission */}
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-5">
                  <Heart className="w-6 h-6 text-promessa-600" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-3">Nossa Missão</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "Existimos para Amar e Servir a Deus e as pessoas através de um relacionamento crescente com Jesus."
                </p>
              </div>
              
              {/* Vision */}
              <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-6 h-6 text-promessa-600" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-3">Nossa Visão</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "Ser uma igreja consolidada, saudável, vibrante, relacional e relevante na cidade de Hortolândia/SP."
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Button 
              variant="outline" 
              size="lg"
              className="group border-promessa-300 text-promessa-700 hover:bg-promessa-50 hover:border-promessa-400 transition-all duration-300"
              asChild
            >
              <Link to="/quem-somos" className="flex items-center gap-2">
                Conheça mais sobre a Igreja
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
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
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-6 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-2">Sábado</h3>
              <p className="text-muted-foreground text-sm mb-2">Escola Bíblica</p>
              <p className="text-promessa-600 font-semibold text-lg">18:00</p>
            </div>
            <div className="bg-card rounded-2xl p-6 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-2">Sábado</h3>
              <p className="text-muted-foreground text-sm mb-2">Culto de Celebração</p>
              <p className="text-promessa-600 font-semibold text-lg">19:07</p>
            </div>
            <div className="bg-card rounded-2xl p-6 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground mb-2">Bases</h3>
              <p className="text-muted-foreground text-sm mb-2">Grupos de Comunhão</p>
              <p className="text-promessa-600 font-semibold text-lg">Durante a semana</p>
            </div>
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
              Cada oferta é usada para manter e expandir o trabalho da igreja em Hortolândia e região.
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

      {/* Footer */}
      <footer className="py-8 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
