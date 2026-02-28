import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Search, Baby, Clock, Loader2 } from "lucide-react";

interface CriancaResult {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sala_id: string | null;
}

interface PresenteResult {
  id: string;
  checkin_at: string;
  crianca_nome: string;
  sala_nome: string | null;
}

export default function KidsCheckinPanel() {
  const [igrejaId, setIgrejaId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [criancas, setCriancas] = useState<CriancaResult[]>([]);
  const [presentes, setPresentes] = useState<PresenteResult[]>([]);
  const [selected, setSelected] = useState<CriancaResult | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load default igreja on mount
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.rpc("public_get_default_igreja");
      if (data) {
        setIgrejaId(data);
        loadPresentes(data);
      }
      // Process QR token if present
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      if (token) {
        await processarToken(token);
      }
      setLoadingToken(false);
    };
    init();
  }, []);

  const loadPresentes = useCallback(async (igreja: string) => {
    const { data } = await supabase.rpc("public_presentes_hoje", { p_igreja_id: igreja });
    setPresentes((data as PresenteResult[]) || []);
  }, []);

  const processarToken = async (token: string) => {
    const { data } = await supabase.rpc("public_checkin_by_token", { p_token: token });
    const result = data as { success: boolean; message: string; nome?: string } | null;

    if (result?.success) {
      setSuccessMessage(`✅ Presença registrada: ${result.nome}`);
      toast({ title: `Presença registrada: ${result.nome}` });
      if (igrejaId) loadPresentes(igrejaId);
    } else {
      toast({ title: result?.message || "Erro ao processar cartão", variant: "destructive" });
    }

    window.history.replaceState({}, "", window.location.pathname);

    // Reload presentes after token processing
    const { data: igreja } = await supabase.rpc("public_get_default_igreja");
    if (igreja) loadPresentes(igreja);
  };

  // Debounced search
  useEffect(() => {
    if (!search || !igrejaId || search.length < 2) {
      setCriancas([]);
      return;
    }

    setLoadingSearch(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase.rpc("public_search_criancas", {
        p_igreja_id: igrejaId,
        p_search: search,
      });
      setCriancas((data as CriancaResult[]) || []);
      setLoadingSearch(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, igrejaId]);

  const registrarPresenca = async () => {
    if (!selected) return;

    const { data } = await supabase.rpc("public_checkin_manual", { p_crianca_id: selected.id });
    const result = data as { success: boolean; message: string; nome?: string } | null;

    if (result?.success) {
      setSuccessMessage(`✅ Presença registrada: ${result.nome}`);
      toast({ title: result.message });
      setSelected(null);
      setSearch("");
      if (igrejaId) loadPresentes(igrejaId);
    } else {
      toast({ title: result?.message || "Erro ao registrar", variant: "destructive" });
    }
  };

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loadingToken) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Processando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Success Banner */}
      {successMessage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
            <p className="font-medium text-foreground">{successMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Baby className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Check-in Kids</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome da criança..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(null);
              }}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {search.length >= 2 && !selected && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {loadingSearch ? (
                <p className="text-sm text-muted-foreground p-2">Buscando...</p>
              ) : criancas.length > 0 ? (
                criancas.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => {
                      setSelected(c);
                      setSearch("");
                    }}
                  >
                    <p className="font-medium">{c.nome}</p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">Nenhuma criança encontrada.</p>
              )}
            </div>
          )}

          {/* Selected Child */}
          {selected && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selected.nome}</p>
                </div>
              </div>
              <Button onClick={registrarPresenca} className="w-full">
                Registrar Presença
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's List */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Crianças presentes hoje ({presentes.length})
          </h2>

          {presentes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma criança registrada hoje.</p>
          ) : (
            presentes.map((p) => (
              <div key={p.id} className="border rounded-lg p-3">
                <p className="font-medium">{p.crianca_nome}</p>
                <p className="text-sm text-muted-foreground">
                  {p.sala_nome || "Sem sala"} •{" "}
                  {format(new Date(p.checkin_at), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
