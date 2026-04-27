import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Search, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  culto: string | null;
  status: string | null;
  created_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contato_iniciado: 'Contato Iniciado',
  em_acompanhamento: 'Em Acompanhamento',
  concluido: 'Concluído',
};

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-amber-100 text-amber-800 border-amber-300',
  contato_iniciado: 'bg-blue-100 text-blue-800 border-blue-300',
  em_acompanhamento: 'bg-purple-100 text-purple-800 border-purple-300',
  concluido: 'bg-green-100 text-green-800 border-green-300',
};

const cleanPhone = (phone: string | null) => (phone ?? '').replace(/\D/g, '');
const hasValidPhone = (phone: string | null) => cleanPhone(phone).length >= 10;

const getWhatsAppUrl = (phone: string | null) => {
  const msg = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/55${cleanPhone(phone)}?text=${msg}`;
};

const POR_PAGINA = 20;

const sanitize = (s: string) => s.replace(/[%_\\]/g, '\\$&').trim();

export default function VisitantesHistorico() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['recepcao_visitantes_historico', busca, filtroStatus, pagina],
    queryFn: async () => {
      const from = (pagina - 1) * POR_PAGINA;
      const to = from + POR_PAGINA - 1;

      let q = supabase
        .from('visitantes')
        .select('id, nome, telefone, culto, status, created_at', { count: 'exact' })
        .neq('status', 'concluido')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (busca) {
        const s = sanitize(busca);
        q = q.or(`nome.ilike.%${s}%,telefone.ilike.%${s}%`);
      }
      if (filtroStatus) q = q.eq('status', filtroStatus);

      const { data: rows, count, error } = await q;
      if (error) throw error;
      return { rows: (rows ?? []) as Visitante[], total: count ?? 0 };
    },
  });

  const totalPaginas = Math.ceil((data?.total ?? 0) / POR_PAGINA);

  const handleBusca = (val: string) => {
    setBusca(val);
    setPagina(1);
  };

  const handleStatus = (val: string) => {
    setFiltroStatus(val);
    setPagina(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Visitantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.total} visitante${data.total !== 1 ? 's' : ''} (exceto concluídos)` : '…'}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou telefone…"
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          value={filtroStatus}
          onChange={(e) => handleStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'concluido').map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(busca || filtroStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setBusca(''); setFiltroStatus(''); setPagina(1); }}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.rows.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca || filtroStatus ? 'Nenhum visitante encontrado.' : 'Nenhum visitante cadastrado.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.rows.map((v) => {
              const status = v.status ?? 'novo';
              return (
                <Card key={v.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-foreground">{v.nome}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS['novo']}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {v.telefone && <span>{v.telefone}</span>}
                          {v.culto && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {v.culto}
                            </span>
                          )}
                          {v.created_at && (
                            <span>
                              {format(new Date(v.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      {hasValidPhone(v.telefone) && (
                        <a
                          href={getWhatsAppUrl(v.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
