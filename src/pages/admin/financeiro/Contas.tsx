import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Wallet, Building, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Conta {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  saldo: number;
  status: string;
}

export default function Contas() {
  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<Conta[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("caixa");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("ativa");

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contas_financeiras")
        .select("*")
        .order("nome");

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome("");
    setTipo("caixa");
    setDescricao("");
    setStatus("ativa");
    setEditingId(null);
  };

  const openEditModal = (conta: Conta) => {
    setEditingId(conta.id);
    setNome(conta.nome);
    setTipo(conta.tipo);
    setDescricao(conta.descricao || "");
    setStatus(conta.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        tipo,
        descricao: descricao.trim() || null,
        status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("contas_financeiras")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Conta atualizada!");
      } else {
        const { error } = await supabase.from("contas_financeiras").insert(payload);

        if (error) throw error;
        toast.success("Conta criada!");
      }

      setModalOpen(false);
      resetForm();
      fetchContas();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast.error("Erro ao salvar conta");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "caixa":
        return <Wallet className="h-4 w-4" />;
      case "banco":
        return <Building className="h-4 w-4" />;
      case "pix":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "caixa":
        return "Caixa";
      case "banco":
        return "Conta Bancária";
      case "pix":
        return "PIX";
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas Financeiras</h1>
          <p className="text-muted-foreground">Gerencie as contas da igreja</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Conta" : "Nova Conta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Caixa Geral, Conta Itaú..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="banco">Conta Bancária</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Informações adicionais..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : contas.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
              <Button className="mt-4" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Conta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(conta.tipo)}
                        {getTipoLabel(conta.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {conta.descricao || "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        Number(conta.saldo) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Number(conta.saldo))}
                    </TableCell>
                    <TableCell>
                      {conta.status === "ativa" ? (
                        <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(conta)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
