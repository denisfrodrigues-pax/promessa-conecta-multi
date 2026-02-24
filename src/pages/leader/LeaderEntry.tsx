import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function LeaderEntry() {
  const { myMinistries, myMinistriesLoading, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || myMinistriesLoading) return;

    const liderMinistries = myMinistries.filter((m) => m.papel === "lider");

    if (!liderMinistries) return;

    if (liderMinistries.length === 0) {
      navigate("/app", { replace: true });
      return;
    }

    if (liderMinistries.length === 1 && liderMinistries[0].slug) {
      navigate(`/ministerio/${liderMinistries[0].slug}`, { replace: true });
      return;
    }

    navigate("/voluntario", { replace: true });
  }, [loading, myMinistriesLoading, myMinistries]);
}
