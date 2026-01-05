import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import familiaPastoral from "@/assets/familia-pastoral.png";

export default function Pastores() {
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
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Liderança Pastoral
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Conheça quem pastoreia e cuida da nossa igreja.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-muted/30 rounded-2xl p-6 lg:p-10 border border-border/50">
              {/* Foto da Família Pastoral */}
              <div className="w-64 h-64 lg:w-80 lg:h-80 mx-auto mb-8 overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src={familiaPastoral} 
                  alt="Família Pastoral - Denis, Fran, Arthur e Heitor"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Denis e Fran</h2>
                <p className="text-promessa-600 font-medium">Pastores</p>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed text-center mb-8 max-w-2xl mx-auto">
                Denis e Fran pastoreiam a igreja com foco em pessoas, discipulado e uma fé vivida no cotidiano, buscando formar discípulos que reflitam o caráter de Cristo em todas as áreas da vida.
              </p>

              <div className="bg-white rounded-xl p-6 border border-border/50">
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

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/contato">Fale com a gente</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
