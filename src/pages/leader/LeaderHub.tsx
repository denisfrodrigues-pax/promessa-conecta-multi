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
  const { user, loading: authLoading, roles, profile } = useAuth();
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

      if (isAdmin) {
        // Admin: fetch ALL active ministries directly
        const { data: mins, error } = await supabase
          .from("ministerios")
          .select("id, nome, slug")
          .eq("ativo", true)
          .order("nome");

        if (error) {
          console.error("Error fetching ministerios:", error);
          setLedMinistries([]);
        } else {
          setLedMinistries(
            (mins || []).map((m) => ({
              ministerio_id: m.id,
              nome: m.nome,
              slug: m.slug,
            })),
          );
        }
        setLoading(false);
        return;
      }

      // Leader/volunteer: fetch via ministerio_usuarios
      const { data: vinculos, error: errVinculos } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (errVinculos || !vinculos || vinculos.length === 0) {
        if (errVinculos) console.error("Error fetching vinculos:", errVinculos);
        setLedMinistries([]);
        setLoading(false);
        return;
      }

      const ids = vinculos.map((v) => v.ministerio_id);

      const { data: mins, error: errMins } = await supabase
        .from("ministerios")
        .select("id, nome, slug")
        .in("id", ids);

      if (errMins) {
        console.error("Error fetching ministerios:", errMins);
        setLedMinistries([]);
      } else {
        setLedMinistries(
          (mins || []).map((m) => ({
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
            onClick={() => navigate(`/ministerio/${m.slug}`)}
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
