import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Heart, ChevronRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

const benefits = [
  {
    icon: Users,
    title: 'Gestão de Membros',
    description: 'Cadastre e acompanhe todos os membros da sua igreja de forma organizada e eficiente.',
  },
  {
    icon: Calendar,
    title: 'Escalas Inteligentes',
    description: 'Organize voluntários e ministérios com escalas automáticas e notificações.',
  },
  {
    icon: Heart,
    title: 'Acompanhamento Pastoral',
    description: 'Cuide de visitantes e novos convertidos com um sistema completo de follow-up.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              <Logo size={80} className="animate-float" />
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            Igreja da Promessa
          </h1>
          
          <p 
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 animate-slide-up"
            style={{ animationDelay: '200ms' }}
          >
            Sistema completo de gestão eclesiástica para organizar, acompanhar e crescer juntos em comunidade.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <Button asChild size="xl" className="bg-white text-promessa-700 hover:bg-white/90 shadow-xl hover:shadow-2xl group">
              <Link to="/auth">
                Acessar Sistema
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="xl" className="bg-transparent border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
              <Link to="/sou-novo">
                Sou Novo Aqui
                <Sparkles className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-promessa-100 text-promessa-700 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Por que usar?
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Recursos que transformam
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas pensadas para simplificar a gestão da sua igreja e fortalecer o cuidado com as pessoas.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title}
                className="group border-0 shadow-card hover:shadow-elevated transition-all duration-500 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <CardContent className="p-8 relative">
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-promessa-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-promessa-500 to-promessa-700 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-primary transition-all duration-300">
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-display font-semibold text-foreground mb-3 group-hover:text-promessa-700 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
            Pronto para começar?
          </h3>
          <p className="text-muted-foreground mb-8">
            Acesse o sistema e descubra como podemos ajudar sua igreja a crescer.
          </p>
          <Button asChild size="lg" variant="promessa" className="group">
            <Link to="/auth">
              Fazer Login
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Igreja da Promessa. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
