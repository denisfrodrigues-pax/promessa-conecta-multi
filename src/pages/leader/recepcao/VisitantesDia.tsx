import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MessageCircle, UserCheck, Calendar, Loader2, Users } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Visitante {
  id: string;
  nome: string;
  telefone: string | null;
  culto: string | null;
  status: string | null;
  created_at: string | null;
  data_visita: string | null;
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

const PROXIMO_STATUS: Record<string, string> = {
  novo: 'contato_iniciado',
};

const cleanPhone = (phone: string | null) => (phone ?? '').replace(/\D/g, '');
const hasValidPhone = (phone: string | null) => cleanPhone(phone).length >= 10;

const getWhatsAppUrl = (phone: string | null) => {
  const msg = encodeURIComponent('Olá! Sou da Igreja da Promessa. Estou entrando em contato sobre sua visita :)');
  return `https://wa.me/55${cleanPhone(phone)}?text=${msg}`;
};

export default function VisitantesDia() {
  const queryClient = useQueryClient();
  const [filtroData, setFiltroData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [avancando, setAvancando] = useState<string | null>(null);

  const { data: visitantes, isLoading } = useQuery({
    queryKey: ['recepcao_visitantes_dia', filtroData],
    queryFn: async () => {
      const dataInicio = `${filtroData}T00:00:00`;
      const dataFim = `${filtroData}T23:59:59`;

      const { data, error } = await supabase
        .from('visitantes')
        .select('id, nome, telefone, culto, status, created_at, data_visita')
        .gte('created_at', dataInicio)
        .lte('created_at', dataFim)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Visitante[];
    },
  });

  const avancarStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: string }) => {
      const { error } = await supabase
        .from('visitantes')
        .update({ status: novoStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: ({ id }) => setAvancando(id),
    onSuccess: (_, { novoStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['recepcao_visitantes_dia', filtroData] });
      toast.success(`Status atualizado para "${STATUS_LABELS[novoStatus]}"`);
    },
    onError: () => toast.error('Erro ao atualizar status'),
    onSettled: () => setAvancando(null),
  });

  const ehHoje = filtroData === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitantes do Dia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ehHoje ? 'Visitantes de hoje' : `Visitantes de ${format(parseISO(filtroData), "d 'de' MMMM", { locale: ptBR })}`}
            {visitantes && ` · ${visitantes.length} registro${visitantes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="w-44"
          />
          {!ehHoje && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltroData(format(new Date(), 'yyyy-MM-dd'))}
            >
              Hoje
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !visitantes || visitantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {ehHoje ? 'Nenhum visitante registrado hoje.' : 'Nenhum visitante nesta data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitantes.map((v) => {
            const status = v.status ?? 'novo';
            const proximoStatus = PROXIMO_STATUS[status];

            return (
              <Card key={v.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{v.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS['novo']}`}>
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {v.telefone && <span>{v.telefone}</span>}
                        {v.culto && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {v.culto}
                          </span>
                        )}
                        {v.created_at && (
                          <span className="text-xs">
                            {format(new Date(v.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasValidPhone(v.telefone) && (
                        <a
                          href={getWhatsAppUrl(v.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </a>
                      )}

                      {proximoStatus && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={avancando === v.id}
                          onClick={() =>
                            avancarStatusMutation.mutate({ id: v.id, novoStatus: proximoStatus })
                          }
                        >
                          {avancando === v.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              {STATUS_LABELS[proximoStatus]}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
