import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Network, Users, Eye, Clock, MapPin, MessageCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ===== INTERFACES =====
interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  status: string;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  visibilidade: string | null;
  data_criacao: string;
  lider_nome?: string;
  lider_telefone?: string;
  membros_count: number;
}

// ===== HELPERS =====
const cleanPhone = (phone: string | null): string => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

const hasValidPhone = (phone: string | null): boolean => {
  return cleanPhone(phone).length >= 10;
};

const getWhatsAppUrl = (phone: string | null): string => {
  const digits = cleanPhone(phone);
  const phoneWithCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const message = encodeURIComponent("Olá! Sou da Igreja da Promessa.");
  return `https://wa.me/${phoneWithCountry}?text=${message}`;
};

const isBaseLotada = (membrosCount: number, capacidade: number | null): boolean => {
  return membrosCount >= (capacidade || 20);
};

// ===== STATUS CONFIG =====
const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-800 border-green-300",
  inativo: "bg-gray-100 text-gray-800 border-gray-300",
};

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// ===== CSV EXPORT =====
const exportToCSV = (bases: Base[]) => {
  const headers = [
    "nome",
    "lider",
    "telefone_lider",
    "dia_semana",
    "horario",
    "local",
    "membros",
    "capacidade",
    "status",
  ];
  const rows = bases.map((b) => [
    b.nome,
    b.lider_nome || "",
    b.lider_telefone || "",
    b.dia_semana || "",
    b.horario || "",
    b.local || "",
    b.membros_count.toString(),
    (b.capacidade || 20).toString(),
    b.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bases_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ===== COMPONENT =====
export default function Bases() {
  const { churchId } = useAuth();
  const navigate = useNavigate();
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("todos");

  useEffect(() => {
    fetchBases();
  }, [churchId]);

  const fetchBases = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bases")
        .select(
          "id, nome, descricao, lider_id, status, dia_semana, horario, local, capacidade, visibilidade, data_criacao",
        )
        .eq("church_id", churchId)
        .order("nome");

      console.log("BASES DATA:", data);
      console.log("BASES ERROR:", error);

      if (error) throw error;

      const basesWithDetails = await Promise.all(
        (data || []).map(async (base) => {
          let lider_nome: string | undefined;
          let lider_telefone: string | undefined;

          if (base.lider_id) {
            const { data: lider } = await supabase
              .from("profiles")
              .select("nome, telefone")
              .eq("id", base.lider_id)
              .maybeSingle();
            lider_nome = lider?.nome;
            lider_telefone = lider?.telefone;
          }

          const { count } = await supabase
            .from("bases_membros")
            .select("*", { count: "exact", head: true })
            .eq("base_id", base.id)
            .eq("status", "ativo");

          return {
            ...base,
            lider_nome,
            lider_telefone,
            membros_count: count || 0,
          };
        }),
      );

      setBases(basesWithDetails);
    } catch (error: any) {
      toast.error("Erro ao carregar bases: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filtered = bases.filter((base) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      base.nome.toLowerCase().includes(searchLower) ||
      base.local?.toLowerCase().includes(searchLower) ||
      base.lider_nome?.toLowerCase().includes(searchLower);

    const matchesStatus = filtroStatus === "todos" || base.status === filtroStatus;
    const matchesDia = filtroDia === "todos" || base.dia_semana === filtroDia;

    return matchesSearch && matchesStatus && matchesDia;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Nenhuma base para exportar");
      return;
    }
    exportToCSV(filtered);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Bases
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} bases encontradas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
          <Button onClick={() => navigate("/admin/bases/nova")}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Base
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, local ou líder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroDia} onValueChange={setFiltroDia}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Dia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os dias</SelectItem>
            {diasSemana.map((dia) => (
              <SelectItem key={dia} value={dia}>
                {dia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma base encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((base) => (
            <Card key={base.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name + Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{base.nome}</h3>
                      <Badge variant="outline" className={statusColors[base.status]}>
                        {base.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant={base.visibilidade === "publico" ? "default" : "secondary"}>
                        {base.visibilidade === "publico" ? "Público" : "Privado"}
                      </Badge>
                      {isBaseLotada(base.membros_count, base.capacidade) && <Badge variant="destructive">Lotada</Badge>}
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {base.membros_count}/{base.capacidade || 20}
                      </span>

                      {base.lider_nome && (
                        <span className="flex items-center gap-1">
                          Líder: {base.lider_nome}
                          {hasValidPhone(base.lider_telefone) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getWhatsAppUrl(base.lider_telefone), "_blank");
                              }}
                              className="text-green-600 hover:text-green-700 p-0.5"
                              title="WhatsApp do líder"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}

                      {base.dia_semana && base.horario && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {base.dia_semana} • {base.horario}
                        </span>
                      )}

                      {base.local && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {base.local}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/bases/${base.id}`)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
