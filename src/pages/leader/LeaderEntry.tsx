import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LeaderEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/leader/hub", { replace: true });
  }, [navigate]);

  return null;
}
