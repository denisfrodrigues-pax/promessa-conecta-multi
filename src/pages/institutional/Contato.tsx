import { useState } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { useChurchConfig } from "@/hooks/useChurchConfig";

export default function Contato() {
  const { 
    loading, 
    getEndereco, 
    getTelefone, 
    getEmail, 
    getHorarios, 
    getGoogleMapsUrl,
    hasContactInfo 
  } = useChurchConfig();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulated submission - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Mensagem enviada com sucesso!", {
      description: "Entraremos em contato em breve."
    });
    
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      assunto: "",
      mensagem: ""
    });
    setIsSubmitting(false);
  };

  const endereco = getEndereco();
  const telefone = getTelefone();
  const email = getEmail();
  const horarios = getHorarios();
  const mapsUrl = getGoogleMapsUrl();

  // Default Google Maps embed if no custom URL is set
  const defaultMapsEmbed = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3676.8!2d-47.2147!3d-22.8597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDUxJzM1LjAiUyA0N8KwMTInNTMuMCJX!5e0!3m2!1spt-BR!2sbr!4v1";
  
  // Convert place URL to embed URL if necessary
  const getEmbedUrl = (): string | null => {
    if (!mapsUrl) return defaultMapsEmbed;
    
    // If it's already an embed URL, use it directly
    if (mapsUrl.includes('/embed')) {
      return mapsUrl;
    }
    
    // Otherwise return the custom URL or default
    return mapsUrl.includes('google.com/maps') ? mapsUrl : defaultMapsEmbed;
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Contato
            </h1>
            <p className="text-lg lg:text-xl text-white/90 leading-relaxed">
              Estamos aqui para ouvir você. Entre em contato conosco 
              e será uma alegria atendê-lo.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              
              {/* Contact Form */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-promessa-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-promessa-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Fale conosco
                  </h2>
                </div>
                
                <p className="text-muted-foreground mb-8">
                  Preencha o formulário abaixo e nossa equipe entrará em contato o mais breve possível.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        placeholder="Seu nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assunto">Assunto *</Label>
                      <Input
                        id="assunto"
                        name="assunto"
                        type="text"
                        placeholder="Sobre o que deseja falar?"
                        value={formData.assunto}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem *</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      placeholder="Escreva sua mensagem aqui..."
                      value={formData.mensagem}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-promessa-600 hover:bg-promessa-700 text-white h-12 px-8"
                  >
                    {isSubmitting ? (
                      <>Enviando...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar mensagem
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contact Info & Map */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-promessa-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-promessa-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Onde estamos
                  </h2>
                </div>

                {/* Contact Cards */}
                <div className="space-y-4 mb-8">
                  {loading ? (
                    <>
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                        <MapPin className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Endereço</h3>
                          <p className="text-muted-foreground text-sm whitespace-pre-line">
                            {endereco}
                          </p>
                        </div>
                      </div>

                      {telefone && (
                        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                          <Phone className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Telefone</h3>
                            <p className="text-muted-foreground text-sm">
                              {telefone}
                            </p>
                          </div>
                        </div>
                      )}

                      {email && (
                        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                          <Mail className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">E-mail</h3>
                            <p className="text-muted-foreground text-sm">
                              {email}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                        <Clock className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Horários</h3>
                          <p className="text-muted-foreground text-sm">
                            Escola Bíblica – {horarios.ebd}<br />
                            Celebração – {horarios.culto}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Map */}
                {embedUrl && (
                  <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border/50">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                      title="Localização da Igreja da Promessa"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-promessa-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} Igreja da Promessa Hortolândia. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
