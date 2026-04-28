import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Users, LayoutDashboard, Clock, CheckCircle2, AlertCircle, BookOpen, FileText, Download, Loader2 } from "lucide-react";
import { parseLocalDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminEscalas from "@/pages/admin/Escalas";

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
  papel: string;
  filosofiaPdf: string | null;
}

export default function VolunteerMinisterioDashboard() {
  const { ministerioId, ministerioNome, papel, filosofiaPdf } = useOutletContext<OutletCtx>();
  const { profile } = useAuth();
  const [tab, setTab] = useState("resumo");

  // Próxima escala do voluntário
  const { data: proximaEscala, isLoading: loadingEscala } = useQuery({
    queryKey: ["volunteer-next-escala", ministerioId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("escalas")
        .select("id, data, funcao, status, horario")
        .eq("ministerio_id", ministerioId)
        .eq("voluntario_id", profile.id)
        .gte("data", today)
        .order("data", { ascending: true })
        .limit(1);
      return data?.[0] ?? null;
    },
    enabled: !!profile?.id && !!ministerioId,
  });


  // Equipe do ministério
  const { data: equipe, isLoading: loadingEquipe } = useQuery({
    queryKey: ["ministerio-equipe", ministerioId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ministerio_usuarios")
        .select("id, papel, user_id, profiles!ministerio_voluntarios_user_id_fkey(nome, foto_url)")
        .eq("ministerio_id", ministerioId)
        .eq("ativo", true)
        .order("papel");
      return data ?? [];
    },
    enabled: !!ministerioId,
  });

  const { data: documentos = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["ministerio_documentos_vol", ministerioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministerio_documentos")
        .select("id, nome, descricao, arquivo_url, arquivo_tipo, arquivo_nome")
        .eq("ministerio_id", ministerioId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; nome: string; descricao: string | null; arquivo_url: string; arquivo_tipo: string; arquivo_nome: string }[];
    },
    enabled: !!ministerioId,
  });

  const formatDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const statusConfig: Record<string, { label: string; variant: "success" | "warning"; icon: typeof CheckCircle2 }> = {
    confirmado: { label: "Confirmado", variant: "success", icon: CheckCircle2 },
    pendente: { label: "Pendente", variant: "warning", icon: AlertCircle },
    ausente: { label: "Ausente", variant: "danger" as any, icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="resumo" className="gap-1.5">
            <LayoutDashboard className="w-4 h-4 hidden sm:block" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="escalas" className="gap-1.5">
            <CalendarDays className="w-4 h-4 hidden sm:block" />
            Escalas
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5">
            <Users className="w-4 h-4 hidden sm:block" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="filosofia" className="gap-1.5">
            <BookOpen className="w-4 h-4 hidden sm:block" />
            Filosofia
          </TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próxima Escala</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEscala ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : proximaEscala ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <span className="font-medium capitalize">
                        {formatDate(proximaEscala.data)}
                      </span>
                      {proximaEscala.horario && (
                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {proximaEscala.horario}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="promessa">{proximaEscala.funcao}</Badge>
                      {(() => {
                        const cfg = statusConfig[proximaEscala.status] ?? statusConfig.pendente;
                        const Icon = cfg.icon;
                        return (
                          <Badge variant={cfg.variant} className="gap-1">
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhuma escala futura encontrada.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ESCALAS */}
        <TabsContent value="escalas">
          <AdminEscalas ministerioId={ministerioId} canManage={papel === "lider" || papel === "admin"} />
        </TabsContent>

        {/* EQUIPE */}
        <TabsContent value="equipe">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEquipe ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : equipe && equipe.length > 0 ? (
                <div className="divide-y divide-border">
                  {equipe.map((member: any) => {
                    const nome = member.profiles?.nome ?? "Sem nome";
                    const isLider = member.papel === "lider";
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between py-3 ${isLider ? "bg-primary/5 -mx-4 px-4 rounded-lg" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                              isLider
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {nome.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-medium text-foreground ${isLider ? "font-bold" : ""}`}>
                            {nome}
                          </span>
                        </div>
                        <Badge variant={isLider ? "lider" : "voluntario"}>
                          {isLider ? "Líder" : "Voluntário"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum membro ativo.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* FILOSOFIA / DOCUMENTOS */}
        <TabsContent value="filosofia">
          {loadingDocs ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : documentos.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Nenhum documento publicado pelo líder ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documentos.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.nome}</p>
                        {doc.descricao && (
                          <p className="text-xs text-muted-foreground truncate">{doc.descricao}</p>
                        )}
                      </div>
                      <a
                        href={doc.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.arquivo_nome}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Abrir
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
