import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIgrejaSlug } from "@/contexts/IgrejaSlugContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Cake, ChevronRight, Users } from "lucide-react";
import { getMinisterioIconConfig } from "@/utils/ministerioIcons";

interface LedMinistry {
  ministerio_id: string;
  nome: string;
  slug: string | null;
  tipo: string | null;
}

function AniversariantesQuickLink() {
  const navigate = useNavigate();
  const { p } = useIgrejaSlug();
  return (
    <Card
      className="mb-8 hover:shadow-elevated transition-shadow cursor-pointer group border-promessa-200 bg-promessa-50/50"
      onClick={() => navigate(p("/leader/aniversariantes"))}
    >
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-promessa-100 text-promessa-700 flex items-center justify-center shrink-0">
          <Cake className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900">Aniversariantes da Semana</p>
          <p className="text-sm text-stone-500 leading-relaxed">Veja quem faz aniversário e envie um WhatsApp</p>
        </div>
        <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
      </CardContent>
    </Card>
  );
}

export default function LeaderHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading, roles } = useAuth();
  const { p } = useIgrejaSlug();

  const [ledMinistries, setLedMinistries] = useState<LedMinistry[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLedMinistries = async () => {
      setLoading(true);

      // ✅ ADMIN: vê todos os ministérios ativos
      if (isAdmin) {
        const { data, error } = await supabase
          .from("ministerios")
          .select("id, nome, slug, tipo")
          .eq("ativo", true)
          .order("nome");

        if (error) {
          console.error("Erro ao buscar ministérios:", error);
          setLedMinistries([]);
        } else {
          setLedMinistries(
            (data || []).map((m) => ({
              ministerio_id: m.id,
              nome: m.nome,
              slug: m.slug,
              tipo: (m as any).tipo ?? null,
            })),
          );
        }

        setLoading(false);
        return;
      }

      // ✅ LÍDER: apenas ministérios onde é líder ativo
      const { data: vinculos, error: errVinculos } = await supabase
        .from("ministerio_usuarios")
        .select("ministerio_id")
        .eq("user_id", user.id)
        .eq("papel", "lider")
        .eq("ativo", true);

      if (errVinculos) {
        console.error("Erro ao buscar vínculos:", errVinculos);
        setLedMinistries([]);
        setLoading(false);
        return;
      }

      if (!vinculos || vinculos.length === 0) {
        setLedMinistries([]);
        setLoading(false);
        return;
      }

      const ids = vinculos.map((v) => v.ministerio_id);

      const { data: ministerios, error: errMinisterios } = await supabase
        .from("ministerios")
        .select("id, nome, slug, tipo")
        .in("id", ids)
        .eq("ativo", true)
        .order("nome");

      if (errMinisterios) {
        console.error("Erro ao buscar ministérios:", errMinisterios);
        setLedMinistries([]);
      } else {
        setLedMinistries(
          (ministerios || []).map((m) => ({
            ministerio_id: m.id,
            nome: m.nome,
            slug: m.slug,
            tipo: (m as any).tipo ?? null,
          })),
        );
      }

      setLoading(false);
    };

    fetchLedMinistries();
  }, [user, authLoading, isAdmin]);

  if (loading) {
    return <div className="p-6 md:p-8 text-stone-500">Carregando...</div>;
  }

  if (ledMinistries.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Hub do Líder</h1>
        <AniversariantesQuickLink />
        <div className="flex flex-col items-center text-center gap-4 py-12 px-6 bg-white rounded-2xl border border-stone-200 shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-promessa-100 text-promessa-700 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-stone-900">
              {isAdmin ? "Nenhum ministério por aqui ainda" : "Você ainda não lidera nenhum ministério"}
            </p>
            <p className="text-sm text-stone-500 leading-relaxed max-w-sm">
              {isAdmin
                ? "Cadastre um ministério para começar a organizar sua igreja."
                : "Quando você for definido como líder de um ministério, ele aparece aqui."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">Hub do Líder</h1>

      <AniversariantesQuickLink />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ledMinistries.map((m) => {
          const config = getMinisterioIconConfig(m.tipo);
          const Icon = config.icon;
          return (
            <Card
              key={m.ministerio_id}
              className="hover:shadow-elevated transition-shadow cursor-pointer group"
              onClick={() => { if (m.slug) navigate(p(`/leader/${m.slug}`)); }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{m.nome}</p>
                  <p className="text-sm text-stone-500">Acessar como líder</p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
