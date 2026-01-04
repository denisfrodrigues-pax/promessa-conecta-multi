import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  BookOpen, 
  Target, 
  History, 
  Users, 
  Award, 
  Music, 
  Heart,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    id: "teologia",
    title: "Nossa teologia",
    description: "Conheça os fundamentos bíblicos e doutrinários que norteiam nossa fé e prática ministerial.",
    icon: BookOpen,
    href: "/quem-somos/teologia"
  },
  {
    id: "missao-visao",
    title: "Missão e visão",
    description: "Nosso propósito e direção como igreja, servindo a Deus e à comunidade.",
    icon: Target,
    href: "/quem-somos/missao-visao"
  },
  {
    id: "historia",
    title: "Nossa história",
    description: "A trajetória da Igreja da Promessa em Hortolândia e como Deus tem nos guiado.",
    icon: History,
    href: "/quem-somos/historia"
  },
  {
    id: "pastores",
    title: "Pastores",
    description: "Conheça os pastores que lideram nossa congregação com amor e dedicação.",
    icon: Users,
    href: "/quem-somos/pastores"
  },
  {
    id: "lideranca",
    title: "Liderança",
    description: "Nossa equipe de líderes comprometidos em servir e edificar a igreja.",
    icon: Award,
    href: "/quem-somos/lideranca"
  },
  {
    id: "ministerios",
    title: "Ministérios",
    description: "As diversas áreas de atuação onde você pode servir e crescer espiritualmente.",
    icon: Music,
    href: "/quem-somos/ministerios"
  },
  {
    id: "por-que-participar",
    title: "Por que participar",
    description: "Descubra os benefícios de fazer parte da família Igreja da Promessa.",
    icon: Heart,
    href: "/quem-somos/por-que-participar"
  }
];

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Quem somos
            </h1>
            <p className="text-lg lg:text-xl text-white/90 leading-relaxed">
              Somos uma igreja comprometida com o Evangelho de Jesus Cristo, 
              dedicada a transformar vidas através do amor, da comunhão e do ensino da Palavra de Deus.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Intro Text */}
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Conheça a Igreja da Promessa
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                A Igreja da Promessa em Hortolândia é uma comunidade de fé que busca viver 
                os princípios do Reino de Deus. Explore as seções abaixo para conhecer 
                mais sobre nossa história, liderança e valores.
              </p>
            </div>

            {/* Section Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={section.href}
                  className="group bg-white border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-promessa-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-promessa-100 rounded-xl flex items-center justify-center group-hover:bg-promessa-600 transition-colors duration-300">
                      <section.icon className="w-6 h-6 text-promessa-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-promessa-600 transition-colors duration-200">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-promessa-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Venha nos visitar
            </h2>
            <p className="text-muted-foreground mb-8">
              Será uma alegria recebê-lo em nossos cultos. Venha conhecer nossa família!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contato/onde-estamos"
                className="inline-flex items-center justify-center px-6 py-3 bg-promessa-600 text-white font-medium rounded-lg hover:bg-promessa-700 transition-colors duration-200"
              >
                Como chegar
              </Link>
              <Link
                to="/sou-novo?tipo=visitante"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-promessa-600 font-medium rounded-lg border border-promessa-200 hover:bg-promessa-50 transition-colors duration-200"
              >
                Sou visitante
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer placeholder */}
      <footer className="bg-promessa-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
