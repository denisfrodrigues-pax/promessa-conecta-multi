import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";

export default function LeaderEntry() {
  const navigate = useNavigate();
  const { p } = useIgrejaSlug();

  useEffect(() => {
    navigate(p("/leader/hub"), { replace: true });
  }, [navigate, p]);

  return null;
}
