import { useOutletContext, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getModuleDefinition, getIconByName } from "@/config/moduleRegistry";
import { ChevronRight } from "lucide-react";

interface MinisterioContext {
  ministerioId: string;
  ministerioNome: string;
  modulos: Array<{
    id: string;
    modulo_slug: string;
    nome: string;
    descricao: string | null;
    icone: string | null;
  }>;
}

export default function MinisterioHome() {
  const context = useOutletContext<MinisterioContext>();
  const navigate = useNavigate();

  const ministerioNome = context?.ministerioNome ?? "";
  const modulos = context?.modulos ?? [];

  if (!context?.ministerioId || modulos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Carregando ministério...
      </div>
    );
  }

  // If only one module, redirect directly
  if (modulos.length === 1) {
    const mod = modulos[0];
    const def = getModuleDefinition(mod.modulo_slug);
    if (def) {
      navigate(mod.modulo_slug, { replace: true });
      return null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ministerioNome}</h1>
        <p className="text-muted-foreground">Selecione um módulo para começar.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modulos.map((mod) => {
          const Icon = getIconByName(mod.icone);
          return (
            <Card
              key={mod.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(mod.modulo_slug)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{mod.nome}</p>
                  {mod.descricao && (
                    <p className="text-sm text-muted-foreground truncate">{mod.descricao}</p>
                  )}
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
