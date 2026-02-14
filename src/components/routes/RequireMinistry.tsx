import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  slug: string;
  children: React.ReactNode;
};

export default function RequireMinistry({ slug, children }: Props) {
  const { roles, myMinistries, myMinistriesLoading, refreshMyMinistries } = useAuth();

  const isAdmin = roles?.includes("admin");

  // If ministries haven't been loaded yet and we're not admin, trigger a refresh
  useEffect(() => {
    if (!isAdmin && !myMinistriesLoading && myMinistries.length === 0) {
      refreshMyMinistries();
    }
  }, [isAdmin, myMinistriesLoading, myMinistries.length, refreshMyMinistries]);

  if (isAdmin) {
    return <>{children}</>;
  }

  if (myMinistriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  const hasAccess = myMinistries.some((m) => m.slug === slug);

  if (!hasAccess) {
    toast({
      title: "Sem permissão",
      description: "Você não tem acesso a este módulo.",
      variant: "destructive",
    });
    return <Navigate to="/voluntario" replace />;
  }

  return <>{children}</>;
}
