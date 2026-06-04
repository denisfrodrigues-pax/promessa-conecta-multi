import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { getMinisterioIconConfig } from "@/utils/ministerioIcons";

interface LedMinistry {
  ministerio_id: string;
  nome: string;
  slug: string | null;
  tipo: string | null;
}

export default function LeaderHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading, roles } = useAuth();
  const { p } = useIgrejaSlug();

  const [ledMinistries, setLedMinistries] = useState<LedMinistry[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLedMinistries = async () => {
      setLoading(true);

      // ✅ ADMIN: vê todos os ministérios ativos
      if (isAdmin) {
        const { data, error } = await supabase
          .from("ministerios")
          .select("id, nome, slug, tipo")
          .eq("ativo", true)
          .order("nome");

        if (error) {
          console.error("Erro ao buscar ministérios:", error);
          setLedMinistries([]);
        } else {
          setLedMinistries(
            (data || []).map((m) => ({
              ministerio_id: m.id,
              nome: m.nome,
              slug: m.slug,
              tipo: (m as any).tipo ?? null,
            })),
          );
        }

        setLoading(false);
        return;
      }

      // ✅ LÍDER: apenas ministérios onde é líder ativo
      const { data: vinculos, error: errVinculos } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (errVinculos) {
        console.error("Erro ao buscar vínculos:", errVinculos);
        setLedMinistries([]);
        setLoading(false);
        return;
      }

      if (!vinculos || vinculos.length === 0) {
        setLedMinistries([]);
        setLoading(false);
        return;
      }

      const ids = vinculos.map((v) => v.ministerio_id);

      const { data: ministerios, error: errMinisterios } = await supabase
        .from("ministerios")
        .select("id, nome, slug, tipo")
        .in("id", ids)
        .eq("ativo", true)
        .order("nome");

      if (errMinisterios) {
        console.error("Erro ao buscar ministérios:", errMinisterios);
        setLedMinistries([]);
      } else {
        setLedMinistries(
          (ministerios || []).map((m) => ({
            ministerio_id: m.id,
            nome: m.nome,
            slug: m.slug,
            tipo: (m as any).tipo ?? null,
          })),
        );
      }

      setLoading(false);
    };

    fetchLedMinistries();
  }, [user, authLoading, isAdmin]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (ledMinistries.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Hub do Líder</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Nenhum ministério cadastrado na igreja."
            : "Você não está vinculado como líder em nenhum ministério."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Hub do Líder</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ledMinistries.map((m) => {
          const config = getMinisterioIconConfig(m.tipo);
          const Icon = config.icon;
          return (
            <Card
              key={m.ministerio_id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => { if (m.slug) navigate(p(`/leader/${m.slug}`)); }}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{m.nome}</p>
                  <p className="text-sm text-muted-foreground">Acessar como líder</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
