import { Link } from "react-router-dom";
import InstitutionalHeader from "@/components/layout/InstitutionalHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, Shield, Heart, Users, Search, UserPlus, CheckCircle2, Clock } from "lucide-react";

const CheckinKids = () => {
  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Baby className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Check-in Kids
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-6">
              Cuidado, segurança e acolhimento para seus filhos
            </p>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Nosso ministério infantil oferece um ambiente seguro e acolhedor onde as crianças 
              podem aprender sobre o amor de Deus enquanto os pais participam do culto com tranquilidade.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth?redirect=/kids/check-in">
                <CheckCircle2 className="w-5 h-5" />
                Fazer Check-in Kids
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Como funciona o Check-in
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Processo simples e rápido para garantir a segurança das crianças
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Crianças já cadastradas */}
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Crianças que já participam da igreja
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Check-in rápido através da busca por nome. Basta localizar a criança 
                      no sistema e confirmar o responsável presente.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Busca rápida por nome
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Confirmação do responsável
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        Processo em segundos
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crianças visitantes */}
            <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Crianças visitantes
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Cadastro simples com informações básicas seguido do check-in. 
                      Garantimos o mesmo cuidado desde a primeira visita.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Cadastro rápido
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Dados do responsável
                      </li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Check-in imediato
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Segurança é prioridade
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nosso sistema de check-in foi desenvolvido pensando na proteção das crianças
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Liberação controlada</h4>
                  <p className="text-sm text-muted-foreground">
                    Apenas responsáveis autorizados podem retirar as crianças
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Controle por faixa etária</h4>
                  <p className="text-sm text-muted-foreground">
                    Salas organizadas por idade para melhor acompanhamento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Equipe Kids preparada</h4>
                  <p className="text-sm text-muted-foreground">
                    Voluntários treinados e comprometidos com o cuidado infantil
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Registro de alergias</h4>
                  <p className="text-sm text-muted-foreground">
                    Informações de saúde visíveis para toda a equipe
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Histórico completo</h4>
                  <p className="text-sm text-muted-foreground">
                    Registro de todos os check-ins realizados
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">Comunicação rápida</h4>
                  <p className="text-sm text-muted-foreground">
                    Contato direto com responsáveis em caso de necessidade
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compromisso */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Nosso compromisso com as famílias
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Acreditamos que cada criança é uma bênção e merece o melhor cuidado. 
              Nosso ministério infantil existe para criar um ambiente onde os pequenos 
              possam conhecer o amor de Deus de forma lúdica, segura e acolhedora.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Enquanto você participa do culto, sua família está sendo cuidada com carinho 
              e atenção por uma equipe dedicada que ama servir às crianças e às famílias.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Equipe Kids — Igreja da Promessa Hortolândia</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Pronto para o check-in?
            </h2>
            <p className="text-muted-foreground mb-8">
              Faça o check-in da sua criança de forma rápida e segura
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth?redirect=/kids/check-in">
                <CheckCircle2 className="w-5 h-5" />
                Iniciar Check-in Kids
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default CheckinKids;
