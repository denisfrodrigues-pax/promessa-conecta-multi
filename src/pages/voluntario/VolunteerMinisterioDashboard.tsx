import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays, Users, LayoutDashboard, Clock, CheckCircle2, AlertCircle,
  BookOpen, FileText, Download, Loader2, Music, Palette, Calendar,
  ChevronRight, ChevronDown, X,
} from "lucide-react";
import { parseLocalDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import AdminEscalas from "@/pages/admin/Escalas";

interface OutletCtx {
  ministerioId: string;
  ministerioNome: string;
  papel: string;
  filosofiaPdf: string | null;
}

interface EventoMusicaVol {
  id: string;
  evento_id: string;
  status: string;
  eventos_escala: {
    id: string;
    titulo: string;
    tipo: string;
    data_evento: string;
    horario_inicio: string | null;
    periodos_escala: { nome: string; mes: number; ano: number } | null;
  } | null;
}

type PeriodoGroup = {
  nome: string;
  mes: number | null;
  ano: number | null;
  eventos: EventoMusicaVol[];
};

export default function VolunteerMinisterioDashboard() {
  const { ministerioId, papel, filosofiaPdf: _filosofiaPdf } = useOutletContext<OutletCtx>();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resumo");
  const [periodosAbertos, setPeriodosAbertos] = useState<Set<string>>(new Set());
  const [eventoDetalhe, setEventoDetalhe] = useState<EventoMusicaVol | null>(null);

  const handleTabChange = (value: string) => {
    if (value === "resumo") {
      qc.invalidateQueries({ queryKey: ["volunteer-next-escala", ministerioId, profile?.id] });
    }
    setTab(value);
  };

  const togglePeriodo = (key: string) => {
    setPeriodosAbertos(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Tipo do ministério
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

  // Próximo evento de música (Resumo)
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

  // Todos os eventos de música futuros (Escalas accordion)
  const { data: eventosMusica = [], isLoading: loadingEventosMusica } = useQuery({
    queryKey: ["musica-vol-todos-eventos", ministerioId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await (supabase as any)
        .from("evento_ministerios")
        .select(`
          id, evento_id, status,
          eventos_escala(id, titulo, tipo, data_evento, horario_inicio, periodos_escala(nome, mes, ano))
        `)
        .eq("ministerio_id", ministerioId)
        .order("created_at", { ascending: false });
      return ((data ?? []) as EventoMusicaVol[])
        .filter(em => (em.eventos_escala?.data_evento ?? "") >= today)
        .sort((a, b) =>
          (a.eventos_escala?.data_evento ?? "").localeCompare(b.eventos_escala?.data_evento ?? "")
        );
    },
    enabled: !!ministerioId && isMusica === true,
  });

  // Dialog: músicas do evento selecionado
  const detalheEventoId = eventoDetalhe?.evento_id ?? null;
  const detalheEscalaId = eventoDetalhe?.eventos_escala?.id ?? null;

  const { data: detalheMusicas = [], isLoading: loadingDetalheMusicas } = useQuery({
    queryKey: ["musica-vol-detalhe-musicas", detalheEventoId, ministerioId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("musicas_culto")
        .select(`
          id, ordem, titulo_avulso, artista_avulso,
          link_youtube, link_spotify, link_deezer, link_cifraclub,
          musicas_repertorio(titulo, artista, tom, link_youtube, link_spotify, link_deezer, link_cifraclub)
        `)
        .eq("evento_id", detalheEventoId)
        .eq("ministerio_id", ministerioId)
        .order("ordem", { ascending: true });
      return (data ?? []) as any[];
    },
    enabled: !!detalheEventoId,
  });

  // Dialog: paleta do evento selecionado
  const { data: detalhePaleta, isLoading: loadingDetalhePaleta } = useQuery({
    queryKey: ["musica-vol-detalhe-paleta", detalheEventoId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("culto_paleta_cores")
        .select("cor_primaria, cor_secundaria, cor_acento, observacao")
        .eq("evento_id", detalheEventoId)
        .maybeSingle();
      return data as { cor_primaria: string | null; cor_secundaria: string | null; cor_acento: string | null; observacao: string | null } | null;
    },
    enabled: !!detalheEventoId,
  });

  // Dialog: minha confirmação no evento selecionado
  const { data: minhaConfirmacao, isLoading: loadingConfirmacao } = useQuery({
    queryKey: ["musica-vol-minha-confirmacao", detalheEscalaId, profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("escalas")
        .select("id, funcao, status, confirmado_em, justificativa")
        .eq("ministerio_id", ministerioId)
        .eq("evento_escala_id", detalheEscalaId!)
        .eq("voluntario_id", profile!.id)
        .maybeSingle();
      return data as { id: string; funcao: string; status: string; confirmado_em: string | null; justificativa: string | null } | null;
    },
    enabled: !!detalheEscalaId && !!profile?.id,
  });

  const confirmarMutation = useMutation({
    mutationFn: async () => {
      if (!minhaConfirmacao?.id) throw new Error("Sem escala");
      const { error } = await supabase
        .from("escalas")
        .update({ status: "confirmado", confirmado_em: new Date().toISOString() })
        .eq("id", minhaConfirmacao.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["musica-vol-minha-confirmacao"] });
      toast.success("Presença confirmada!");
    },
    onError: () => toast.error("Erro ao confirmar"),
  });

  const declinarMutation = useMutation({
    mutationFn: async () => {
      if (!minhaConfirmacao?.id) throw new Error("Sem escala");
      const { error } = await supabase
        .from("escalas")
        .update({ status: "ausente" })
        .eq("id", minhaConfirmacao.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["musica-vol-minha-confirmacao"] });
      toast.success("Ausência registrada.");
    },
    onError: () => toast.error("Erro ao registrar"),
  });

  // Grupos de períodos para o accordion de música
  const periodoGroupsMusica: PeriodoGroup[] = (() => {
    const map = new Map<string, PeriodoGroup>();
    const order: PeriodoGroup[] = [];
    for (const em of eventosMusica) {
      const p = em.eventos_escala?.periodos_escala;
      const key = p?.nome ?? "__sem_periodo__";
      if (!map.has(key)) {
        const g: PeriodoGroup = { nome: p?.nome ?? "Sem período", mes: p?.mes ?? null, ano: p?.ano ?? null, eventos: [] };
        map.set(key, g);
        order.push(g);
      }
      map.get(key)!.eventos.push(em);
    }
    return order;
  })();

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

            {/* Próximo Culto (música) — card simplificado com link para escalas */}
            {isMusica && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-promessa-100 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-promessa-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Próximo Culto</p>
                      {loadingEventoMusica ? (
                        <Skeleton className="h-4 w-32 mt-1" />
                      ) : proximoEventoMusica ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {format(
                            new Date((proximoEventoMusica as any).eventos_escala.data_evento + "T12:00:00"),
                            "dd/MM · EEEE",
                            { locale: ptBR }
                          )}
                          {(proximoEventoMusica as any)?.eventos_escala?.titulo && (
                            <span className="ml-1">· {(proximoEventoMusica as any).eventos_escala.titulo}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum evento agendado</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-promessa-600 hover:text-promessa-700 text-xs shrink-0"
                      onClick={() => handleTabChange("escalas")}
                    >
                      Ver repertório
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ESCALAS */}
        <TabsContent value="escalas">
          {isMusica ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Escalas de Culto</h3>
                <p className="text-sm text-muted-foreground">Próximos eventos do ministério</p>
              </div>

              {loadingEventosMusica ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : eventosMusica.length === 0 ? (
                <Card>
                  <CardContent className="py-14 text-center space-y-2">
                    <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground">Nenhum evento agendado.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {periodoGroupsMusica.map((group) => {
                    const mesAno = group.mes && group.ano
                      ? format(new Date(group.ano, group.mes - 1, 1), "MMMM yyyy", { locale: ptBR })
                      : null;
                    return (
                      <div key={group.nome}>
                        <div
                          className="flex items-center gap-2 mb-1 px-1 py-2 rounded-lg hover:bg-muted/40 cursor-pointer select-none transition-colors"
                          onClick={() => togglePeriodo(group.nome)}
                        >
                          {periodosAbertos.has(group.nome)
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                          <div className="w-7 h-7 rounded-lg bg-promessa-100 flex items-center justify-center shrink-0">
                            <CalendarDays className="w-3.5 h-3.5 text-promessa-600" />
                          </div>
                          <div className="flex-1 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{group.nome}</span>
                            {mesAno && (
                              <Badge variant="secondary" className="text-xs capitalize">{mesAno}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {group.eventos.length} evento{group.eventos.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {periodosAbertos.has(group.nome) && (
                          <div className="space-y-2 pl-2 border-l-2 border-promessa-100 ml-4 mt-2">
                            {group.eventos.map((em) => {
                              const ev = em.eventos_escala;
                              if (!ev) return null;
                              return (
                                <Card
                                  key={em.id}
                                  className="cursor-pointer hover:border-promessa-200 transition-colors"
                                  onClick={() => setEventoDetalhe(em)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <Music className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-medium text-sm">{ev.titulo}</p>
                                          {em.status === "escala_criada" && (
                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Escala definida</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(ev.data_evento + "T12:00:00"), "EEEE, dd/MM", { locale: ptBR })}
                                          </span>
                                          {ev.horario_inicio && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {ev.horario_inicio}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dialog detalhes do evento */}
              <Dialog open={!!eventoDetalhe} onOpenChange={(open) => !open && setEventoDetalhe(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{eventoDetalhe?.eventos_escala?.titulo}</DialogTitle>
                    {eventoDetalhe?.eventos_escala?.data_evento && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {format(new Date(eventoDetalhe.eventos_escala.data_evento + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        {eventoDetalhe.eventos_escala.horario_inicio && ` · ${eventoDetalhe.eventos_escala.horario_inicio}`}
                      </p>
                    )}
                  </DialogHeader>

                  <div className="space-y-6 pt-2">
                    {/* Músicas */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Music className="w-4 h-4 text-promessa-600" />
                        Músicas
                      </h4>
                      {loadingDetalheMusicas ? (
                        <Skeleton className="h-20 w-full" />
                      ) : detalheMusicas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Músicas ainda não definidas.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {detalheMusicas.map((mc: any) => {
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
                                <div className="flex items-center gap-1 flex-shrink-0 text-xs font-medium">
                                  {yt && <a href={yt} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600">YT</a>}
                                  {sp && <a href={sp} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">SP</a>}
                                  {dz && <a href={dz} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-600">DZ</a>}
                                  {cf && <a href={cf} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">CF</a>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Paleta */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-promessa-600" />
                        Identidade Visual
                      </h4>
                      {loadingDetalhePaleta ? (
                        <Skeleton className="h-14 w-full" />
                      ) : !detalhePaleta ? (
                        <p className="text-sm text-muted-foreground">Paleta não definida.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            {[
                              { label: "Primária", color: detalhePaleta.cor_primaria },
                              { label: "Secundária", color: detalhePaleta.cor_secundaria },
                              { label: "Acento", color: detalhePaleta.cor_acento },
                            ].filter(c => c.color).map(({ label, color }) => (
                              <div key={label} className="flex flex-col items-center gap-1.5">
                                <div
                                  className="w-10 h-10 rounded-full border border-border shadow-sm"
                                  style={{ backgroundColor: color! }}
                                />
                                <span className="text-[10px] text-muted-foreground">{label}</span>
                              </div>
                            ))}
                          </div>
                          {detalhePaleta.observacao && (
                            <p className="text-xs text-muted-foreground">{detalhePaleta.observacao}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Minha confirmação */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-promessa-600" />
                        Minha Confirmação
                      </h4>
                      {loadingConfirmacao ? (
                        <Skeleton className="h-10 w-full" />
                      ) : !minhaConfirmacao ? (
                        <p className="text-sm text-muted-foreground">Você não está escalado neste evento.</p>
                      ) : minhaConfirmacao.status === "pendente" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Escalado como <strong>{minhaConfirmacao.funcao}</strong>. Confirme sua presença:
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => confirmarMutation.mutate()}
                              disabled={confirmarMutation.isPending || declinarMutation.isPending}
                            >
                              {confirmarMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><CheckCircle2 className="w-4 h-4 mr-1" />Confirmar</>
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => declinarMutation.mutate()}
                              disabled={confirmarMutation.isPending || declinarMutation.isPending}
                            >
                              {declinarMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><X className="w-4 h-4 mr-1" />Não consigo</>
                              }
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {minhaConfirmacao.status === "confirmado"
                            ? <><CheckCircle2 className="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-green-700">Confirmado como {minhaConfirmacao.funcao}</span></>
                            : <><AlertCircle className="w-5 h-5 text-red-500" /><span className="text-sm font-medium text-red-700">Ausência registrada</span></>
                          }
                          {minhaConfirmacao.confirmado_em && (
                            <span className="text-xs text-muted-foreground">
                              · {format(new Date(minhaConfirmacao.confirmado_em), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <AdminEscalas ministerioId={ministerioId} canManage={papel === "lider" || papel === "admin"} />
          )}
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
