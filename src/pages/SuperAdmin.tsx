import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Building2, Users, LogOut, CheckCircle, XCircle,
  RefreshCw, Shield, TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Plano = 'teste' | 'basico' | 'completo';

interface IgrejaRow {
  id: string;
  nome: string;
  slug: string | null;
  plano: Plano | null;
  ativo: boolean;
  responsavel_nome: string | null;
  responsavel_email: string | null;
  created_at: string;
  membros_count: number;
}

const PLANO_LABELS: Record<Plano, string> = {
  teste: 'Teste',
  basico: 'Básico',
  completo: 'Completo',
};

const PLANO_COLORS: Record<Plano, string> = {
  teste: 'bg-amber-100 text-amber-800',
  basico: 'bg-blue-100 text-blue-800',
  completo: 'bg-green-100 text-green-800',
};

export default function SuperAdmin() {
  const { roles, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [igrejas, setIgrejas] = useState<IgrejaRow[]>([]);
  const [fetching, setFetching] = useState(true);

  // Guard: apenas superadmin
  useEffect(() => {
    if (!loading && !roles.includes('superadmin')) {
      navigate('/app', { replace: true });
    }
  }, [roles, loading, navigate]);

  useEffect(() => {
    if (roles.includes('superadmin')) fetchIgrejas();
  }, [roles]);

  const fetchIgrejas = async () => {
    setFetching(true);
    try {
      // Busca todas as igrejas
      const { data: igrejasData, error } = await supabase
        .from('igrejas')
        .select('id, nome, slug, plano, ativo, responsavel_nome, responsavel_email, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Conta membros por igreja (profiles com church_id = igreja.id)
      const counts = await Promise.all(
        (igrejasData ?? []).map(async (ig) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', ig.id);
          return { id: ig.id, count: count ?? 0 };
        })
      );

      const countMap: Record<string, number> = {};
      counts.forEach(c => { countMap[c.id] = c.count; });

      setIgrejas(
        (igrejasData ?? []).map(ig => ({
          ...ig,
          plano: (ig.plano as Plano) ?? 'teste',
          membros_count: countMap[ig.id] ?? 0,
        }))
      );
    } catch (err: any) {
      toast.error('Erro ao carregar igrejas: ' + err.message);
    } finally {
      setFetching(false);
    }
  };

  const toggleAtivo = async (ig: IgrejaRow) => {
    const novoStatus = !ig.ativo;
    const { error } = await supabase
      .from('igrejas')
      .update({ ativo: novoStatus })
      .eq('id', ig.id);
    if (error) { toast.error('Erro ao atualizar status.'); return; }
    toast.success(`Igreja ${novoStatus ? 'ativada' : 'desativada'} com sucesso.`);
    setIgrejas(prev => prev.map(i => i.id === ig.id ? { ...i, ativo: novoStatus } : i));
  };

  const upgradePlano = async (ig: IgrejaRow, novoPlano: Plano) => {
    const { error } = await supabase
      .from('igrejas')
      .update({ plano: novoPlano })
      .eq('id', ig.id);
    if (error) { toast.error('Erro ao atualizar plano.'); return; }
    toast.success(`Plano atualizado para ${PLANO_LABELS[novoPlano]}.`);
    setIgrejas(prev => prev.map(i => i.id === ig.id ? { ...i, plano: novoPlano } : i));
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalIgrejas = igrejas.length;
  const totalAtivas = igrejas.filter(i => i.ativo).length;
  const totalMembros = igrejas.reduce((s, i) => s + i.membros_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Super Admin</h1>
            <p className="text-xs text-muted-foreground">Promessa Conecta — Painel Global</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchIgrejas}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalIgrejas}</p>
                <p className="text-xs text-muted-foreground">Total de Igrejas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalAtivas}</p>
                <p className="text-xs text-muted-foreground">Igrejas Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalMembros}</p>
                <p className="text-xs text-muted-foreground">Usuários Cadastrados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Igrejas Cadastradas ({totalIgrejas})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {igrejas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma igreja cadastrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left p-3">Igreja</th>
                      <th className="text-left p-3">Responsável</th>
                      <th className="text-center p-3">Membros</th>
                      <th className="text-center p-3">Plano</th>
                      <th className="text-center p-3">Status</th>
                      <th className="text-left p-3">Criado em</th>
                      <th className="text-right p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {igrejas.map(ig => (
                      <tr key={ig.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <p className="font-medium">{ig.nome}</p>
                          {ig.slug && (
                            <p className="text-xs text-muted-foreground font-mono">{ig.slug}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <p>{ig.responsavel_nome ?? '–'}</p>
                          {ig.responsavel_email && (
                            <p className="text-xs text-muted-foreground">{ig.responsavel_email}</p>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">{ig.membros_count}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Select
                            value={ig.plano ?? 'teste'}
                            onValueChange={(v) => upgradePlano(ig, v as Plano)}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="teste">Teste</SelectItem>
                              <SelectItem value="basico">Básico</SelectItem>
                              <SelectItem value="completo">Completo</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={ig.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'}
                          >
                            {ig.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {format(new Date(ig.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(ig)}
                            className={ig.ativo
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                          >
                            {ig.ativo
                              ? <><XCircle className="w-4 h-4 mr-1" />Desativar</>
                              : <><CheckCircle className="w-4 h-4 mr-1" />Ativar</>
                            }
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
