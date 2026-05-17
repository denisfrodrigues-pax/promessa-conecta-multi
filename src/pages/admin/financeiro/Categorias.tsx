import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, TrendingUp, TrendingDown, Tag } from "lucide-react";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nome: string;
  natureza: string;
  descricao: string | null;
}

export default function Categorias() {
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("todas");

  // Form
  const [nome, setNome] = useState("");
  const [natureza, setNatureza] = useState("receita");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .order("natureza")
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNome("");
    setNatureza("receita");
    setDescricao("");
    setEditingId(null);
  };

  const openEditModal = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setNome(categoria.nome);
    setNatureza(categoria.natureza);
    setDescricao(categoria.descricao || "");
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
        natureza,
        descricao: descricao.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("categorias_financeiras")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Categoria atualizada!");
      } else {
        const { error } = await supabase.from("categorias_financeiras").insert(payload);

        if (error) throw error;
        toast.success("Categoria criada!");
      }

      setModalOpen(false);
      resetForm();
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  };

  const filteredCategorias = categorias.filter((c) => {
    if (activeTab === "todas") return true;
    return c.natureza === activeTab;
  });

  const receitasCount = categorias.filter((c) => c.natureza === "receita").length;
  const despesasCount = categorias.filter((c) => c.natureza === "despesa").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de receitas e despesas</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Dízimo, Aluguel, Material..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="natureza">Natureza *</Label>
                <Select value={natureza} onValueChange={setNatureza}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição da categoria..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                />
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="todas">
                Todas ({categorias.length})
              </TabsTrigger>
              <TabsTrigger value="receita">
                <TrendingUp className="h-4 w-4 mr-1" />
                Receitas ({receitasCount})
              </TabsTrigger>
              <TabsTrigger value="despesa">
                <TrendingDown className="h-4 w-4 mr-1" />
                Despesas ({despesasCount})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCategorias.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell>
                        {categoria.natureza === "receita" ? (
                          <Badge className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Receita
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Despesa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {categoria.descricao || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(categoria)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
