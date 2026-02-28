import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Baby, MapPin, CheckSquare, Users, Download, Clock, User, MessageCircle, FileText } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sala {
  id: string;
  nome: string;
  capacidade: number;
  status: string;
  presentes_count: number;
}

interface CheckinRecente {
  id: string;
  checkin_at: string;
  checkout_at: string | null;
  status: string;
  observacao: string | null;
  crianca: {
    nome: string;
  };
  responsavel: {
    nome: string;
    telefone: string | null;
  };
  sala: {
    nome: string;
  };
}

interface Stats {
  presentesHoje: number;
  checkinsTotais: number;
  criancasCadastradas: number;
  salasAtivas: number;
}

const cleanPhone = (phone: string | null): string => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const cleaned = cleanPhone(phone);
  return `https://wa.me/55${cleaned}`;
};

const formatDateTime = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const getOcupacaoStatus = (percent: number): { label: string; color: string } => {
  if (percent > 90) return { label: "Lotada", color: "bg-red-100 text-red-800 border-red-200" };
  if (percent > 70) return { label: "Atenção", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
  return { label: "Normal", color: "bg-green-100 text-green-800 border-green-200" };
};

const exportToCSV = (checkins: CheckinRecente[]) => {
  const headers = ["Nome Criança", "Sala", "Horário Check-in", "Horário Checkout", "Responsável", "Observação"];
  const rows = checkins.map((c) => [
    c.crianca?.nome || "",
    c.sala?.nome || "",
    c.checkin_at ? formatDateTime(c.checkin_at) : "",
    c.checkout_at ? formatDateTime(c.checkout_at) : "",
    c.responsavel?.nome || "",
    c.observacao || "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_kids_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
};

export default function KidsRelatorio() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    presentesHoje: 0,
    checkinsTotais: 0,
    criancasCadastradas: 0,
    salasAtivas: 0,
  });
  const [salas, setSalas] = useState<Sala[]>([]);
  const [checkinsRecentes, setCheckinsRecentes] = useState<CheckinRecente[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      const inicioDia = startOfDay(hoje).toISOString();
      const fimDia = endOfDay(hoje).toISOString();

      // Fetch presentes hoje
      const { count: presentesHoje } = await supabase
        .from("checkins_kids")
        .select("*", { count: "exact", head: true })
        .eq("status", "presente")
        .gte("checkin_at", inicioDia)
        .lte("checkin_at", fimDia);

      // Fetch total checkins hoje
      const { count: checkinsTotais } = await supabase
        .from("checkins_kids")
        .select("*", { count: "exact", head: true })
        .gte("checkin_at", inicioDia)
        .lte("checkin_at", fimDia);

      // Fetch total crianças cadastradas
      const { count: criancasCadastradas } = await supabase
        .from("criancas")
        .select("*", { count: "exact", head: true });

      // Fetch salas ativas
      const { data: salasData, error: salasError } = await supabase
        .from("salas")
        .select("*")
        .eq("status", "ativa")
        .order("nome");

      if (salasError) throw salasError;

      // Get presentes count for each sala
      const salasWithCount = await Promise.all(
        (salasData || []).map(async (sala) => {
          const { count } = await supabase
            .from("checkins_kids")
            .select("*", { count: "exact", head: true })
            .eq("sala_id", sala.id)
            .eq("status", "presente");
          return { ...sala, presentes_count: count || 0 };
        }),
      );

      setSalas(salasWithCount);

      setStats({
        presentesHoje: presentesHoje || 0,
        checkinsTotais: checkinsTotais || 0,
        criancasCadastradas: criancasCadastradas || 0,
        salasAtivas: salasData?.length || 0,
      });

      // Fetch checkins recentes
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins_kids")
        .select(
          `
          id,
          checkin_at,
          checkout_at,
          status,
          observacao,
          crianca:criancas(nome),
          responsavel:responsaveis!checkins_kids_responsavel_id_fkey(nome, telefone),
          sala:salas(nome)
        `,
        )
        .order("checkin_at", { ascending: false })
        .limit(20);

      if (checkinsError) throw checkinsError;
      setCheckinsRecentes(checkinsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Kids</h1>
          <p className="text-muted-foreground">Visão geral do ministério infantil</p>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(checkinsRecentes)}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Baby className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Presentes Hoje</p>
                <p className="text-2xl font-bold">{stats.presentesHoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins Hoje</p>
                <p className="text-2xl font-bold">{stats.checkinsTotais}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crianças Cadastradas</p>
                <p className="text-2xl font-bold">{stats.criancasCadastradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salas Ativas</p>
                <p className="text-2xl font-bold">{stats.salasAtivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ocupação por Sala */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Ocupação por Sala
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma sala ativa cadastrada</p>
          ) : (
            <div className="space-y-4">
              {salas.map((sala) => {
                const percent = sala.capacidade > 0 ? Math.round((sala.presentes_count / sala.capacidade) * 100) : 0;
                const status = getOcupacaoStatus(percent);

                return (
                  <div key={sala.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{sala.nome}</span>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {sala.presentes_count} / {sala.capacidade} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-ins Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Check-ins Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkinsRecentes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum check-in registrado</p>
          ) : (
            <div className="space-y-3">
              {checkinsRecentes.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{checkin.crianca?.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{checkin.sala?.nome}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(checkin.checkin_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{checkin.responsavel?.nome}</span>
                      {hasValidPhone(checkin.responsavel?.telefone) && (
                        <a
                          href={getWhatsAppUrl(checkin.responsavel?.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <Badge
                      className={
                        checkin.status === "presente" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }
                    >
                      {checkin.status === "presente" ? "Presente" : "Checkout"}
                    </Badge>
                  </div>

                  {checkin.observacao && (
                    <p className="text-xs text-muted-foreground italic w-full sm:w-auto">"{checkin.observacao}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
