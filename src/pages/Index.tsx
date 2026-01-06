import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Instagram, 
  Music2,
  Users,
  Baby,
  Heart,
  HandHeart,
  ArrowRight
} from "lucide-react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import heroImage from "@/assets/hero-home.png";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Institutional Header */}
      <InstitutionalHeader />

      {/* ============================================
          HERO SECTION
      ============================================ */}
      <section 
        className="relative flex flex-col items-center justify-center text-center min-h-screen pt-28 px-4 overflow-hidden"
      >
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Dark overlay - uniform, no fade to white */}
        <div className="absolute inset-0 bg-black/55" />
        
        {/* Animated content */}
        <div className="relative z-10 max-w-4xl mx-auto px-2">
          {/* Subtitle - location */}
          <p 
            className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/80 font-medium mb-4 opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]"
          >
            Hortolândia - SP
          </p>
          
          {/* Main title */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)] opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]"
          >
            Igreja da Promessa
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white font-normal max-w-xl sm:max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md opacity-0 animate-[fadeIn_0.8s_ease-out_0.6s_forwards]"
          >
            Uma igreja para quem busca viver o evangelho de forma real, simples e transformadora.
          </p>

          {/* CTAs */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-[slideUp_0.8s_ease-out_0.8s_forwards]"
          >
            <Button 
              size="xl" 
              className="group relative bg-white text-promessa-700 hover:bg-white/95 shadow-2xl transition-all duration-500 hover:shadow-white/20 hover:scale-105 active:scale-100 px-8 py-6 text-base font-semibold"
              asChild
            >
              <Link to="/sou-novo" className="flex items-center gap-2">
                Conheça a Igreja
                <Sparkles className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator - discreet */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0"
          style={{ animation: "fadeIn 1s ease-out 1.2s forwards, float 3s ease-in-out 2.2s infinite" }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: QUEM SOMOS (RESUMO)
      ============================================ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Section title */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground mb-12">
              Quem Somos
            </h2>
            
            {/* Mission & Vision cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Mission */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">Nossa Missão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  "Existimos para Amar e Servir a Deus e as pessoas através de um relacionamento crescente com Jesus."
                </p>
              </div>
              
              {/* Vision */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">Nossa Visão</h3>
                <p className="text-muted-foreground leading-relaxed">
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
                Conheça a Igreja
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: NOSSOS ENCONTROS
      ============================================ */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-center text-foreground mb-12">
            Nossos Encontros
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Sábado</h3>
              <p className="text-muted-foreground text-sm mb-2">Escola Bíblica</p>
              <p className="text-promessa-600 font-semibold text-lg">18:00</p>
            </div>
            <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Sábado</h3>
              <p className="text-muted-foreground text-sm mb-2">Culto de Celebração</p>
              <p className="text-promessa-600 font-semibold text-lg">19:07</p>
            </div>
            <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Bases</h3>
              <p className="text-muted-foreground text-sm mb-2">Grupos de Comunhão</p>
              <p className="text-promessa-600 font-semibold text-lg">Durante a semana</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: CADASTROS (FAÇA PARTE)
      ============================================ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Faça Parte
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Existem diversas formas de você fazer parte da nossa comunidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Voluntário */}
            <Card className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-promessa-200 transition-colors">
                  <HandHeart className="w-8 h-8 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  Seja um Voluntário
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Use seus dons e talentos para servir a Deus e às pessoas na nossa comunidade.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                  asChild
                >
                  <Link to="/seja-voluntario">Quero servir</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Membros e Visitantes */}
            <Card className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-promessa-200 transition-colors">
                  <Users className="w-8 h-8 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  Sou Novo
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Cadastre-se para fazer parte da nossa família e acompanhar as novidades.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                  asChild
                >
                  <Link to="/sou-novo">Cadastrar</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Cadastro Infantil */}
            <Card className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-promessa-200 transition-colors">
                  <Baby className="w-8 h-8 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  Cadastro Infantil
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Cadastre seus filhos para participarem das atividades do nosso ministério Kids.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-promessa-300 text-promessa-700 hover:bg-promessa-50"
                  asChild
                >
                  <Link to="/cadastro-infantil">Cadastrar criança</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: CONTRIBUIÇÕES
      ============================================ */}
      <section className="py-20 md:py-28 bg-promessa-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
              Contribuições
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              As contribuições são voluntárias e fazem parte da nossa missão de servir a Deus e às pessoas. 
              Cada oferta é usada para manter e expandir o trabalho da igreja em Hortolândia e região.
            </p>
            <Button 
              size="lg"
              className="bg-white text-promessa-700 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link to="/contribuicoes" className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Contribuir
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: VENHA NOS VISITAR
      ============================================ */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-6">
                Venha nos visitar
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-promessa-600" />
                  <p>
                    Rua Luiz Camilo de Camargo, 520 - Parque Gabriel<br />
                    Hortolândia - SP, 13186-612
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                  <p>(19) 99999-9999</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                  <p>contato@promessahortolandia.com.br</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1 flex-shrink-0 text-promessa-600" />
                  <div>
                    <p className="font-medium text-foreground">Horários dos cultos:</p>
                    <p>Sábados às 18:00 (Escola Bíblica) e 19:07 (Culto)</p>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-8">
                <a
                  href="https://instagram.com/promessahortolandia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-promessa-600" />
                </a>
                <a
                  href="https://open.spotify.com/user/promessahortolandia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="Spotify"
                >
                  <Music2 className="w-5 h-5 text-promessa-600" />
                </a>
              </div>
            </div>
            
            {/* Map */}
            <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.7!2d-47.21!3d-22.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDUyJzEyLjAiUyA0N8KwMTInMzYuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
                title="Localização da Igreja da Promessa"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
      ============================================ */}
      <footer className="py-12 bg-promessa-800 text-white/80">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div className="md:col-span-2">
              <h3 className="font-display font-semibold text-white text-lg mb-4">
                Igreja da Promessa Hortolândia
              </h3>
              <p className="text-sm leading-relaxed mb-4">
                Uma igreja para quem busca viver o evangelho de forma real, simples e transformadora.
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Rua Luiz Camilo de Camargo, 520 - Parque Gabriel, Hortolândia - SP
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (19) 99999-9999
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  contato@promessahortolandia.com.br
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <a href="https://instagram.com/promessahortolandia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://open.spotify.com/user/promessahortolandia" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Spotify">
                  <Music2 className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/quem-somos" className="hover:text-white transition-colors">Quem Somos</Link></li>
                <li><Link to="/bases-publicas" className="hover:text-white transition-colors">Bases</Link></li>
                <li><Link to="/trilha-amar-servir" className="hover:text-white transition-colors">Trilha Amar e Servir</Link></li>
                <li><Link to="/contribuicoes" className="hover:text-white transition-colors">Contribuir</Link></li>
              </ul>
            </div>
            
            {/* Horários */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">Horários</h4>
              <ul className="space-y-2 text-sm">
                <li>Sábado 18:00 - Escola Bíblica</li>
                <li>Sábado 19:07 - Culto de Celebração</li>
                <li>Bases - Durante a semana</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <Link to="/contato" className="hover:text-white transition-colors">Contato</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}