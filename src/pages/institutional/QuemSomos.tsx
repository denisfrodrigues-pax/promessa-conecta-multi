import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  ChevronRight,
  BookOpen,
  Target,
  History,
  UserCircle,
  Users,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const hubCards = [
  {
    icon: History,
    title: "Nossa História",
    description: "Uma igreja que nasceu de um chamado, construída com oração, relacionamento e propósito.",
    link: "/quem-somos/historia",
    cta: "Conhecer nossa história"
  },
  {
    icon: Target,
    title: "Missão e Visão",
    description: "Existimos para amar e servir a Deus e às pessoas, vivendo uma fé relacional e relevante.",
    link: "/quem-somos/missao-visao",
    cta: "Ver missão e visão"
  },
  {
    icon: BookOpen,
    title: "Nossa Teologia",
    description: "Cremos nas verdades bíblicas históricas, vividas com fé, responsabilidade e compromisso cristão.",
    link: "/quem-somos/teologia",
    cta: "Conhecer nossa teologia"
  },
  {
    icon: UserCircle,
    title: "Pastores",
    description: "Conheça quem pastoreia e cuida da igreja com foco em pessoas e discipulado.",
    link: "/quem-somos/pastores",
    cta: "Conhecer os pastores"
  },
  {
    icon: Users,
    title: "Líderes e Ministérios",
    description: "Cada ministério existe para servir pessoas e glorificar a Deus.",
    link: "/quem-somos/lideres-ministerios",
    cta: "Ver líderes e ministérios"
  }
];

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
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

      {/* Nossa História - Resumo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-12 text-center">
              Nossa História
            </h2>
            
            <div className="space-y-8">
              <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
                <h3 className="text-xl font-bold text-foreground mb-4">O chamado</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Essa igreja nasceu do desejo de ver pessoas vivendo uma fé simples, bíblica e relevante, encontrando propósito por meio do relacionamento com Jesus e com outras pessoas.
                </p>
              </div>
              
              <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
                <h3 className="text-xl font-bold text-foreground mb-4">O tempo de preparo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Em 2023, a família pastoral Denis e Fran, juntamente com seus filhos Arthur e Heitor, foram chamados para liderar um projeto de plantação de uma nova igreja no centro da cidade de Hortolândia. Entre janeiro e março, outras pessoas foram chamadas para compor o grupo base, iniciando reuniões com foco em alinhamento, missão e direção de Deus.
                </p>
              </div>
              
              <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
                <h3 className="text-xl font-bold text-foreground mb-4">O início dos cultos públicos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Em janeiro de 2024, após a definição do local, iniciamos as adequações do espaço e, em 02 de março de 2024, realizamos nosso primeiro culto público. Desde então, seguimos em processo de consolidação, confiantes de que em cada etapa Deus tem nos direcionado, corrigido e cuidado de nós.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/quem-somos/historia">Ver história completa</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pastores */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 text-center">
              Pastores
            </h2>
            
            <div className="bg-white rounded-2xl p-8 lg:p-10 border border-border/50">
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 text-center">
                Denis e Fran pastoreiam a igreja com foco em pessoas, discipulado e uma fé vivida no cotidiano, buscando formar discípulos que reflitam o caráter de Cristo em todas as áreas da vida.
              </p>

              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <h3 className="font-bold text-foreground mb-4 text-center text-lg">Formação</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Denis</strong> é bacharel em Teologia, formado em Administração de Empresas e pós-graduado em Plantação e Revitalização de Igrejas.
                  </p>
                  <p>
                    <strong className="text-foreground">Fran</strong> é bacharel em Teologia, licenciada em Matemática, possui MBA em Finanças e Controladoria e pós-graduação em Plantação e Revitalização de Igrejas.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/quem-somos/pastores">Conhecer os pastores</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Por que Participar */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Por que Participar da Igreja da Promessa?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Aqui você encontrará:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10">
              <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-5 border border-border/50 text-left">
                <CheckCircle className="w-6 h-6 text-promessa-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">Uma igreja que tem Jesus como centro de tudo</span>
              </div>
              <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-5 border border-border/50 text-left">
                <CheckCircle className="w-6 h-6 text-promessa-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">Ensino fiel e relevante da Palavra de Deus</span>
              </div>
              <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-5 border border-border/50 text-left">
                <CheckCircle className="w-6 h-6 text-promessa-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">Relacionamentos saudáveis e intencionais</span>
              </div>
              <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-5 border border-border/50 text-left">
                <CheckCircle className="w-6 h-6 text-promessa-600 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">Uma fé prática para a vida real</span>
              </div>
            </div>
            
            <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700 text-white">
              <Link to="/sou-novo" className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Quero conhecer a igreja
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cards Hub - Links para páginas filhas */}
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

              {/* Trilha Amar e Servir - Card normal */}
              <Link
                to="/trilha-amar-servir"
                className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:border-promessa-200 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-promessa-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-promessa-600 transition-colors duration-300">
                  <Sparkles className="w-6 h-6 text-promessa-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-promessa-700 transition-colors">
                  Trilha Amar e Servir
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  O ponto de partida para quem deseja conhecer a igreja e crescer na fé.
                </p>
                <span className="inline-flex items-center gap-1 text-promessa-600 font-medium text-sm group-hover:gap-2 transition-all">
                  Quero dar meus primeiros passos
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
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
                <Link to="/trilha-amar-servir">Começar a Trilha Amar e Servir</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/contato">Fale Conosco</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}