import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";

export default function Pastores() {
  const { p } = useIgrejaSlug();
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              to={p('/quem-somos')}
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
            <div className="bg-muted/30 rounded-2xl p-6 lg:p-10 border border-border/50 text-center">
              <div className="w-24 h-24 lg:w-28 lg:h-28 mx-auto mb-8 rounded-full bg-promessa-100 flex items-center justify-center">
                <UserCircle className="w-14 h-14 text-promessa-500" />
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                Nossa equipe pastoral está comprometida com o cuidado das pessoas, o discipulado e o crescimento espiritual da igreja. Em breve, mais informações sobre nossa liderança.
              </p>
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to={p('/contato')}>Fale com a gente</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
