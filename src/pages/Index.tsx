import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Users,
  Heart,
  HandHeart,
  ArrowRight,
  LayoutDashboard,
  MessageCircle,
  Globe,
} from "lucide-react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicIgreja } from "@/hooks/usePublicIgreja";

// Fallback hero local images (usados se a igreja não tiver fotos próprias)
import heroSlide1 from "@/assets/hero-slide-1.png";
import heroSlide2 from "@/assets/hero-slide-2.png";
import heroSlide3 from "@/assets/hero-slide-3.png";
import heroSlide4 from "@/assets/hero-slide-4.png";
import heroSlide5 from "@/assets/hero-slide-5.jpg";
import heroSlide6 from "@/assets/hero-slide-6.jpg";
import heroSlide7 from "@/assets/hero-slide-7.jpg";
import heroSlide8 from "@/assets/hero-slide-8.png";

const FALLBACK_IMAGES = [
  heroSlide1, heroSlide2, heroSlide3, heroSlide4,
  heroSlide5, heroSlide6, heroSlide7, heroSlide8,
];

const DIAS_SEMANA_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_SEMANA_FULL = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Index() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { igreja, eventos, loading: igrejaLoading, localizacao } = usePublicIgreja();

  // Hero images: usa as da igreja se existirem, senão usa fallback
  const heroImages = useMemo(() => {
    if (igreja?.foto_hero_urls && igreja.foto_hero_urls.length > 0) {
      return igreja.foto_hero_urls;
    }
    return shuffleArray(FALLBACK_IMAGES);
  }, [igreja?.foto_hero_urls]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const firstName = profile?.nome?.split(" ")[0] || "usuário";

  const nome = igreja?.nome ?? "Igreja da Promessa";
  const slogan = igreja?.slogan ?? "Uma igreja para quem busca viver o evangelho de forma real, simples e transformadora.";
  const cidadeEstado = localizacao ?? "Brasil";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <InstitutionalHeader />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen pt-28 px-4 overflow-hidden">
        {/* Slideshow */}
        {heroImages.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{ backgroundImage: `url(${img})`, opacity: index === currentSlide ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 max-w-4xl mx-auto px-2">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/80 font-medium mb-4 opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]">
            {igrejaLoading ? "" : cidadeEstado}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)] opacity-0 animate-[slideUp_0.8s_ease-out_0.4s_forwards]">
            {nome}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white font-normal max-w-xl sm:max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md opacity-0 animate-[fadeIn_0.8s_ease-out_0.6s_forwards]">
            {slogan}
          </p>

          {/* Versículo */}
          {igreja?.versiculo && (
            <div className="opacity-0 animate-[fadeIn_0.8s_ease-out_0.7s_forwards] mb-6">
              <p className="text-white/70 text-sm italic max-w-lg mx-auto">
                "{igreja.versiculo}"
                {igreja.versiculo_referencia && (
                  <span className="ml-2 font-semibold not-italic">{igreja.versiculo_referencia}</span>
                )}
              </p>
            </div>
          )}

          {/* CTA usuário logado */}
          {!authLoading && user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-[slideUp_0.8s_ease-out_0.8s_forwards]">
              <div className="flex flex-col items-center gap-4">
                <p className="text-white/90 text-lg">
                  Olá, <span className="font-semibold">{firstName}</span>
                </p>
                <Button
                  size="xl"
                  className="group relative bg-white text-promessa-700 hover:bg-white/95 shadow-2xl transition-all duration-500 hover:shadow-white/20 hover:scale-105 active:scale-100 px-8 py-6 text-base font-semibold"
                  onClick={() => navigate("/app")}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Acessar meu painel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Slide indicator dots */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? "bg-white w-6" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0"
          style={{ animation: "fadeIn 1s ease-out 1.2s forwards, float 3s ease-in-out 2.2s infinite" }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── QUEM SOMOS ───────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground mb-12">
              Quem Somos
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-card rounded-2xl p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">Nossa Missão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  "Existimos para Amar e Servir a Deus e as pessoas através de um relacionamento crescente com Jesus."
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border shadow-soft hover:shadow-elevated transition-shadow duration-300">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">Nossa Visão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  "Ser uma igreja consolidada, saudável, vibrante, relacional e relevante
                  {cidadeEstado !== "Brasil" ? ` em ${cidadeEstado}` : " em sua cidade"}.
                  "
                </p>
              </div>
            </div>
            <Button variant="outline" size="lg" className="group border-promessa-300 text-promessa-700 hover:bg-promessa-50 hover:border-promessa-400 transition-all duration-300" asChild>
              <Link to="/quem-somos" className="flex items-center gap-2">
                Conheça a Igreja <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── NOSSOS ENCONTROS ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-center text-foreground mb-12">
            Nossos Encontros
          </h2>

          {igrejaLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : eventos.length > 0 ? (
            <div className={`grid gap-6 max-w-4xl mx-auto ${eventos.length === 1 ? "md:grid-cols-1 max-w-xs" : eventos.length === 2 ? "md:grid-cols-2 max-w-2xl" : "md:grid-cols-3"}`}>
              {eventos.slice(0, 6).map(ev => (
                <div key={ev.id} className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-promessa-600" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {DIAS_SEMANA_FULL[ev.dia_semana]}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">{ev.nome}</p>
                  <p className="text-promessa-600 font-semibold text-lg">
                    {ev.horario_inicio.slice(0, 5)}
                    {ev.horario_fim && ` – ${ev.horario_fim.slice(0, 5)}`}
                  </p>
                  {ev.local && <p className="text-xs text-muted-foreground mt-1">{ev.local}</p>}
                </div>
              ))}
            </div>
          ) : (
            // Fallback se não houver eventos cadastrados
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">Sábado</h3>
                <p className="text-muted-foreground text-sm mb-2">Escola Bíblica</p>
                <p className="text-promessa-600 font-semibold text-lg">18h</p>
              </div>
              <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">Sábado</h3>
                <p className="text-muted-foreground text-sm mb-2">Culto de Celebração</p>
                <p className="text-promessa-600 font-semibold text-lg">19h07</p>
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
          )}
        </div>
      </section>

      {/* ── FAÇA PARTE ───────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">Faça Parte</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Existem diversas formas de você fazer parte da nossa comunidade</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-promessa-200 transition-colors">
                  <HandHeart className="w-8 h-8 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">Seja um Voluntário</h3>
                <p className="text-muted-foreground text-sm mb-6">Use seus dons e talentos para servir a Deus e às pessoas na nossa comunidade.</p>
                <Button variant="outline" className="w-full border-promessa-300 text-promessa-700 hover:bg-promessa-50" asChild>
                  <Link to="/seja-voluntario">Quero servir</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="group bg-card border-border hover:border-promessa-300 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-promessa-200 transition-colors">
                  <Users className="w-8 h-8 text-promessa-600" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">Sou Novo</h3>
                <p className="text-muted-foreground text-sm mb-6">Cadastre-se para fazer parte da nossa família e acompanhar as novidades.</p>
                <Button variant="outline" className="w-full border-promessa-300 text-promessa-700 hover:bg-promessa-50" asChild>
                  <Link to="/sou-novo">Cadastrar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CONTRIBUIÇÕES ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-promessa-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">Contribuições</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              As contribuições são voluntárias e fazem parte da nossa missão de servir a Deus e às pessoas.
              Cada oferta é usada para manter e expandir o trabalho da igreja.
            </p>
            <Button size="lg" className="bg-white text-promessa-700 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
              <Link to="/contribuicoes" className="flex items-center gap-2">
                <Heart className="w-5 h-5" /> Contribuir
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── VENHA NOS VISITAR ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-6">Venha nos visitar</h2>
              {igrejaLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ) : (
                <div className="space-y-4 text-muted-foreground">
                  {igreja?.endereco && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-promessa-600" />
                      <p className="whitespace-pre-line">{igreja.endereco}</p>
                    </div>
                  )}
                  {!igreja?.endereco && cidadeEstado !== "Brasil" && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-promessa-600" />
                      <p>{cidadeEstado}</p>
                    </div>
                  )}
                  {igreja?.responsavel_telefone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                      <p>{igreja.responsavel_telefone}</p>
                    </div>
                  )}
                  {igreja?.whatsapp && (
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                      <a href={`https://wa.me/${igreja.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-promessa-600 transition-colors">WhatsApp</a>
                    </div>
                  )}
                  {igreja?.responsavel_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 flex-shrink-0 text-promessa-600" />
                      <p>{igreja.responsavel_email}</p>
                    </div>
                  )}
                  {eventos.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 mt-1 flex-shrink-0 text-promessa-600" />
                      <div>
                        <p className="font-medium text-foreground">Horários:</p>
                        {eventos.map(ev => (
                          <p key={ev.id} className="text-sm">
                            {DIAS_SEMANA_SHORT[ev.dia_semana]} {ev.horario_inicio.slice(0, 5)} — {ev.nome}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Redes sociais */}
              {igreja && (
                <div className="flex gap-3 mt-8 flex-wrap">
                  {igreja.instagram_url && (
                    <a href={igreja.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors" aria-label="Instagram">
                      <Instagram className="w-5 h-5 text-promessa-600" />
                    </a>
                  )}
                  {igreja.youtube_url && (
                    <a href={igreja.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors" aria-label="YouTube">
                      <Youtube className="w-5 h-5 text-promessa-600" />
                    </a>
                  )}
                  {igreja.facebook_url && (
                    <a href={igreja.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors" aria-label="Facebook">
                      <Facebook className="w-5 h-5 text-promessa-600" />
                    </a>
                  )}
                  {igreja.site_url && (
                    <a href={igreja.site_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors" aria-label="Site">
                      <Globe className="w-5 h-5 text-promessa-600" />
                    </a>
                  )}
                  {/* Fallbacks se não houver redes configuradas */}
                  {!igreja.instagram_url && !igreja.youtube_url && !igreja.facebook_url && (
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-promessa-100 flex items-center justify-center hover:bg-promessa-200 transition-colors" aria-label="Instagram">
                      <Instagram className="w-5 h-5 text-promessa-600" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Mapa placeholder ou mensagem */}
            <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border flex items-center justify-center">
              {igrejaLoading ? (
                <Skeleton className="absolute inset-0" />
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">{nome}</p>
                  {(igreja?.endereco || cidadeEstado !== "Brasil") && (
                    <p className="text-xs mt-1">{igreja?.endereco || cidadeEstado}</p>
                  )}
                  {(igreja?.endereco) && (
                    <a
                      href={`https://maps.google.com?q=${encodeURIComponent(igreja.endereco)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs text-promessa-600 hover:underline"
                    >
                      Ver no Google Maps →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 bg-promessa-800 text-white/80">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="font-display font-semibold text-white text-lg mb-4">{nome}</h3>
              <p className="text-sm leading-relaxed mb-4">{slogan}</p>
              <div className="space-y-2 text-sm">
                {igreja?.endereco && (
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {igreja.endereco}
                  </p>
                )}
                {!igreja?.endereco && cidadeEstado !== "Brasil" && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {cidadeEstado}
                  </p>
                )}
                {(igreja?.responsavel_telefone || igreja?.whatsapp) && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {igreja.responsavel_telefone || igreja.whatsapp}
                  </p>
                )}
                {igreja?.responsavel_email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {igreja.responsavel_email}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                {igreja?.instagram_url && (
                  <a href={igreja.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {igreja?.youtube_url && (
                  <a href={igreja.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {igreja?.facebook_url && (
                  <a href={igreja.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {/* Fallback música */}
                {!igreja?.instagram_url && !igreja?.youtube_url && (
                  <a href="#" className="hover:text-white transition-colors" aria-label="Música">
                    <Music2 className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-display font-semibold text-white mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/quem-somos" className="hover:text-white transition-colors">Quem Somos</Link></li>
                <li><Link to="/bases-publicas" className="hover:text-white transition-colors">Bases</Link></li>
                <li><Link to="/trilha-amar-servir" className="hover:text-white transition-colors">Trilha Amar e Servir</Link></li>
                <li><Link to="/contribuicoes" className="hover:text-white transition-colors">Contribuir</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-white mb-4">Horários</h4>
              {eventos.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {eventos.map(ev => (
                    <li key={ev.id}>
                      {DIAS_SEMANA_SHORT[ev.dia_semana]} {ev.horario_inicio.slice(0, 5)} — {ev.nome}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2 text-sm">
                  <li>Sábado 18h — Escola Bíblica</li>
                  <li>Sábado 19h07 — Culto de Celebração</li>
                  <li>Bases — Durante a semana</li>
                </ul>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} {nome}. Todos os direitos reservados.</p>
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
