import { useState, useEffect } from "react";
import { InstitutionalHeader } from "@/components/layout/InstitutionalHeader";
import { Users, MapPin, Clock, Phone, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FotoCapa } from "@/components/ui/foto-capa";

interface Base {
  id: string;
  nome: string;
  local: string | null;
  dia_semana: string | null;
  horario: string | null;
  descricao: string | null;
  lider_id: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  foto_url: string | null;
  whatsapp_lider: string | null;
  lider?: {
    nome: string;
    telefone: string | null;
  };
}

export default function BasesPublicas() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBase, setSelectedBase] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    observacao: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const { data, error } = await supabase
        .from("bases")
        .select(
          `
          id,
          nome,
          local,
          dia_semana,
          horario,
          descricao,
          lider_id,
          bairro,
          cidade,
          uf,
          foto_url,
          whatsapp_lider,
          profiles:lider_id (
            nome,
            telefone
          )
        `,
        )
        .eq("status", "ativo")
        .eq("visibilidade", "publico")
        .order("nome");

      if (error) throw error;

      const formattedBases =
        data?.map((base) => ({
          ...base,
          lider: base.profiles
            ? {
                nome: (base.profiles as any).nome,
                telefone: (base.profiles as any).telefone,
              }
            : undefined,
        })) || [];

      setBases(formattedBases as Base[]);
    } catch (error) {
      console.error("Erro ao carregar bases:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }

    if (!selectedBase) {
      toast.error("Por favor, selecione uma Base");
      return;
    }

    const baseSelecionada = bases.find((b) => b.id === selectedBase);

    setFormLoading(true);

    try {
      // 1️⃣ Criar visitante
      const { data: visitante, error: visitanteError } = await supabase
        .from("visitantes")
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim(),
          observacoes: `[INSCRIÇÃO EM BASE] Base: ${baseSelecionada?.nome || "Não especificada"}. ${formData.observacao.trim()}`,
          status: "novo",
        })
        .select()
        .single();

      if (visitanteError) throw visitanteError;

      // 2️⃣ Vincular visitante à base (CORRIGIDO AQUI)
      const { error: vinculoError } = await supabase.from("bases_membros").insert({
        base_id: selectedBase,
        visitante_id: visitante.id,
        status: "ativo", // 🔥 ALTERAÇÃO NECESSÁRIA
        observacao: "Inscrição via site institucional",
      });

      if (vinculoError) throw vinculoError;

      toast.success("Inscrição realizada com sucesso!");
      setSubmitted(true);

      // Reset do formulário
      setFormData({ nome: "", telefone: "", observacao: "" });
      setSelectedBase("");
    } catch (error) {
      console.error("Erro ao inscrever:", error);
      toast.error("Erro ao realizar inscrição. Tente novamente.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <InstitutionalHeader />
      {/* TODO O RESTANTE DO JSX PERMANECE EXATAMENTE IGUAL AO ORIGINAL */}
    </div>
  );
}
