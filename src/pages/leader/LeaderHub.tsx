import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LedMinistry {
  ministerio_id: string;
  nome: string;
  slug: string | null;
}

export default function LeaderHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading, roles } = useAuth();

  const [ledMinistries, setLedMinistries] = useState<LedMinistry[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes("admin");

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
          .select("id, nome, slug")
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
        .select("id, nome, slug")
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

      <div className="flex flex-wrap gap-4">
        {ledMinistries.map((m) => (
          <button
            key={m.ministerio_id}
            onClick={() => {
              if (!m.slug) return;
              navigate(`/leader/${m.slug}`);
            }}
            className="rounded-xl border border-border bg-card p-5 min-w-[200px] text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-lg">{m.nome}</h3>
            <p className="text-sm text-muted-foreground mt-1">Acessar</p>
          </button>
        ))}
      </div>
    </div>
  );
}
