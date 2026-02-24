import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaderHub() {
  const navigate = useNavigate();
  const { myMinistries, myMinistriesLoading } = useAuth();

  const ledMinistries = myMinistries.filter(
    (m) => m.papel?.toLowerCase().includes("lider")
  );

  if (myMinistriesLoading) {
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
