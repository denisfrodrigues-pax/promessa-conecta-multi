import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useChurchConfig } from '@/hooks/useChurchConfig';
import { toast } from 'sonner';
import { Search, Calendar, MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  vagas: number | null;
  imagem_url: string | null;
}

export default function MemberEventos() {
  const { profile } = useAuth();
  const { config } = useChurchConfig();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [inscricoes, setInscricoes] = useState<string[]>([]);
  const [inscricoesCount, setInscricoesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const [eventosRes, inscricoesRes, countRes] = await Promise.all([
        supabase
          .from('eventos')
          .select('*')
          .gte('data_inicio', new Date().toISOString())
          .order('data_inicio', { ascending: true }),
        profile
          ? supabase.from('eventos_inscricoes').select('evento_id').eq('usuario_id', profile.id)
          : Promise.resolve({ data: [] }),
        supabase.from('eventos_inscricoes').select('evento_id'),
      ]);

      setEventos(eventosRes.data || []);
      setInscricoes((inscricoesRes.data || []).map((i: { evento_id: string }) => i.evento_id));

      const counts: Record<string, number> = {};
      (countRes.data || []).forEach((i: { evento_id: string }) => {
        counts[i.evento_id] = (counts[i.evento_id] || 0) + 1;
      });
      setInscricoesCount(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInscrever = async (eventoId: string) => {
    if (!profile) {
      toast.error('Faça login para se inscrever');
      return;
    }

    try {
      const { error } = await supabase.from('eventos_inscricoes').insert({
        evento_id: eventoId,
        usuario_id: profile.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já está inscrito neste evento');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Inscrição realizada com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao realizar inscrição');
    }
  };

  const handleCancelarInscricao = async (eventoId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('eventos_inscricoes')
        .delete()
        .eq('evento_id', eventoId)
        .eq('usuario_id', profile.id);

      if (error) throw error;

      toast.success('Inscrição cancelada');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cancelar inscrição');
    }
  };

  const filteredEventos = eventos.filter((evento) =>
    evento.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const hasCustomLogo = config?.logo_url && !config.logo_url.includes('placeholder');
  const churchName = config?.nome_igreja || 'Igreja da Promessa';

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header with optional logo */}
      <div className="mb-8 flex items-start gap-4">
        {hasCustomLogo && (
          <img 
            src={config.logo_url!} 
            alt={churchName}
            className="h-10 w-auto object-contain"
          />
        )}
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground mt-1">Próximos eventos e atividades</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredEventos.map((evento) => {
          const isInscrito = inscricoes.includes(evento.id);
          const totalInscritos = inscricoesCount[evento.id] || 0;
          const vagasDisponiveis = evento.vagas ? evento.vagas - totalInscritos : null;
          const esgotado = vagasDisponiveis !== null && vagasDisponiveis <= 0;

          return (
            <Card key={evento.id} className="shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image/Date Banner */}
                <div className="md:w-48 bg-gradient-hero relative flex flex-col items-center justify-center text-primary-foreground overflow-hidden">
                  {evento.imagem_url ? (
                    <>
                      <img 
                        src={evento.imagem_url} 
                        alt={evento.titulo}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative z-10 p-6 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold font-display">
                          {format(new Date(evento.data_inicio), 'dd')}
                        </span>
                        <span className="text-sm uppercase">
                          {format(new Date(evento.data_inicio), 'MMM', { locale: ptBR })}
                        </span>
                        <span className="text-xs mt-1 opacity-80">
                          {format(new Date(evento.data_inicio), 'HH:mm')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold font-display">
                        {format(new Date(evento.data_inicio), 'dd')}
                      </span>
                      <span className="text-sm uppercase">
                        {format(new Date(evento.data_inicio), 'MMM', { locale: ptBR })}
                      </span>
                      <span className="text-xs mt-1 opacity-80">
                        {format(new Date(evento.data_inicio), 'HH:mm')}
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display font-semibold text-lg">{evento.titulo}</h3>
                      {isInscrito && (
                        <Badge className="bg-primary text-primary-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Inscrito
                        </Badge>
                      )}
                    </div>

                    {evento.descricao && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{evento.descricao}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {evento.local && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {evento.local}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {totalInscritos} inscritos
                        {evento.vagas && ` / ${evento.vagas} vagas`}
                      </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                      {isInscrito ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelarInscricao(evento.id)}
                        >
                          Cancelar Inscrição
                        </Button>
                      ) : esgotado ? (
                        <Badge variant="secondary">Vagas Esgotadas</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleInscrever(evento.id)}
                        >
                          Inscrever-se
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
        {filteredEventos.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum evento encontrado
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
