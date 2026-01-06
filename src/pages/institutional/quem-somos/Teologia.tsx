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
      { title: "Cremos na Trindade Divina", description: "Um só Deus eterno, subsistente em três pessoas: Pai, Filho e Espírito Santo." },
      { title: "Cremos que Deus criou o mundo", description: "Deus é o Criador de todas as coisas, e tudo existe por Sua vontade e propósito." },
    ],
  },
  {
    title: "Sobre a Bíblia",
    beliefs: [
      { title: "Cremos na Bíblia Sagrada como Palavra inspirada de Deus", description: "A Bíblia é a revelação escrita de Deus, autoridade máxima para fé e prática cristã." },
    ],
  },
  {
    title: "Sobre o Ser Humano e a Salvação",
    beliefs: [
      { title: "Cremos na queda e na restauração do ser humano", description: "O ser humano caiu pelo pecado, mas pode ser restaurado pela graça de Deus." },
      { title: "Cremos em Jesus Cristo como Salvador e Mediador", description: "Jesus é o único caminho para a salvação e o mediador entre Deus e os homens." },
      { title: "Cremos na eleição e no chamado", description: "Deus chama pessoas para viverem segundo Seu propósito e vontade." },
      { title: "Cremos na conversão, regeneração, justificação e adoção", description: "Pela fé em Cristo, o pecador é transformado, perdoado e feito filho de Deus." },
      { title: "Cremos na santificação e perseverança", description: "A vida cristã é um processo contínuo de transformação e fidelidade a Deus." },
    ],
  },
  {
    title: "Sobre o Espírito Santo",
    beliefs: [
      { title: "Cremos no batismo no Espírito Santo", description: "Uma experiência concedida por Deus para capacitação espiritual e testemunho." },
      { title: "Cremos nos dons espirituais", description: "O Espírito Santo distribui dons para edificação da igreja e serviço cristão." },
    ],
  },
  {
    title: "Sobre a Vida Cristã",
    beliefs: [
      { title: "Cremos na oração e sua eficácia", description: "A oração é um meio poderoso de comunhão com Deus." },
      { title: "Cremos na cura divina", description: "Deus continua agindo com poder para curar conforme Sua vontade." },
      { title: "Cremos na evangelização e no discipulado", description: "Todo cristão é chamado para anunciar o evangelho e formar discípulos." },
      { title: "Cremos na sã doutrina", description: "A fé cristã deve ser vivida em fidelidade ao ensino bíblico." },
      { title: "Cremos na abstinência e na temperança", description: "A vida cristã envolve escolhas responsáveis e equilíbrio." },
      { title: "Cremos na submissão às autoridades e na liberdade de consciência", description: "Respeitamos as autoridades constituídas, preservando a consciência cristã diante de Deus." },
    ],
  },
  {
    title: "Sobre a Igreja e as Ordenanças",
    beliefs: [
      { title: "Cremos no batismo por imersão", description: "Um testemunho público de fé em Jesus Cristo." },
      { title: "Cremos no lava-pés", description: "Um ato de humildade, serviço e comunhão cristã." },
      { title: "Cremos na Ceia do Senhor", description: "Memorial da morte e ressurreição de Cristo." },
      { title: "Cremos na manutenção da obra por meio de dízimos e ofertas", description: "Um princípio bíblico de fidelidade e gratidão." },
      { title: "Cremos na igreja de Cristo", description: "A igreja é o corpo vivo de Cristo na terra." },
      { title: "Cremos no casamento, no lar e na família", description: "Instituições criadas por Deus para o bem da sociedade." },
    ],
  },
  {
    title: "Sobre o Fim dos Tempos",
    beliefs: [
      { title: "Cremos na mortalidade da alma", description: "A vida eterna é um dom concedido por Deus." },
      { title: "Cremos na segunda vinda de Cristo", description: "Jesus voltará para buscar o Seu povo." },
      { title: "Cremos nas duas ressurreições", description: "Ressurreição dos justos e dos injustos." },
      { title: "Cremos no milênio", description: "Um período estabelecido por Deus em Seu plano redentor." },
      { title: "Cremos no juízo final", description: "Deus julgará toda a humanidade com justiça." },
      { title: "Cremos na extinção da maldade", description: "O pecado e o mal terão um fim definitivo." },
      { title: "Cremos na nova terra, lar dos remidos", description: "Um novo céu e uma nova terra preparados por Deus." },
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
                    <ul className="space-y-4">
                      {group.beliefs.map((belief, beliefIndex) => (
                        <li key={beliefIndex} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-promessa-100 rounded-full flex items-center justify-center flex-shrink-0 text-promessa-700 font-bold text-xs mt-0.5">
                            {beliefIndex + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-foreground block">{belief.title}</span>
                            <span className="text-muted-foreground text-sm">{belief.description}</span>
                          </div>
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
