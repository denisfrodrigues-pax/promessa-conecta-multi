import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, Layers, Music, Users, Heart, BookOpen, Baby } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ministerios = [
  {
    icon: Music,
    nome: "Louvor",
    descricao: "Conduzimos a igreja na adoração através da música."
  },
  {
    icon: Users,
    nome: "Recepção",
    descricao: "Acolhemos visitantes e membros com carinho e cuidado."
  },
  {
    icon: Heart,
    nome: "Intercessão",
    descricao: "Oramos pela igreja, pela cidade e pelas necessidades das pessoas."
  },
  {
    icon: BookOpen,
    nome: "Ensino",
    descricao: "Ensinamos a Palavra de Deus de forma clara e relevante."
  },
  {
    icon: Baby,
    nome: "Kids",
    descricao: "Cuidamos e ensinamos as crianças da igreja com amor."
  }
];

export default function Ministerios() {
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
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Ministérios
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
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ministerios.map((ministerio, index) => (
                <div 
                  key={index}
                  className="bg-muted/30 rounded-2xl p-6 border border-border/50 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-12 h-12 bg-promessa-100 rounded-xl flex items-center justify-center mb-4">
                    <ministerio.icon className="w-6 h-6 text-promessa-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {ministerio.nome}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {ministerio.descricao}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">
                Quer fazer parte de um ministério?
              </p>
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/primeiros-passos">Dar meus Primeiros Passos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
