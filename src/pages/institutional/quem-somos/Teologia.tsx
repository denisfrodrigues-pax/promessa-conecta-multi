import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const beliefs = [
  "Cremos na Trindade",
  "Cremos na Bíblia Sagrada",
  "Cremos na criação",
  "Cremos na queda e restauração do ser humano",
  "Cremos em Jesus Cristo",
  "Cremos na conversão, regeneração e justificação",
  "Cremos na santificação e perseverança",
  "Cremos no batismo no Espírito Santo",
  "Cremos nos dons espirituais",
  "Cremos na oração e na cura divina",
  "Cremos no discipulado e na missão",
  "Cremos nos sacramentos: Batismo, Ceia e Lava-pés",
  "Cremos na segunda vinda de Cristo",
  "Cremos no juízo final e na nova terra"
];

export default function Teologia() {
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
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Nossa Teologia
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Nossa fé é fundamentada na Bíblia Sagrada e vivida de forma prática, relacional e responsável.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
              <ul className="space-y-4">
                {beliefs.map((belief, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="w-8 h-8 bg-promessa-100 rounded-full flex items-center justify-center flex-shrink-0 text-promessa-700 font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-foreground text-lg pt-1">{belief}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/primeiros-passos">Quero conhecer mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
