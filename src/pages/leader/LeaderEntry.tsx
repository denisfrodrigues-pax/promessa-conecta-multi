import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Ministerio {
  id: string;
  nome: string;
  slug: string;
  papel: string;
}

export default function LeaderHub() {
  const navigate = useNavigate();
  const { user, myMinistries, loading } = useAuth();

  const [ledMinistries, setLedMinistries] = useState<Ministerio[]>([]);

  useEffect(() => {
    if (!myMinistries) return;

    const onlyLeaders = myMinistries.filter((m: any) => m.papel?.toLowerCase().includes("lider"));

    setLedMinistries(onlyLeaders);
  }, [myMinistries]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Usuário não autenticado.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Painel do Líder</h1>
      <p>Escolha o ministério que deseja gerenciar:</p>

      {ledMinistries.length === 0 && <p>Você não está vinculado como líder em nenhum ministério.</p>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {ledMinistries.map((ministerio) => (
          <button
            key={ministerio.id}
            onClick={() => navigate(`/leader/${ministerio.slug}`)}
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid #ccc",
              cursor: "pointer",
              minWidth: 200,
            }}
          >
            <h3>{ministerio.nome}</h3>
            <p>Acessar</p>
          </button>
        ))}
      </div>
    </div>
  );
}
