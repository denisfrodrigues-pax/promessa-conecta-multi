import { useState } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { 
  Baby, 
  CheckCircle,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CadastroInfantil() {
  const [formData, setFormData] = useState({
    nomeCrianca: "",
    dataNascimento: "",
    nomeResponsavel: "",
    telefone: "",
    alergias: "",
    observacoes: "",
    autorizacaoFoto: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeCrianca.trim() || !formData.nomeResponsavel.trim() || !formData.telefone.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Primeiro, criar o visitante como responsável
      const { error } = await supabase
        .from('visitantes')
        .insert({
          nome: formData.nomeResponsavel.trim(),
          telefone: formData.telefone.trim(),
          observacoes: `[CADASTRO INFANTIL] Criança: ${formData.nomeCrianca.trim()}. Data de nascimento: ${formData.dataNascimento || 'Não informada'}. Alergias: ${formData.alergias.trim() || 'Nenhuma informada'}. Observações: ${formData.observacoes.trim() || 'Nenhuma'}. Autorização de foto: ${formData.autorizacaoFoto ? 'Sim' : 'Não'}`,
          status: 'novo'
        });

      if (error) throw error;
      
      toast.success("Cadastro realizado com sucesso!");
      setSubmitted(true);
      
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Voltar para Home
            </Link>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Cadastro Infantil
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Cadastre seus filhos para participarem das atividades do nosso ministério Kids.
            </p>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-promessa-500 to-promessa-700" />
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-promessa-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Cadastro realizado!</h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      No próximo culto, procure a equipe do Kids para completar o cadastro presencialmente.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Cadastrar outra criança
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2">
                        Pré-cadastro Infantil
                      </h2>
                      <p className="text-muted-foreground">
                        Preencha os dados para agilizar o check-in no Kids
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="nomeCrianca">Nome da criança *</Label>
                        <Input
                          id="nomeCrianca"
                          placeholder="Nome completo da criança"
                          value={formData.nomeCrianca}
                          onChange={(e) => setFormData({ ...formData, nomeCrianca: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de nascimento</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.dataNascimento}
                          onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nomeResponsavel">Nome do responsável *</Label>
                        <Input
                          id="nomeResponsavel"
                          placeholder="Nome completo do responsável"
                          value={formData.nomeResponsavel}
                          onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                        <Input
                          id="telefone"
                          placeholder="(99) 99999-9999"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alergias">Alergias ou restrições alimentares</Label>
                        <Input
                          id="alergias"
                          placeholder="Ex: alergia a amendoim, intolerância à lactose"
                          value={formData.alergias}
                          onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações importantes</Label>
                        <Textarea
                          id="observacoes"
                          placeholder="Informações sobre saúde, comportamento ou necessidades especiais"
                          maxLength={500}
                          value={formData.observacoes}
                          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <Checkbox
                          id="autorizacaoFoto"
                          checked={formData.autorizacaoFoto}
                          onCheckedChange={(checked) => setFormData({ ...formData, autorizacaoFoto: checked === true })}
                        />
                        <div>
                          <Label htmlFor="autorizacaoFoto" className="text-sm font-medium cursor-pointer">
                            Autorização de uso de imagem
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Autorizo o uso da imagem da criança em fotos e vídeos para fins internos da igreja.
                          </p>
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 text-base bg-promessa-600 hover:bg-promessa-700" disabled={loading}>
                        {loading ? 'Enviando...' : 'Cadastrar criança'}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-muted-foreground mt-6 text-sm">
              O cadastro completo será finalizado presencialmente no check-in do Kids.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}