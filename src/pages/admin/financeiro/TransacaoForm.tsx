import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Conta {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
  natureza: string;
}

interface Membro {
  id: string;
  nome: string;
}

interface Evento {
  id: string;
  titulo: string;
}

export default function TransacaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  // Form state
  const [tipo, setTipo] = useState<string>("receita");
  const [contaId, setContaId] = useState<string>("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [dataOperacao, setDataOperacao] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [descricao, setDescricao] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");
  const [membroId, setMembroId] = useState<string>("");
  const [eventoId, setEventoId] = useState<string>("");
  const [status, setStatus] = useState<string>("confirmado");
  const [nota, setNota] = useState<string>("");

  useEffect(() => {
    fetchOptions();
    if (isEditing) {
      fetchTransacao();
    }
  }, [id]);

  const fetchOptions = async () => {
    const [contasRes, categoriasRes, membrosRes, eventosRes] = await Promise.all([
      supabase.from("contas_financeiras").select("id, nome").eq("status", "ativa").order("nome"),
      supabase.from("categorias_financeiras").select("id, nome, natureza").order("nome"),
      supabase.from("membros").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("eventos").select("id, titulo").order("data_inicio", { ascending: false }).limit(50),
    ]);

    setContas(contasRes.data || []);
    setCategorias(categoriasRes.data || []);
    setMembros(membrosRes.data || []);
    setEventos(eventosRes.data || []);
  };

  const fetchTransacao = async () => {
    try {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Transação não encontrada");
        navigate("/admin/financeiro/transacoes");
        return;
      }
      if (data) {
        setTipo(data.tipo);
        setContaId(data.conta_id || "");
        setCategoriaId(data.categoria_id || "");
        setValor(data.valor?.toString() || "");
        setDataOperacao(data.data_operacao);
        setDescricao(data.descricao || "");
        setReferencia(data.referencia || "");
        setMembroId(data.membro_id || "");
        setEventoId(data.evento_id || "");
        setStatus(data.status || "confirmado");
        setNota(data.nota || "");
      }
    } catch (error) {
      console.error("Erro ao carregar transação:", error);
      toast.error("Erro ao carregar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contaId || !categoriaId || !valor || !dataOperacao) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tipo,
        conta_id: contaId,
        categoria_id: categoriaId,
        valor: parseFloat(valor.replace(",", ".")),
        data_operacao: dataOperacao,
        descricao: descricao || null,
        referencia: referencia || null,
        membro_id: membroId || null,
        evento_id: eventoId || null,
        status,
        nota: nota || null,
        criado_por: profile?.id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("transacoes_financeiras")
          .update(payload)
          .eq("id", id);

        if (error) throw error;

        // Log de auditoria
        await supabase.from("auditoria_financeira").insert({
          entidade: "transacoes_financeiras",
          entidade_id: id,
          acao: "update",
          payload,
          usuario_id: profile?.id,
        });

        toast.success("Transação atualizada!");
      } else {
        const { data, error } = await supabase
          .from("transacoes_financeiras")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        // Log de auditoria
        await supabase.from("auditoria_financeira").insert({
          entidade: "transacoes_financeiras",
          entidade_id: data.id,
          acao: "create",
          payload,
          usuario_id: profile?.id,
        });

        toast.success("Transação criada!");
      }

      // Recalcular saldo da conta
      await supabase.rpc("recalcula_saldo_conta", { p_conta_id: contaId });

      navigate("/admin/financeiro/transacoes");
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!isEditing) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .update({ status: "cancelado" })
        .eq("id", id);

      if (error) throw error;

      // Log de auditoria
      await supabase.from("auditoria_financeira").insert({
        entidade: "transacoes_financeiras",
        entidade_id: id,
        acao: "update",
        payload: { status: "cancelado" },
        usuario_id: profile?.id,
      });

      // Recalcular saldo da conta
      if (contaId) {
        await supabase.rpc("recalcula_saldo_conta", { p_conta_id: contaId });
      }

      toast.success("Transação cancelada!");
      navigate("/admin/financeiro/transacoes");
    } catch (error) {
      console.error("Erro ao cancelar transação:", error);
      toast.error("Erro ao cancelar transação");
    } finally {
      setSaving(false);
    }
  };

  const filteredCategorias = categorias.filter((c) => c.natureza === tipo);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Lançamento" : "Novo Lançamento"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize os dados da transação" : "Registre uma nova transação"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da Transação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conta */}
              <div className="space-y-2">
                <Label htmlFor="conta">Conta *</Label>
                <Select value={contaId} onValueChange={setContaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data">Data da Operação *</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataOperacao}
                  onChange={(e) => setDataOperacao(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição do lançamento"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              {/* Referência */}
              <div className="space-y-2">
                <Label htmlFor="referencia">Referência / Comprovante</Label>
                <Input
                  id="referencia"
                  placeholder="Nº documento, comprovante..."
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>

              {/* Membro vinculado */}
              <div className="space-y-2">
                <Label htmlFor="membro">Membro Vinculado</Label>
                <Select value={membroId || 'none'} onValueChange={v => setMembroId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {membros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Evento vinculado */}
              <div className="space-y-2">
                <Label htmlFor="evento">Evento Vinculado</Label>
                <Select value={eventoId || 'none'} onValueChange={v => setEventoId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {eventos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nota interna */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nota">Nota Interna</Label>
                <Textarea
                  id="nota"
                  placeholder="Observações internas..."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {isEditing && status !== "cancelado" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancelar Transação
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A transação será marcada como cancelada e o saldo da conta será
                          recalculado. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Não</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel}>
                          Sim, cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Voltar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
