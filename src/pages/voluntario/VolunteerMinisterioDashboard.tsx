import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays, Users, LayoutDashboard, Clock, CheckCircle2, AlertCircle,
  BookOpen, FileText, Download, Loader2, Music, Palette,
} from "lucide-react";
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
  const qc = useQueryClient();
  const [tab, setTab] = useState("resumo");

  const handleTabChange = (value: string) => {
    if (value === "resumo") {
      qc.invalidateQueries({ queryKey: ["volunteer-next-escala", ministerioId, profile?.id] });
    }
    setTab(value);
  };

  // Tipo do ministério (para exibir seção de música)
  const { data: ministerioInfo } = useQuery({
    queryKey: ["ministerio-info", ministerioId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ministerios")
        .select("tipo")
        .eq("id", ministerioId)
        .maybeSingle();
      return data as { tipo: string } | null;
    },
    staleTime: Infinity,
    enabled: !!ministerioId,
  });
  const isMusica = ministerioInfo?.tipo === "musica";

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

  // Próximo evento do ministério de música
  const { data: proximoEventoMusica, isLoading: loadingEventoMusica } = useQuery({
    queryKey: ["musica-vol-proximo-evento", ministerioId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await (supabase as any)
        .from("evento_ministerios")
        .select(`id, evento_id, eventos_escala(id, titulo, data_evento, horario_inicio)`)
        .eq("ministerio_id", ministerioId);
      const future = ((data ?? []) as any[])
        .filter((em: any) => em.eventos_escala?.data_evento >= today)
        .sort((a: any, b: any) =>
          (a.eventos_escala?.data_evento ?? "").localeCompare(b.eventos_escala?.data_evento ?? "")
        );
      return future[0] ?? null;
    },
    enabled: !!ministerioId && isMusica === true,
  });

  const proximoEventoId = (proximoEventoMusica as any)?.evento_id ?? null;

  // Músicas do próximo culto
  const { data: musicasCulto = [], isLoading: loadingMusicas } = useQuery({
    queryKey: ["musica-vol-musicas-culto", proximoEventoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("musicas_culto")
        .select(`
          id, ordem, titulo_avulso, artista_avulso,
          link_youtube, link_spotify, link_deezer, link_cifraclub,
          musicas_repertorio(titulo, artista, tom, link_youtube, link_spotify, link_deezer, link_cifraclub)
        `)
        .eq("evento_id", proximoEventoId)
        .eq("ministerio_id", ministerioId)
        .order("ordem", { ascending: true });
      return (data ?? []) as any[];
    },
    enabled: !!proximoEventoId && isMusica === true,
  });

  // Paleta do próximo culto
  const { data: paletaCulto, isLoading: loadingPaleta } = useQuery({
    queryKey: ["musica-vol-paleta", proximoEventoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("culto_paleta_cores")
        .select("cor_primaria, cor_secundaria, cor_acento, observacao")
        .eq("evento_id", proximoEventoId)
        .maybeSingle();
      return data as { cor_primaria: string | null; cor_secundaria: string | null; cor_acento: string | null; observacao: string | null } | null;
    },
    enabled: !!proximoEventoId && isMusica === true,
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
      <Tabs value={tab} onValueChange={handleTabChange}>
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
            {/* Próxima Escala */}
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

            {/* Seção exclusiva do Ministério de Música */}
            {isMusica && (
              <>
                {/* Músicas do Próximo Culto */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-promessa-600" />
                        Músicas do Próximo Culto
                      </span>
                      {(proximoEventoMusica as any)?.eventos_escala?.data_evento && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {format(
                            parseLocalDate((proximoEventoMusica as any).eventos_escala.data_evento),
                            "dd/MM",
                          )}
                          {(proximoEventoMusica as any)?.eventos_escala?.titulo && (
                            <span className="ml-1 hidden sm:inline">
                              · {(proximoEventoMusica as any).eventos_escala.titulo}
                            </span>
                          )}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingEventoMusica || loadingMusicas ? (
                      <Skeleton className="h-20 w-full" />
                    ) : !proximoEventoMusica ? (
                      <p className="text-muted-foreground text-sm">Nenhum evento agendado.</p>
                    ) : musicasCulto.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Músicas ainda não definidas pelo líder.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {musicasCulto.map((mc: any) => {
                          const rep = mc.musicas_repertorio;
                          const titulo = rep?.titulo ?? mc.titulo_avulso ?? "Sem título";
                          const artista = rep?.artista ?? mc.artista_avulso ?? "";
                          const tom = rep?.tom;
                          const yt = mc.link_youtube ?? rep?.link_youtube;
                          const sp = mc.link_spotify ?? rep?.link_spotify;
                          const dz = mc.link_deezer ?? rep?.link_deezer;
                          const cf = mc.link_cifraclub ?? rep?.link_cifraclub;
                          return (
                            <div key={mc.id} className="flex items-center gap-2 py-2">
                              <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">
                                {mc.ordem}.
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{titulo}</p>
                                {artista && (
                                  <p className="text-xs text-muted-foreground truncate">{artista}</p>
                                )}
                              </div>
                              {tom && (
                                <Badge variant="outline" className="text-[10px] px-1 flex-shrink-0">
                                  {tom}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-medium">
                                {yt && (
                                  <a href={yt} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600">YT</a>
                                )}
                                {sp && (
                                  <a href={sp} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">SP</a>
                                )}
                                {dz && (
                                  <a href={dz} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-600">DZ</a>
                                )}
                                {cf && (
                                  <a href={cf} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">CF</a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Identidade Visual / Paleta */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="w-4 h-4 text-promessa-600" />
                      Identidade Visual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!proximoEventoMusica ? (
                      <p className="text-muted-foreground text-sm">Nenhum evento agendado.</p>
                    ) : loadingPaleta ? (
                      <Skeleton className="h-14 w-full" />
                    ) : !paletaCulto ? (
                      <p className="text-muted-foreground text-sm">Paleta não definida ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          {[
                            { label: "Primária", color: paletaCulto.cor_primaria },
                            { label: "Secundária", color: paletaCulto.cor_secundaria },
                            { label: "Acento", color: paletaCulto.cor_acento },
                          ]
                            .filter(c => c.color)
                            .map(({ label, color }) => (
                              <div key={label} className="flex flex-col items-center gap-1.5">
                                <div
                                  className="w-10 h-10 rounded-full border border-border shadow-sm"
                                  style={{ backgroundColor: color! }}
                                />
                                <span className="text-[10px] text-muted-foreground">{label}</span>
                              </div>
                            ))}
                        </div>
                        {paletaCulto.observacao && (
                          <p className="text-xs text-muted-foreground">{paletaCulto.observacao}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
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
