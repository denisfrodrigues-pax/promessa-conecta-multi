import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_visita: string | null;
  culto: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
}

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  membro_em_potencial: 'Membro em Potencial',
};

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  contatado: 'bg-yellow-100 text-yellow-800',
  membro_em_potencial: 'bg-green-100 text-green-800',
};

export default function Visitantes() {
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisitantes();
  }, [filtroStatus]);

  const fetchVisitantes = async () => {
    try {
      let query = supabase
        .from('visitantes')
        .select('*')
        .order('data_visita', { ascending: false });

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisitantes(data || []);
    } catch (error) {
      console.error('Erro ao buscar visitantes:', error);
      toast.error('Erro ao carregar visitantes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCulto = (culto: string | null) => {
    if (!culto) return '-';
    const cultoLabels: Record<string, string> = {
      domingo_manha: 'Domingo - Manhã',
      domingo_noite: 'Domingo - Noite',
      quarta: 'Quarta-feira',
      outro: 'Outro',
    };
    return cultoLabels[culto] || culto;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Visitantes</h1>
          <p className="text-muted-foreground">Gerencie os visitantes da igreja</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visitantes.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitantes.filter((v) => v.status === 'novo').length}
                </p>
                <p className="text-sm text-muted-foreground">Novos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitantes.filter((v) => v.status === 'contatado').length}
                </p>
                <p className="text-sm text-muted-foreground">Contatados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitantes.filter((v) => v.status === 'membro_em_potencial').length}
                </p>
                <p className="text-sm text-muted-foreground">Em Potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Lista de Visitantes
          </CardTitle>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="novo">Novos</SelectItem>
              <SelectItem value="contatado">Contatados</SelectItem>
              <SelectItem value="membro_em_potencial">Membro em Potencial</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : visitantes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum visitante encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data da Visita</TableHead>
                  <TableHead>Culto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitantes.map((visitante) => (
                  <TableRow key={visitante.id}>
                    <TableCell className="font-medium">{visitante.nome}</TableCell>
                    <TableCell>{visitante.telefone || '-'}</TableCell>
                    <TableCell>{formatDate(visitante.data_visita)}</TableCell>
                    <TableCell>{formatCulto(visitante.culto)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[visitante.status || 'novo']}>
                        {statusLabels[visitante.status || 'novo']}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/visitantes/${visitante.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
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
