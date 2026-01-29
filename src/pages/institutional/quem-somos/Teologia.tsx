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
    title: "I. A Revelação de Deus",
    beliefs: [
      { 
        title: "1. A Bíblia Sagrada", 
        description: "Cremos que a Bíblia é a Palavra inspirada de Deus, plenamente confiável, suficiente e autoridade suprema em matéria de fé e prática cristã. Por meio dela, Deus revela sua vontade, seu plano de salvação e sua verdade para a humanidade." 
      },
    ],
  },
  {
    title: "II. Deus e Sua Obra Criadora",
    beliefs: [
      { 
        title: "2. A Triunidade Divina", 
        description: "Cremos em um único Deus, eterno e soberano, que subsiste em três pessoas: Pai, Filho e Espírito Santo, iguais em essência, poder e glória, atuando harmoniosamente na criação, redenção e consumação." 
      },
      { 
        title: "3. A Criação do Mundo", 
        description: "Cremos que Deus criou todas as coisas pelo poder da sua palavra, de forma intencional, ordenada e boa, sendo Ele o sustentador de toda a criação." 
      },
      { 
        title: "4. Origem, Queda e Restauração do Ser Humano", 
        description: "Cremos que o ser humano foi criado à imagem de Deus, mas caiu em pecado, rompendo seu relacionamento com o Criador. Em Cristo, Deus providenciou o caminho da restauração espiritual e da reconciliação." 
      },
    ],
  },
  {
    title: "III. A Obra Salvadora de Cristo",
    beliefs: [
      { 
        title: "5. Jesus Cristo: Salvador e Mediador da Humanidade", 
        description: "Cremos que Jesus Cristo é o Filho de Deus, plenamente divino e plenamente humano, único Salvador e mediador entre Deus e os homens, cuja obra redentora é suficiente para a salvação." 
      },
      { 
        title: "6. Regeneração e Conversão", 
        description: "Cremos que a salvação começa com o novo nascimento, operado pelo Espírito Santo, quando o pecador se arrepende, crê em Cristo e é transformado interiormente." 
      },
      { 
        title: "7. Justificação e Adoção", 
        description: "Cremos que, pela fé, o pecador é justificado diante de Deus e adotado como filho, recebendo perdão, nova identidade e acesso à família de Deus." 
      },
      { 
        title: "8. Santificação e Perseverança", 
        description: "Cremos que o salvo é chamado a uma vida de santificação contínua, vivendo em obediência a Deus e perseverando na fé até o fim." 
      },
    ],
  },
  {
    title: "IV. O Espírito Santo e Sua Atuação",
    beliefs: [
      { 
        title: "9. O Batismo no Espírito Santo", 
        description: "Cremos que o batismo no Espírito Santo é uma experiência distinta da conversão, concedida por Deus para capacitação espiritual e testemunho cristão." 
      },
      { 
        title: "10. Os Dons Espirituais", 
        description: "Cremos que o Espírito Santo concede dons à Igreja para edificação do corpo de Cristo, serviço e manifestação do poder de Deus." 
      },
    ],
  },
  {
    title: "V. A Missão da Igreja",
    beliefs: [
      { 
        title: "11. Evangelização e Discipulado", 
        description: "Cremos que a Igreja é chamada a anunciar o evangelho e formar discípulos, conduzindo pessoas a uma vida de fé, obediência e maturidade espiritual." 
      },
      { 
        title: "12. Ordenanças Instituídas por Cristo", 
        description: "Cremos nas ordenanças deixadas por Jesus: o batismo nas águas, a Ceia do Senhor e o lava-pés, como expressões de fé, comunhão e obediência." 
      },
      { 
        title: "13. A Sã Doutrina", 
        description: "Cremos na importância de preservar o ensino bíblico fiel, rejeitando heresias e permanecendo firmes na verdade revelada nas Escrituras." 
      },
    ],
  },
  {
    title: "VI. Vida Cristã e Prática",
    beliefs: [
      { 
        title: "14. Abstinência e Temperança", 
        description: "Cremos que o cristão deve viver com domínio próprio, abstendo-se de práticas que desonrem a Deus e prejudiquem o corpo e a vida espiritual." 
      },
      { 
        title: "15. A Oração e sua Eficácia", 
        description: "Cremos que a oração é um meio estabelecido por Deus para comunhão, fortalecimento espiritual e manifestação do seu agir." 
      },
      { 
        title: "16. A Cura Divina", 
        description: "Cremos que Deus continua curando segundo sua vontade, respondendo às orações feitas com fé." 
      },
    ],
  },
  {
    title: "VII. A Lei e os Princípios Divinos",
    beliefs: [
      { 
        title: "17. A Lei dos Dez Mandamentos e sua Vigência", 
        description: "Cremos que a lei moral de Deus permanece como expressão de sua vontade e caráter." 
      },
      { 
        title: "18. O Verdadeiro Dia de Descanso", 
        description: "Cremos que o sábado é o dia instituído por Deus como memorial da criação e tempo de descanso e adoração." 
      },
      { 
        title: "19. A Distinção das Leis", 
        description: "Cremos na distinção entre leis morais, cerimoniais e civis, compreendendo sua aplicação à luz do Novo Testamento." 
      },
    ],
  },
  {
    title: "VIII. A Vida em Comunidade",
    beliefs: [
      { 
        title: "20. A Manutenção da Obra: Dízimos e Ofertas", 
        description: "Cremos que a contribuição voluntária sustenta a obra de Deus e expressa fidelidade e gratidão." 
      },
      { 
        title: "21. Submissão às Autoridades e Liberdade de Consciência", 
        description: "Cremos no respeito às autoridades constituídas, preservando a liberdade de consciência diante de Deus." 
      },
      { 
        title: "22. O Casamento, o Lar e a Família", 
        description: "Cremos que a família é uma instituição divina, baseada no casamento entre homem e mulher, sendo o lar um espaço de fé, amor e ensino cristão." 
      },
      { 
        title: "23. A Igreja de Cristo", 
        description: "Cremos que a Igreja é o corpo de Cristo, composta por todos os salvos, chamada a viver em comunhão, serviço e missão." 
      },
    ],
  },
  {
    title: "IX. As Últimas Coisas",
    beliefs: [
      { 
        title: "24. A Mortalidade da Alma", 
        description: "Cremos que a alma não é imortal por natureza e que a vida eterna é dom de Deus concedido aos salvos." 
      },
      { 
        title: "25. O Dia da Crucificação e da Ressurreição de Jesus", 
        description: "Cremos na morte real e na ressurreição literal de Jesus Cristo como fundamento da fé cristã." 
      },
      { 
        title: "26. A Segunda Vinda de Cristo", 
        description: "Cremos que Jesus Cristo voltará de forma visível, gloriosa e literal para buscar seu povo." 
      },
      { 
        title: "27. As Ressurreições dos Mortos", 
        description: "Cremos na ressurreição dos justos para a vida eterna e dos ímpios para juízo." 
      },
      { 
        title: "28. O Milênio", 
        description: "Cremos no período milenar conforme revelado nas Escrituras, como parte do plano final de Deus." 
      },
      { 
        title: "29. O Juízo Final", 
        description: "Cremos que todos comparecerão diante de Deus para julgamento, segundo suas obras." 
      },
      { 
        title: "30. A Origem e a Extinção da Maldade", 
        description: "Cremos que o mal teve origem na rebelião contra Deus e será definitivamente eliminado." 
      },
      { 
        title: "31. A Nova Terra, o Lar dos Remidos", 
        description: "Cremos que Deus criará novos céus e nova terra, onde os salvos viverão eternamente em sua presença." 
      },
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
              Cremos e ensinamos conforme a Palavra de Deus
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
