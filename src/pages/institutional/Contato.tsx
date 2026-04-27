import { useState, useEffect } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChurchContact {
  nome_igreja: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  google_maps_url: string | null;
  horario_ebd: string | null;
  horario_culto: string | null;
}

const FALLBACK: ChurchContact = {
  nome_igreja: "Igreja da Promessa",
  endereco: "R: Dr. Leandro Luis Camargo dos Santos, 31 - Vila São Francisco, Hortolândia-SP 13187-525",
  telefone: "19 99573-5855",
  email: "promessa.hortolandia@gmail.com",
  google_maps_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3676.8!2d-47.2147!3d-22.8597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDUxJzM1LjAiUyA0N8KwMTInNTMuMCJX!5e0!3m2!1spt-BR!2sbr!4v1",
  horario_ebd: "18h",
  horario_culto: "19h07",
};

export default function Contato() {
  const [church, setChurch] = useState<ChurchContact>(FALLBACK);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from("configuracoes_instituicao")
      .select("nome_igreja, endereco, telefone, email, google_maps_url, horario_ebd, horario_culto")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setChurch({
            nome_igreja: data.nome_igreja || FALLBACK.nome_igreja,
            endereco: data.endereco || FALLBACK.endereco,
            telefone: data.telefone || FALLBACK.telefone,
            email: data.email || FALLBACK.email,
            google_maps_url: data.google_maps_url || FALLBACK.google_maps_url,
            horario_ebd: data.horario_ebd || FALLBACK.horario_ebd,
            horario_culto: data.horario_culto || FALLBACK.horario_culto,
          });
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check for duplicate by phone or email to avoid cluttering the visitors list
      const phoneClean = formData.telefone.replace(/\D/g, "");
      const emailClean = formData.email.trim();

      if (phoneClean.length >= 10 || emailClean) {
        let dupQuery = supabase.from("visitantes").select("id");
        if (phoneClean.length >= 10 && emailClean) {
          dupQuery = dupQuery.or(`telefone.ilike.%${phoneClean}%,email.eq.${emailClean}`);
        } else if (phoneClean.length >= 10) {
          dupQuery = dupQuery.ilike("telefone", `%${phoneClean}%`);
        } else {
          dupQuery = dupQuery.eq("email", emailClean);
        }
        const { data: existing } = await dupQuery.limit(1).maybeSingle();
        if (existing) {
          toast.success("Mensagem enviada com sucesso!", {
            description: "Entraremos em contato em breve.",
          });
          setSubmitted(true);
          setFormData({ nome: "", email: "", telefone: "", assunto: "", mensagem: "" });
          return;
        }
      }

      const { error } = await supabase.from("visitantes").insert({
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        observacoes: `[CONTATO] Assunto: ${formData.assunto.trim()}. Mensagem: ${formData.mensagem.trim()}`,
        status: "novo",
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso!", {
        description: "Entraremos em contato em breve.",
      });

      setSubmitted(true);
      setFormData({ nome: "", email: "", telefone: "", assunto: "", mensagem: "" });
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-promessa-700 via-promessa-600 to-promessa-800 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Contato</h1>
            <p className="text-lg lg:text-xl text-white/90 leading-relaxed">
              Estamos aqui para ouvir você. Entre em contato conosco e será uma alegria atendê-lo.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

              {/* Formulário */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-promessa-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-promessa-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Fale conosco</h2>
                </div>

                <p className="text-muted-foreground mb-8">
                  Preencha o formulário abaixo e nossa equipe entrará em contato o mais breve possível.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-promessa-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-promessa-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Mensagem enviada!</h3>
                    <p className="text-muted-foreground mb-6">
                      Recebemos sua mensagem e entraremos em contato em breve.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Enviar outra mensagem
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo *</Label>
                        <Input
                          id="nome"
                          name="nome"
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
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar mensagem
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              {/* Informações de contato + Mapa */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-promessa-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-promessa-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Onde estamos</h2>
                </div>

                <div className="space-y-4 mb-8">
                  {church.endereco && (
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Endereço</h3>
                        <p className="text-muted-foreground text-sm">{church.endereco}</p>
                      </div>
                    </div>
                  )}

                  {church.telefone && (
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                      <Phone className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Telefone (WhatsApp)</h3>
                        <a
                          href={`https://wa.me/55${church.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground text-sm hover:text-promessa-600 transition-colors"
                        >
                          {church.telefone}
                        </a>
                      </div>
                    </div>
                  )}

                  {church.email && (
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                      <Mail className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">E-mail</h3>
                        <a
                          href={`mailto:${church.email}`}
                          className="text-muted-foreground text-sm hover:text-promessa-600 transition-colors"
                        >
                          {church.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {(church.horario_ebd || church.horario_culto) && (
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl">
                      <Clock className="w-5 h-5 text-promessa-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Horários</h3>
                        <p className="text-muted-foreground text-sm">
                          {church.horario_ebd && <>Escola Bíblica — {church.horario_ebd}<br /></>}
                          {church.horario_culto && <>Celebração — {church.horario_culto}</>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {church.google_maps_url && (
                  <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border/50">
                    <iframe
                      src={church.google_maps_url}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0"
                      title={`Localização de ${church.nome_igreja}`}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      <footer className="bg-promessa-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} {church.nome_igreja}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
