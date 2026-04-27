import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Users, Baby, MapPin, Calendar } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Checkin {
  id: string;
  checkin_at: string;
  status: string;
  crianca: { nome: string; tipo?: string | null };
  responsavel: { nome: string };
  sala: { nome: string };
}

export default function KidsRelatorio() {
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    presentes: 0,
    visitantes: 0,
    membros: 0,
  });

  useEffect(() => {
    fetchData();
  }, [dataSelecionada]);

  const fetchData = async () => {
    setLoading(true);

    const inicio = startOfDay(new Date(dataSelecionada)).toISOString();
    const fim = endOfDay(new Date(dataSelecionada)).toISOString();

    const { data } = await supabase
      .from("checkins_kids")
      .select(
        `
        id,
        checkin_at,
        status,
        crianca:criancas(nome, tipo),
        responsavel:responsaveis!checkins_kids_responsavel_id_fkey(nome),
        sala:salas!checkins_kids_sala_id_fkey(nome)
      `,
      )
      .gte("checkin_at", inicio)
      .lte("checkin_at", fim)
      .order("checkin_at", { ascending: false });

    const lista = data || [];

    const total = lista.length;
    const presentes = lista.filter((c) => c.status === "presente").length;
    const visitantes = lista.filter((c) => c.crianca?.tipo === "visitante").length;
    const membros = total - visitantes;

    setCheckins(lista);
    setStats({ total, presentes, visitantes, membros });

    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Sala", "Horário", "Responsável", "Tipo"];
    const rows = checkins.map((c) => [
      c.crianca?.nome,
      c.sala?.nome,
      format(new Date(c.checkin_at), "dd/MM/yyyy HH:mm"),
      c.responsavel?.nome,
      c.crianca?.tipo === "visitante" ? "Visitante" : "Membro",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((x) => `"${x}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_kids_${dataSelecionada}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatório Kids</h1>
          <p className="text-muted-foreground">
            Dados do dia {format(new Date(dataSelecionada), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex gap-2">
          <Input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} />
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards Estatísticos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Total de Check-ins"
          value={stats.total}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={<Baby className="w-5 h-5" />}
          title="Presentes"
          value={stats.presentes}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          title="Visitantes"
          value={stats.visitantes}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          title="Membros"
          value={stats.membros}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Presenças</CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum check-in encontrado para esta data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="py-2">Nome</th>
                    <th>Sala</th>
                    <th>Horário</th>
                    <th>Responsável</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/40">
                      <td className="py-2">{c.crianca?.nome}</td>
                      <td>{c.sala?.nome}</td>
                      <td>{format(new Date(c.checkin_at), "HH:mm")}</td>
                      <td>{c.responsavel?.nome}</td>
                      <td>
                        <Badge
                          className={
                            c.crianca?.tipo === "visitante"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {c.crianca?.tipo === "visitante" ? "Visitante" : "Membro"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
