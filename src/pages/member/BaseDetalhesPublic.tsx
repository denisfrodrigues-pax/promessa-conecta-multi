import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Clock, ArrowLeft, User, Info, AlertCircle } from 'lucide-react';

interface Base {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number | null;
  visibilidade: string | null;
  lider_id: string | null;
  lider: { nome: string } | null;
  membros_count: number;
}

const formatDiaHorario = (dia: string | null, horario: string | null) => {
  if (!dia && !horario) return null;
  const parts = [];
  if (dia) parts.push(dia.toLowerCase());
  if (horario) parts.push(horario);
  return parts.join(' • ');
};

export default function BaseDetalhesPublic() {
  const { id } = useParams<{ id: string }>();
  const [base, setBase] = useState<Base | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchBase();
  }, [id]);

  const fetchBase = async () => {
    try {
      const { data, error } = await supabase
        .from('bases')
        .select(`
          id, nome, descricao, dia_semana, horario, local, capacidade, visibilidade, lider_id,
          lider:membros!bases_lider_id_fkey(nome)
        `)
        .eq('id', id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setBase(null);
        return;
      }

      const { count } = await supabase
        .from('bases_membros')
        .select('*', { count: 'exact', head: true })
        .eq('base_id', id)
        .eq('status', 'ativo');

      setBase({ ...data, membros_count: count || 0 });
    } catch (error) {
      console.error('Error fetching base:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLotada = () => {
    if (!base?.capacidade) return false;
    return base.membros_count >= base.capacidade;
  };

  const getOcupacaoPercent = () => {
    if (!base?.capacidade) return 0;
    return Math.min(100, (base.membros_count / base.capacidade) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!base) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Base não encontrada</h2>
            <p className="text-muted-foreground mb-6">
              Esta base não existe ou não está mais disponível.
            </p>
            <Button asChild>
              <Link to="/bases">Voltar para Bases</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner_home_placeholder.png')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
          >
            <Link to="/bases">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Bases
            </Link>
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-display font-bold">
                  {base.nome}
                </h1>
                {isLotada() && (
                  <Badge variant="destructive">Lotada</Badge>
                )}
              </div>
              {base.descricao && (
                <p className="text-lg text-primary-foreground/80 max-w-2xl">
                  {base.descricao}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Informações da Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formatDiaHorario(base.dia_semana, base.horario) && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-church-gold/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-church-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dia e Horário</p>
                      <p className="font-medium">{formatDiaHorario(base.dia_semana, base.horario)}</p>
                    </div>
                  </div>
                )}

                {base.local && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Local</p>
                      <p className="font-medium">{base.local}</p>
                    </div>
                  </div>
                )}

                {base.lider?.nome && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Líder</p>
                      <p className="font-medium">{base.lider.nome}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capacity Card */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Capacidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">
                    {base.membros_count}
                    <span className="text-xl text-muted-foreground font-normal">
                      /{base.capacidade || '∞'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">membros ativos</p>
                </div>

                {base.capacidade && (
                  <>
                    <Progress
                      value={getOcupacaoPercent()}
                      className={`h-3 mb-2 ${isLotada() ? '[&>div]:bg-destructive' : ''}`}
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.round(getOcupacaoPercent())}% ocupada
                    </p>
                  </>
                )}

                {isLotada() && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    Esta base atingiu a capacidade máxima
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="shadow-card bg-gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center">
                <h3 className="font-display font-semibold text-lg mb-2">
                  Quer participar?
                </h3>
                <p className="text-sm text-primary-foreground/80 mb-4">
                  Entre em contato conosco para conhecer esta base e começar a participar.
                </p>
                <Button asChild className="w-full">
                  <Link to="/sou-novo">Quero Participar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
