import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, Target, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MissaoVisao() {
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Missão e Visão
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              O que nos move e para onde caminhamos como igreja.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Missão */}
              <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-promessa-600 rounded-xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Nossa Missão</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Existimos para amar e servir a Deus e às pessoas, por meio de um relacionamento crescente com Jesus.
                </p>
              </div>

              {/* Visão */}
              <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-promessa-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Nossa Visão</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Ser uma igreja consolidada, saudável, vibrante, relacional e relevante na cidade de Hortolândia.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/quem-somos/historia">Conhecer nossa história</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
