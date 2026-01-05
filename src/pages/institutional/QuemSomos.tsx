import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Heart, 
  Users, 
  HandHeart,
  Target,
  Eye,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const theologyGroups = [
  {
    id: "deus-criacao",
    title: "Sobre Deus e a Criação",
    beliefs: [
      "Cremos na Trindade Divina",
      "Cremos que Deus criou o mundo"
    ]
  },
  {
    id: "biblia",
    title: "Sobre a Bíblia",
    beliefs: [
      "Cremos na Bíblia Sagrada como Palavra inspirada de Deus"
    ]
  },
  {
    id: "ser-humano-salvacao",
    title: "Sobre o Ser Humano e a Salvação",
    beliefs: [
      "Cremos na queda e na restauração do ser humano",
      "Cremos em Jesus Cristo como Salvador e Mediador",
      "Cremos na eleição e no chamado",
      "Cremos na conversão, regeneração, justificação e adoção",
      "Cremos na santificação e perseverança"
    ]
  },
  {
    id: "espirito-santo",
    title: "Sobre o Espírito Santo",
    beliefs: [
      "Cremos no batismo no Espírito Santo",
      "Cremos nos dons espirituais"
    ]
  },
  {
    id: "vida-crista",
    title: "Sobre a Vida Cristã",
    beliefs: [
      "Cremos na oração e sua eficácia",
      "Cremos na cura divina",
      "Cremos na evangelização e no discipulado",
      "Cremos na sã doutrina",
      "Cremos na abstinência e na temperança",
      "Cremos na submissão às autoridades e na liberdade de consciência"
    ]
  },
  {
    id: "igreja-ordenancas",
    title: "Sobre a Igreja e as Ordenanças",
    beliefs: [
      "Cremos no batismo por imersão",
      "Cremos no lava-pés",
      "Cremos na Ceia do Senhor",
      "Cremos na manutenção da obra por meio de dízimos e ofertas",
      "Cremos na igreja de Cristo",
      "Cremos no casamento, no lar e na família"
    ]
  },
  {
    id: "fim-tempos",
    title: "Sobre o Fim dos Tempos",
    beliefs: [
      "Cremos na mortalidade da alma",
      "Cremos na segunda vinda de Cristo",
      "Cremos nas duas ressurreições",
      "Cremos no milênio",
      "Cremos no juízo final",
      "Cremos na extinção da maldade",
      "Cremos na nova terra, lar dos remidos"
    ]
  }
];

const whyParticipate = [
  "Uma igreja que tem Jesus como centro de tudo",
  "Ensino fiel e relevante da Palavra de Deus",
  "Relacionamentos saudáveis e intencionais",
  "Uma fé prática para a vida real"
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
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Somos uma igreja para pessoas reais
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-4 font-medium">
              Que estão em busca de conhecer e se relacionar com um Deus real.
            </p>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto">
              Somos uma igreja cristã em Hortolândia, comprometida com uma fé bíblica, simples e vivida na prática, onde pessoas caminham juntas no relacionamento com Deus e com outras pessoas.
            </p>
            <a 
              href="#historia" 
              className="inline-flex items-center gap-2 bg-white text-promessa-700 font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors duration-200"
            >
              Conheça nossa história
              <ChevronRight className="w-5 h-5" />
            </a>
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

      {/* 3. Missão e Visão */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Missão e Visão
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Missão */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-promessa-600 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Nossa Missão</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Existimos para amar e servir a Deus e às pessoas, por meio de um relacionamento crescente com Jesus.
                </p>
              </div>

              {/* Visão */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-promessa-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Nossa Visão</h3>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Ser uma igreja consolidada, saudável, vibrante, relacional e relevante na cidade de Hortolândia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Nossa Teologia */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Nossa Teologia
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Cremos nas verdades bíblicas históricas, vividas com fé, responsabilidade e compromisso cristão, buscando sempre uma fé alinhada à Palavra de Deus.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {theologyGroups.map((group) => (
                <AccordionItem 
                  key={group.id} 
                  value={group.id}
                  className="bg-muted/30 border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {group.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <ul className="space-y-2">
                      {group.beliefs.map((belief, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                          <span>{belief}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 5. Nossa História */}
      <section id="historia" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Nossa História
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Raízes e Propósito
            </p>

            <div className="space-y-8">
              {/* O chamado */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-border/50">
                <h3 className="text-xl font-bold text-promessa-700 mb-4">O chamado</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Essa igreja nasceu do desejo de ver pessoas vivendo uma fé simples, bíblica e relevante, encontrando propósito por meio do relacionamento com Jesus e com outras pessoas.
                </p>
              </div>

              {/* O tempo de preparo */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-border/50">
                <h3 className="text-xl font-bold text-promessa-700 mb-4">O tempo de preparo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Em 2023, a família pastoral Denis e Fran, juntamente com seus filhos Arthur e Heitor, foram chamados para liderar um projeto de plantação de uma nova igreja no centro da cidade de Hortolândia. Entre janeiro e março, outras pessoas foram chamadas para compor o grupo base, iniciando reuniões com foco em alinhamento, missão e direção de Deus.
                </p>
              </div>

              {/* O início dos cultos públicos */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-border/50">
                <h3 className="text-xl font-bold text-promessa-700 mb-4">O início dos cultos públicos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Em janeiro de 2024, após a definição do local, iniciamos as adequações do espaço e, em 02 de março de 2024, realizamos nosso primeiro culto público. Desde então, seguimos em processo de consolidação, confiantes de que em cada etapa Deus tem nos direcionado, corrigido e cuidado de nós.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Liderança Pastoral */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center mb-12">
              Liderança Pastoral
            </h2>

            <div className="bg-muted/30 rounded-2xl p-6 lg:p-10 border border-border/50">
              {/* Foto placeholder */}
              <div className="w-48 h-48 lg:w-56 lg:h-56 bg-promessa-100 rounded-full mx-auto mb-8 flex items-center justify-center">
                <Users className="w-20 h-20 text-promessa-300" />
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Denis e Fran</h3>
                <p className="text-promessa-600 font-medium">Pastores</p>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed text-center mb-8 max-w-2xl mx-auto">
                Denis e Fran pastoreiam a igreja com foco em pessoas, discipulado e uma fé vivida no cotidiano, buscando formar discípulos que reflitam o caráter de Cristo em todas as áreas da vida.
              </p>

              <div className="bg-white rounded-xl p-6 border border-border/50">
                <h4 className="font-bold text-foreground mb-4 text-center">Formação</h4>
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
          </div>
        </div>
      </section>

      {/* 7. Por que Participar */}
      <section className="py-16 lg:py-24 bg-promessa-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
              Por que Participar da Igreja da Promessa?
            </h2>

            <p className="text-lg text-muted-foreground mb-8">Aqui você encontrará:</p>

            <ul className="space-y-4 mb-10 max-w-xl mx-auto">
              {whyParticipate.map((item, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-4 text-left bg-white rounded-xl p-4 shadow-sm border border-border/50"
                >
                  <span className="w-8 h-8 bg-promessa-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </span>
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-promessa-600 hover:bg-promessa-700 text-white"
              >
                <Link to="/contato/onde-estamos">
                  Quero conhecer a igreja
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-promessa-600 text-promessa-600 hover:bg-promessa-50"
              >
                <Link to="/bases">
                  Participar de uma Base
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA Final */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Pronto para dar o próximo passo?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Você não precisa caminhar sozinho.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-white text-promessa-700 hover:bg-white/90"
              >
                <Link to="/contato/onde-estamos">
                  Visite-nos
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Link to="/contato/fale-conosco">
                  Fale conosco
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Link to="/sou-novo">
                  Sou novo por aqui
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
