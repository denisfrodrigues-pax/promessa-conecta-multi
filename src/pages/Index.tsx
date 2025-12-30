import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Clock, Phone, Mail, Instagram, Youtube, Facebook, Music2 } from "lucide-react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import heroImage from "@/assets/hero-home.png";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Institutional Header */}
      <InstitutionalHeader />

      {/* Hero Section - with padding for fixed header */}
      <section 
        className="relative flex flex-col items-center justify-center text-center min-h-screen pt-28 px-4"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white mb-6 drop-shadow-lg">
            Igreja da Promessa
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light max-w-3xl mx-auto mb-4">
            Hortolândia
          </p>
          <p className="text-base sm:text-lg text-white/80 font-light max-w-2xl mx-auto mb-10">
            Uma comunidade de fé, amor e esperança. Venha crescer conosco!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="xl" 
              className="bg-promessa-600 hover:bg-promessa-700 text-white shadow-lg transition-all duration-300"
              asChild
            >
              <Link to="/sou-novo" className="flex items-center">
                Sou Novo Aqui
                <Sparkles className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/70 rounded-full mt-2 animate-pulse-soft" />
          </div>
        </div>
      </section>

      {/* Service Times Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-center text-foreground mb-12">
            Nossos Cultos
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-muted/50 rounded-xl p-6 text-center border border-border">
              <Clock className="w-8 h-8 text-promessa-600 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Domingo</h3>
              <p className="text-muted-foreground">Culto de Celebração</p>
              <p className="text-promessa-600 font-semibold mt-2">18h30</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-6 text-center border border-border">
              <Clock className="w-8 h-8 text-promessa-600 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Quarta-feira</h3>
              <p className="text-muted-foreground">Culto de Oração</p>
              <p className="text-promessa-600 font-semibold mt-2">19h30</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-6 text-center border border-border">
              <Clock className="w-8 h-8 text-promessa-600 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Bases</h3>
              <p className="text-muted-foreground">Grupos de Comunhão</p>
              <p className="text-promessa-600 font-semibold mt-2">Durante a semana</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Location Section */}
      <section className="py-16 md:py-24 bg-promessa-700 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
                Venha nos visitar
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <p>
                    Rua Exemplo, 123 - Centro<br />
                    Hortolândia - SP, 13188-000
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <p>(19) 99999-9999</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <p>contato@igrejadapromessa.com.br</p>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-4 mt-8">
                <a
                  href="https://instagram.com/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/@igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://open.spotify.com/user/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Music2 className="w-5 h-5" />
                </a>
                <a
                  href="https://facebook.com/igrejadapromessa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Map placeholder */}
            <div className="bg-white/10 rounded-xl h-64 md:h-80 flex items-center justify-center border border-white/20">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="opacity-70">Mapa em breve</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-promessa-800 text-primary-foreground/80">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
