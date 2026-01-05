import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Heart, 
  Users, 
  HandHeart,
  ChevronRight,
  BookOpen,
  Target,
  History,
  UserCircle,
  Layers,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const identityCards = [
  {
    icon: Heart,
    title: "Amar a Deus",
    description: "Colocamos Deus no centro da nossa vida, da nossa fé e das nossas decisões, vivendo um relacionamento sincero e crescente com Ele."
  },
  {
    icon: HandHeart,
    title: "Servir Pessoas",
    description: "Acreditamos que a fé cristã se expressa no amor, no cuidado e no serviço ao próximo, dentro e fora da igreja."
  },
  {
    icon: Users,
    title: "Viver em Comunidade",
    description: "Caminhamos juntos, construindo relacionamentos saudáveis, vivendo a fé de forma coletiva e intencional."
  }
];

const hubCards = [
  {
    icon: BookOpen,
    title: "Nossa Teologia",
    description: "Cremos nas verdades bíblicas históricas, vividas com fé, responsabilidade e compromisso cristão.",
    link: "/quem-somos/teologia",
    cta: "Conhecer nossa teologia"
  },
  {
    icon: Target,
    title: "Missão e Visão",
    description: "Existimos para amar e servir a Deus e às pessoas, vivendo uma fé relacional e relevante.",
    link: "/quem-somos/missao-visao",
    cta: "Ver missão e visão"
  },
  {
    icon: History,
    title: "Nossa História",
    description: "Uma igreja que nasceu de um chamado, construída com oração, relacionamento e propósito.",
    link: "/quem-somos/historia",
    cta: "Nossa história"
  },
  {
    icon: UserCircle,
    title: "Liderança Pastoral",
    description: "Conheça quem pastoreia e cuida da igreja com foco em pessoas e discipulado.",
    link: "/quem-somos/pastores",
    cta: "Conhecer os pastores"
  },
  {
    icon: Layers,
    title: "Ministérios",
    description: "Cada ministério existe para servir pessoas e glorificar a Deus.",
    link: "/quem-somos/ministerios",
    cta: "Ver ministérios"
  }
];

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-white/70 text-sm font-medium uppercase tracking-wider mb-4">
              Igreja da Promessa Hortolândia
            </span>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Quem Somos
            </h1>
            <p className="text-2xl lg:text-3xl text-white/95 mb-4 font-medium">
              Somos uma igreja para pessoas reais
            </p>
            <p className="text-lg text-white/80 mb-4">
              Que estão em busca de conhecer e se relacionar com um Deus real.
            </p>
            <p className="text-base text-white/70 leading-relaxed mb-8 max-w-2xl mx-auto">
              Somos uma igreja cristã em Hortolândia, comprometida com uma fé bíblica, simples e vivida na prática, onde pessoas caminham juntas no relacionamento com Deus e com outras pessoas.
            </p>
            <Link 
              to="/quem-somos/historia"
              className="inline-flex items-center gap-2 bg-white text-promessa-700 font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors duration-200"
            >
              Conheça nossa história
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Nossa Identidade */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Nossa Identidade
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Vivemos nossa fé de forma prática, bíblica e relacional, buscando refletir o caráter de Jesus em tudo o que fazemos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {identityCards.map((card, index) => (
                <div 
                  key={index}
                  className="bg-muted/30 border border-border/50 rounded-2xl p-6 lg:p-8 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-promessa-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <card.icon className="w-8 h-8 text-promessa-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cards Hub - Links para páginas filhas */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Conheça Mais Sobre Nós
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore cada aspecto da nossa igreja e descubra como vivemos nossa fé.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubCards.map((card, index) => (
                <Link
                  key={index}
                  to={card.link}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:border-promessa-200 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-promessa-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-promessa-600 transition-colors duration-300">
                    <card.icon className="w-6 h-6 text-promessa-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-promessa-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {card.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-promessa-600 font-medium text-sm group-hover:gap-2 transition-all">
                    {card.cta}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}

              {/* Primeiros Passos - Destaque Visual */}
              <Link
                to="/primeiros-passos"
                className="bg-gradient-to-br from-promessa-600 to-promessa-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group md:col-span-2 lg:col-span-1"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Primeiros Passos
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  O ponto de partida para quem deseja conhecer a igreja e crescer na fé.
                </p>
                <span className="inline-flex items-center gap-1 text-white font-medium text-sm group-hover:gap-2 transition-all">
                  Quero dar meus Primeiros Passos
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Final */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Pronto para dar o próximo passo?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Você não precisa caminhar sozinho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700 text-white">
                <Link to="/contato">Visite-nos</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/contato">Fale Conosco</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/sou-novo">Sou Novo por Aqui</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
