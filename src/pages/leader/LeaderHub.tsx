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
  const { user } = useAuth();
  const [ledMinistries, setLedMinistries] = useState<LedMinistry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLedMinistries = async () => {
      setLoading(true);
      console.log("USER ID:", user?.id);
      const { data, error } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id, ministerios(nome, slug)")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (error) {
        console.error("Error fetching led ministries:", error);
        setLedMinistries([]);
      } else {
        setLedMinistries(
          (data || []).map((d: any) => ({
            ministerio_id: d.ministerio_id,
            nome: d.ministerios?.nome ?? "",
            slug: d.ministerios?.slug ?? null,
          }))
        );
      }
      setLoading(false);
    };

    fetchLedMinistries();
  }, [user]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (ledMinistries.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Hub do Líder</h1>
        <p className="text-muted-foreground">
          Você não está vinculado como líder em nenhum ministério.
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
            onClick={() => navigate(`/leader/${m.slug}`)}
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
