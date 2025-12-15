// Usando <a> padrão para navegação completa
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-24 px-4 bg-gray-50">
        
        <div className="mb-10">
          <Logo size={100} />
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-light tracking-tight text-gray-900 mb-6">
          Igreja da Promessa
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 text-gray-600 font-light">
          Sistema completo de gestão eclesiástica para organizar, acompanhar e crescer em comunidade.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <Button 
            size="xl" 
            variant="outline"
            className="border-promessa-700 text-promessa-700 hover:bg-promessa-50 transition-all duration-300"
          >
            <a href="/auth" className="flex items-center">
              Acessar Sistema
              <ChevronRight className="w-5 h-5 ml-2" />
            </a>
          </Button>

          <a href="/sou-novo">
            <Button 
              size="xl" 
              className="bg-promessa-700 text-white hover:bg-promessa-800 shadow-lg transition-all duration-300"
            >
              <span className="flex items-center text-white">
                Sou Novo Aqui
                <Sparkles className="w-5 h-5 ml-2" />
              </span>
            </Button>
          </a>

        </div>
      </section>


      {/* Rodapé */}
      <footer className="py-8 text-center text-sm text-gray-500 bg-gray-100 border-t border-gray-200">
        © {new Date().getFullYear()} Igreja da Promessa. Todos os direitos reservados.
      </footer>

    </div>
  );
}
