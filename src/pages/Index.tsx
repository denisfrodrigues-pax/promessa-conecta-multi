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
  Youtube, 
  Facebook, 
  Music2,
  Calendar,
  Users,
  Baby,
  Heart,
  HandHeart,
  Play,
  BookOpen,
  Newspaper,
  Smartphone,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import heroImage from "@/assets/hero-home.png";

// ============================================
// PLACEHOLDER DATA (preparado para dados dinâmicos)
// ============================================
const upcomingEvents = [
  {
    id: 1,
    title: "Culto de Celebração",
    date: "05 Jan",
    time: "18h30",
    description: "Venha celebrar conosco neste domingo especial."
  },
  {
    id: 2,
    title: "Noite de Oração",
    date: "08 Jan",
    time: "19h30",
    description: "Um momento especial de comunhão e oração."
  },
  {
    id: 3,
    title: "Encontro de Jovens",
    date: "12 Jan",
    time: "19h00",
    description: "Conecte-se com outros jovens da nossa comunidade."
  }
];

const messageSeries = [
  { id: 1, title: "Vida com Propósito", image: "/placeholder.svg" },
  { id: 2, title: "Família Abençoada", image: "/placeholder.svg" },
  { id: 3, title: "Fé que Transforma", image: "/placeholder.svg" },
  { id: 4, title: "O Poder da Oração", image: "/placeholder.svg" }
];

const newsItems = [
  {
    id: 1,
    title: "Reflexão da Semana",
    excerpt: "Descubra como aplicar os ensinamentos bíblicos no seu dia a dia...",
    date: "30 Dez 2024"
  },
  {
    id: 2,
    title: "Mensagem de Esperança",
    excerpt: "Em tempos difíceis, a fé nos sustenta e nos dá direção...",
    date: "23 Dez 2024"
  },
  {
    id: 3,
    title: "Vivendo em Comunidade",
    excerpt: "A importância de fazer parte de uma comunidade de fé...",
    date: "16 Dez 2024"
  }
];

const readingMaterials = [
  { id: 1, title: "Devocional Diário", description: "Leituras para fortalecer sua caminhada", icon: BookOpen },
  { id: 2, title: "Guia de Estudo Bíblico", description: "Aprofunde seu conhecimento da Palavra", icon: BookOpen },
  { id: 3, title: "Orações da Semana", description: "Direções para sua vida de oração", icon: Heart }
];

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
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        
        {/* Animated content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Subtitle - location */}
          <p 
            className="text-sm sm:text-base uppercase tracking-[0.3em] text-white/70 font-medium mb-4 opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]"
          >
            Hortolândia - SP
          </p>
          
          {/* Main title */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 drop-shadow-2xl opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]"
          >
            Igreja da Promessa
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-base sm:text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-[fadeIn_0.8s_ease-out_0.6s_forwards]"
          >
            Uma igreja para quem busca viver o evangelho de forma real, simples e transformadora.
          </p>

          {/* Single CTA */}
          <div 
            className="opacity-0 animate-[slideUp_0.8s_ease-out_0.8s_forwards]"
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

        {/* Scroll indicator */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ animation: "fadeIn 1s ease-out 1.2s forwards, float 3s ease-in-out 2.2s infinite", opacity: 0 }}
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2 animate-pulse-soft" />
          </div>
        </div>

        {/* Decorative gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
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
          SEÇÃO: NOSSOS CULTOS
      ============================================ */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-center text-foreground mb-12">
            Nossos Cultos
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Domingo</h3>
              <p className="text-muted-foreground text-sm mb-2">Culto de Celebração</p>
              <p className="text-promessa-600 font-semibold text-lg">18h30</p>
            </div>
            <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-promessa-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Quarta-feira</h3>
              <p className="text-muted-foreground text-sm mb-2">Culto de Oração</p>
              <p className="text-promessa-600 font-semibold text-lg">19h30</p>
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
          SEÇÃO: EVENTOS
      ============================================ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Próximos Eventos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Participe dos nossos encontros e fortaleça sua caminhada de fé
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {upcomingEvents.map((event) => (
              <Card 
                key={event.id} 
                className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-6">
                  {/* Date badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-promessa-600 text-white px-3 py-2 rounded-lg text-center min-w-[60px]">
                      <span className="text-sm font-semibold block">{event.date}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {event.time}
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-promessa-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-promessa-600 hover:text-promessa-700 hover:bg-promessa-50 p-0 h-auto font-medium group/btn"
                  >
                    Saiba mais 
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-promessa-300 text-promessa-700 hover:bg-promessa-50"
              asChild
            >
              <Link to="/eventos" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ver todos os eventos
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: CADASTROS
      ============================================ */}
      <section className="py-20 md:py-28 bg-muted/30">
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
                  <Link to="/cadastro-voluntario">Quero servir</Link>
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
                  Membros e Visitantes
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
          SEÇÃO: MENSAGENS / SÉRIES
      ============================================ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Séries de Mensagens
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Acompanhe nossas séries de ensinos e aprofunde seu conhecimento da Palavra
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-10">
            {messageSeries.map((series) => (
              <div 
                key={series.id}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-soft hover:shadow-elevated transition-all duration-300"
              >
                <img 
                  src={series.image} 
                  alt={series.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                  <h3 className="text-white font-display font-semibold text-center text-sm md:text-base">
                    {series.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-promessa-300 text-promessa-700 hover:bg-promessa-50"
              asChild
            >
              <Link to="/mensagens" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Ver todas as séries
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: NOTÍCIAS / REFLEXÕES
      ============================================ */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Notícias e Reflexões
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Reflexões semanais para inspirar sua caminhada de fé
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {newsItems.map((item) => (
              <Card 
                key={item.id}
                className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
                    <Newspaper className="w-3.5 h-3.5" />
                    {item.date}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-promessa-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {item.excerpt}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-promessa-600 hover:text-promessa-700 hover:bg-promessa-50 p-0 h-auto font-medium group/btn"
                  >
                    Ler mais 
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-promessa-300 text-promessa-700 hover:bg-promessa-50"
              asChild
            >
              <Link to="/noticias" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Ver todas as notícias
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: LEITURAS
      ============================================ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Leituras e Devocionais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Materiais para fortalecer sua vida espiritual
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {readingMaterials.map((material) => (
              <Card 
                key={material.id}
                className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 cursor-pointer"
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-promessa-100 flex items-center justify-center flex-shrink-0 group-hover:bg-promessa-200 transition-colors">
                    <material.icon className="w-6 h-6 text-promessa-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-promessa-600 transition-colors">
                      {material.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {material.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: APLICATIVO
      ============================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-700 text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 mx-auto md:mx-0">
                <Smartphone className="w-7 h-7" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
                Baixe nosso App
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Tenha a Igreja da Promessa na palma da sua mão. Acesse escalas, eventos, avisos e muito mais pelo celular.
              </p>
              
              {/* App Store buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                  </svg>
                  Google Play
                </Button>
              </div>
            </div>
            
            {/* Phone mockup placeholder */}
            <div className="flex-shrink-0">
              <div className="w-48 h-96 bg-white/10 rounded-[2.5rem] border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs opacity-50">Em breve</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SEÇÃO: CONTATO E LOCALIZAÇÃO
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
                    Rua Exemplo, 123 - Centro<br />
                    Hortolândia - SP, 13188-000
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                  <p>(19) 99999-9999</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                  <p>contato@igrejadapromessa.com.br</p>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-8">
                <a
                  href="https://instagram.com/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-promessa-600" />
                </a>
                <a
                  href="https://youtube.com/@igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-promessa-600" />
                </a>
                <a
                  href="https://open.spotify.com/user/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="Spotify"
                >
                  <Music2 className="w-5 h-5 text-promessa-600" />
                </a>
                <a
                  href="https://facebook.com/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-promessa-600" />
                </a>
              </div>
            </div>
            
            {/* Map placeholder */}
            <div className="bg-muted rounded-2xl h-64 md:h-80 flex items-center justify-center border border-border">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="opacity-60">Mapa em breve</p>
              </div>
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
              <div className="flex gap-3">
                <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors" aria-label="YouTube">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Spotify">
                  <Music2 className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/quem-somos" className="hover:text-white transition-colors">Quem Somos</Link></li>
                <li><Link to="/eventos" className="hover:text-white transition-colors">Eventos</Link></li>
                <li><Link to="/bases" className="hover:text-white transition-colors">Bases</Link></li>
                <li><Link to="/contribuicoes" className="hover:text-white transition-colors">Contribuir</Link></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  (19) 99999-9999
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  contato@igrejadapromessa.com.br
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
