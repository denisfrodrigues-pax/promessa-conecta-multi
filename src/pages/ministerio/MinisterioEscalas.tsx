import { useOutletContext } from "react-router-dom";
import AdminEscalas from "@/pages/admin/Escalas";

export default function MinisterioEscalas() {
  const { ministerioId } = useOutletContext<{ ministerioId: string }>();

  if (!ministerioId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        Carregando ministério...
      </div>
    );
  }

  return <AdminEscalas ministerioId={ministerioId} />;
}
