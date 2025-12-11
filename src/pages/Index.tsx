import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 bg-promessa-700 text-white">
        
        <div className="mb-8">
          <Logo size={90} />
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
          Igreja da Promessa
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-white/90">
          Sistema completo de gestão eclesiástica para organizar, acompanhar e crescer em comunidade.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <Button 
            size="xl" 
            className="bg-white text-promessa-700 hover:bg-white/90 shadow-lg"
            asChild
          >
            <Link to="/auth">
              Acessar Sistema
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          <Button 
            size="xl" 
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            asChild
          >
            <Link to="/sou-novo">
              Sou Novo Aqui
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          </Button>

        </div>
      </section>


      {/* Rodapé */}
      <footer className="py-8 text-center text-sm text-muted-foreground bg-background border-t">
        © {new Date().getFullYear()} Igreja da Promessa. Todos os direitos reservados.
      </footer>

    </div>
  );
}
