import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MinisterioContext {
  ministerioId: string;
  ministerioNome: string;
}

interface Musica {
  id: string;
  nome: string;
  artista: string | null;
  tom: string | null;
  bpm: number | null;
  categoria: string | null;
  cifra_url: string | null;
  vezes_ministrada: number | null;
}

export default function RepertorioMusicas() {
  const { ministerioId } = useOutletContext<MinisterioContext>();
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ministerioId) return;

    setLoading(true);
    supabase
      .from("musicas_ministerio")
      .select("*")
      .eq("ministerio_id", ministerioId)
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar músicas:", error);
          setMusicas([]);
        } else {
          setMusicas(data ?? []);
        }
        setLoading(false);
      });
  }, [ministerioId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (musicas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <Music className="w-12 h-12 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Nenhuma música cadastrada</h2>
        <p className="text-sm text-muted-foreground">
          Adicione músicas ao repertório deste ministério.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Repertório</h2>
        <span className="text-sm text-muted-foreground">{musicas.length} música(s)</span>
      </div>

      <div className="grid gap-3">
        {musicas.map((musica) => (
          <Card key={musica.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{musica.nome}</p>
                {musica.artista && (
                  <p className="text-sm text-muted-foreground truncate">{musica.artista}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {musica.tom && (
                  <Badge variant="secondary" className="text-xs">
                    Tom: {musica.tom}
                  </Badge>
                )}
                {musica.bpm && (
                  <Badge variant="outline" className="text-xs">
                    {musica.bpm} BPM
                  </Badge>
                )}
                {musica.categoria && (
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    {musica.categoria}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
