import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function LeaderEntry() {
  const { myMinistries, myMinistriesLoading, loading } = useAuth();

  if (loading || myMinistriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const liderMinistries = myMinistries.filter((m) => m.papel?.toLowerCase() === "lider");

  if (liderMinistries.length === 0) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Você não lidera nenhum ministério.</h2>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Selecione o ministério que deseja gerenciar</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {liderMinistries.map((min) => (
          <Link key={min.ministerio_id} to={`/leader/${min.slug}`}>
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{min.nome}</h2>
                <p className="text-sm text-muted-foreground mt-2">Gerenciar ministério</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
