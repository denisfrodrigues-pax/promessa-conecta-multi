import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Sparkles,
  TrendingUp,
  HeartHandshake,
  Share2,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Conhecer",
    description: "Primeiro contato com a fé e com a igreja."
  },
  {
    number: "02",
    icon: TrendingUp,
    title: "Crescer",
    description: "Curso \"Primeiros Passos\" com 4 módulos que apresentam fundamentos da fé e hábitos espirituais."
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Servir",
    description: "Descoberta de dons e engajamento nos ministérios."
  },
  {
    number: "04",
    icon: Share2,
    title: "Multiplicar",
    description: "Capacitação para discipular outras pessoas."
  }
];

export default function PrimeirosPassos() {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Primeiros Passos
            </h1>
            <p className="text-xl text-white/90 font-medium mb-2">
              O caminho para caminhar com Jesus e com a igreja
            </p>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Nosso processo de discipulado é simples, intencional e centrado em Jesus.
            </p>
          </div>
        </div>
      </section>

      {/* Cards das Etapas */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="bg-muted/30 rounded-2xl p-6 border border-border/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-promessa-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-promessa-600 transition-colors duration-300">
                    <step.icon className="w-7 h-7 text-promessa-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-bold text-promessa-600">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700 text-lg px-8 py-6">
                <Link to="/sou-novo" className="inline-flex items-center gap-2">
                  Quero dar meus Primeiros Passos
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
              <p className="text-muted-foreground mt-4 text-sm">
                Sem pressão. No seu ritmo. Com propósito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Por que participar */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
              Por que Participar da Igreja da Promessa?
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-border/50 text-left">
              <p className="text-muted-foreground mb-6">Aqui você encontrará:</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Uma igreja que tem Jesus como centro de tudo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Ensino fiel e relevante da Palavra de Deus</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Relacionamentos saudáveis e intencionais</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-promessa-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-foreground">Uma fé prática para a vida real</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="outline" className="border-promessa-600 text-promessa-600 hover:bg-promessa-50">
                <Link to="/bases">Participar de uma Base</Link>
              </Button>
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/contato">Quero conhecer a igreja</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
