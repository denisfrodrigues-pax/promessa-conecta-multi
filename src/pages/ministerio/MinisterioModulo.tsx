import { useParams, Navigate } from "react-router-dom";
import { getModuleDefinition } from "@/config/moduleRegistry";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function MinisterioModulo() {
  const { modulo } = useParams<{ modulo: string }>();

  // 🔹 Se não houver módulo na URL
  if (!modulo) {
    return <Navigate to=".." replace />;
  }

  const definition = getModuleDefinition(modulo);

  console.log("🔎 MÓDULO PARAM:", modulo);
  console.log("📦 DEFINIÇÃO DO MÓDULO:", definition);

  // 🔹 Se o módulo não estiver registrado
  if (!definition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">Módulo não encontrado</h2>
        <p className="text-muted-foreground">
          O módulo "<strong>{modulo}</strong>" não está registrado no sistema.
        </p>
      </div>
    );
  }

  const ModuleComponent = definition.component;

  // 🔹 Se o component estiver undefined (erro clássico de registry)
  if (!ModuleComponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Erro interno do módulo</h2>
        <p className="text-muted-foreground">
          O módulo "<strong>{modulo}</strong>" está registrado, mas não possui um componente válido.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Verifique o moduleRegistry.</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ModuleComponent />
    </Suspense>
  );
}
