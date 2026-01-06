import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const beliefGroups = [
  {
    title: "Sobre Deus e a Criação",
    beliefs: [
      "Cremos na Trindade Divina",
      "Cremos que Deus criou o mundo",
    ],
  },
  {
    title: "Sobre a Bíblia",
    beliefs: [
      "Cremos na Bíblia Sagrada como Palavra inspirada de Deus",
    ],
  },
  {
    title: "Sobre o Ser Humano e a Salvação",
    beliefs: [
      "Cremos na queda e na restauração do ser humano",
      "Cremos em Jesus Cristo como Salvador e Mediador",
      "Cremos na eleição e no chamado",
      "Cremos na conversão, regeneração, justificação e adoção",
      "Cremos na santificação e perseverança",
    ],
  },
  {
    title: "Sobre o Espírito Santo",
    beliefs: [
      "Cremos no batismo no Espírito Santo",
      "Cremos nos dons espirituais",
    ],
  },
  {
    title: "Sobre a Vida Cristã",
    beliefs: [
      "Cremos na oração e sua eficácia",
      "Cremos na cura divina",
      "Cremos na evangelização e no discipulado",
      "Cremos na sã doutrina",
      "Cremos na abstinência e na temperança",
      "Cremos na submissão às autoridades e na liberdade de consciência",
    ],
  },
  {
    title: "Sobre a Igreja e as Ordenanças",
    beliefs: [
      "Cremos no batismo por imersão",
      "Cremos no lava-pés",
      "Cremos na Ceia do Senhor",
      "Cremos na manutenção da obra por meio de dízimos e ofertas",
      "Cremos na igreja de Cristo",
      "Cremos no casamento, no lar e na família",
    ],
  },
  {
    title: "Sobre o Fim dos Tempos",
    beliefs: [
      "Cremos na mortalidade da alma",
      "Cremos na segunda vinda de Cristo",
      "Cremos nas duas ressurreições",
      "Cremos no milênio",
      "Cremos no juízo final",
      "Cremos na extinção da maldade",
      "Cremos na nova terra, lar dos remidos",
    ],
  },
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
            <Accordion type="multiple" className="space-y-4">
              {beliefGroups.map((group, groupIndex) => (
                <AccordionItem 
                  key={groupIndex} 
                  value={`group-${groupIndex}`}
                  className="bg-muted/30 rounded-2xl border border-border/50 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline py-5">
                    {group.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <ul className="space-y-3">
                      {group.beliefs.map((belief, beliefIndex) => (
                        <li key={beliefIndex} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-promessa-100 rounded-full flex items-center justify-center flex-shrink-0 text-promessa-700 font-bold text-xs mt-0.5">
                            {beliefIndex + 1}
                          </span>
                          <span className="text-foreground">{belief}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="bg-promessa-600 hover:bg-promessa-700">
                <Link to="/trilha-amar-servir">Quero conhecer mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
