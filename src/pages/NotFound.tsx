import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";

const NotFound = () => {
  const location = useLocation();
  // slug vazio quando o 404 acontece fora de qualquer /i/:slug (ver catch-all
  // duplicado em App.tsx: um aninhado dentro do contexto da igreja, outro fora).
  const { slug, p } = useIgrejaSlug();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <Link to={slug ? p('/') : '/'} className="text-primary underline hover:text-primary/90">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
