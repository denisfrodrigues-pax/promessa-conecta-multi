import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, Users, Music, Heart, BookOpen, Baby, Video, Camera, Smile, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ministerios = [
  {
    icon: Settings,
    nome: "Gestão Estratégica",
    lider: "Denis",
    descricao: "Coordenação geral e estratégica da igreja, planejamento e visão ministerial."
  },
  {
    icon: Music,
    nome: "Música",
    lider: "Marli",
    descricao: "Conduzimos a igreja na adoração através da música, preparando o ambiente para o encontro com Deus."
  },
  {
    icon: Smile,
    nome: "Recepção",
    lider: "Silmara",
    descricao: "Acolhemos visitantes e membros com carinho e cuidado, garantindo que todos se sintam bem-vindos."
  },
  {
    icon: Users,
    nome: "Bases",
    lider: "Sara",
    descricao: "Coordenação das Bases, nossos grupos de comunhão que se reúnem durante a semana."
  },
  {
    icon: BookOpen,
    nome: "Ensino",
    lider: "Denis",
    descricao: "Ensinamos a Palavra de Deus de forma clara, relevante e aplicável ao dia a dia."
  },
  {
    icon: Baby,
    nome: "Kids",
    lider: "Bianca",
    descricao: "Cuidamos e ensinamos as crianças da igreja com amor, criatividade e fundamento bíblico."
  },
  {
    icon: Heart,
    nome: "Mulheres",
    lider: "Fran",
    descricao: "Ministério dedicado ao cuidado, discipulado e edificação das mulheres da igreja."
  },
  {
    icon: Video,
    nome: "Áudio, Vídeo e Iluminação",
    lider: "William",
    descricao: "Responsáveis pela qualidade técnica dos cultos, transmissões e eventos da igreja."
  },
  {
    icon: Camera,
    nome: "Mídia",
    lider: "Sara",
    descricao: "Criação de conteúdo, comunicação visual e presença digital da igreja."
  }
];

export default function LideresMinisterios() {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Link 
              to="/quem-somos"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar para Quem Somos
            </Link>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Líderes e Ministérios
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Servimos a Deus servindo pessoas. Cada ministério existe para edificação da igreja e impacto na cidade.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ministerios.map((ministerio, index) => (
                <Card 
                  key={index}
                  className="border border-border/50 hover:shadow-lg hover:border-promessa-200 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-promessa-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-promessa-600 transition-colors duration-300">
                        <ministerio.icon className="w-7 h-7 text-promessa-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {ministerio.nome}
                        </h3>
                        <p className="text-promessa-600 font-medium text-sm mb-2">
                          Líder: {ministerio.lider}
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {ministerio.descricao}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="bg-muted/30 rounded-2xl p-8 lg:p-10 border border-border/50 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Quer fazer parte de um ministério?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Use seus dons e talentos para servir a Deus e às pessoas. O primeiro passo é participar da nossa Trilha Amar e Servir.
                </p>
                <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                  <Link to="/trilha-amar-servir">Começar a Trilha</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}