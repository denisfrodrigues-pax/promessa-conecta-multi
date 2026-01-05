import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HistoriaPage() {
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
              <History className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Nossa História
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Raízes e Propósito
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* O chamado */}
            <div className="bg-muted/30 rounded-2xl p-6 lg:p-8 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-promessa-600 rounded-full flex items-center justify-center text-white font-bold">1</span>
                <h2 className="text-xl font-bold text-promessa-700">O chamado</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Essa igreja nasceu do desejo de ver pessoas vivendo uma fé simples, bíblica e relevante, encontrando propósito por meio do relacionamento com Jesus e com outras pessoas.
              </p>
            </div>

            {/* O tempo de preparo */}
            <div className="bg-muted/30 rounded-2xl p-6 lg:p-8 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-promessa-600 rounded-full flex items-center justify-center text-white font-bold">2</span>
                <h2 className="text-xl font-bold text-promessa-700">O tempo de preparo</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Em 2023, a família pastoral Denis e Fran, juntamente com seus filhos Arthur e Heitor, foram chamados para liderar um projeto de plantação de uma nova igreja no centro da cidade de Hortolândia. Entre janeiro e março, outras pessoas foram chamadas para compor o grupo base, iniciando reuniões com foco em alinhamento, missão e direção de Deus.
              </p>
            </div>

            {/* O início dos cultos públicos */}
            <div className="bg-muted/30 rounded-2xl p-6 lg:p-8 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-promessa-600 rounded-full flex items-center justify-center text-white font-bold">3</span>
                <h2 className="text-xl font-bold text-promessa-700">O início dos cultos públicos</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Em janeiro de 2024, após a definição do local, iniciamos as adequações do espaço e, em 02 de março de 2024, realizamos nosso primeiro culto público. Desde então, seguimos em processo de consolidação, confiantes de que em cada etapa Deus tem nos direcionado, corrigido e cuidado de nós.
              </p>
            </div>

            <div className="pt-8 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/quem-somos/pastores">Conhecer os pastores</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
