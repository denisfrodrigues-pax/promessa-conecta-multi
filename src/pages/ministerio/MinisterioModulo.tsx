import { useParams, Navigate } from "react-router-dom";
import { getModuleDefinition } from "@/config/moduleRegistry";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function MinisterioModulo() {
  const { modulo } = useParams<{ modulo: string }>();

  if (!modulo) {
    return <Navigate to=".." replace />;
  }

  const definition = getModuleDefinition(modulo);

  if (!definition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Módulo não encontrado</h2>
        <p className="text-muted-foreground">
          O módulo "{modulo}" ainda não está disponível.
        </p>
      </div>
    );
  }

  const ModuleComponent = definition.component;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ModuleComponent />
    </Suspense>
  );
}
