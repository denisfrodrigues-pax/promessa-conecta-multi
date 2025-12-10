import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Bell, Users, ChevronRight, Heart, MapPin, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  local: string | null;
}

export default function MemberHome() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [avisosRes, eventosRes] = await Promise.all([
        supabase
          .from('avisos')
          .select('*')
          .eq('publico', true)
          .order('data_publicacao', { ascending: false })
          .limit(3),
        supabase
          .from('eventos')
          .select('*')
          .gte('data_inicio', new Date().toISOString())
          .order('data_inicio', { ascending: true })
          .limit(3),
      ]);

      setAvisos(avisosRes.data || []);
      setEventos(eventosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-6">
      {/* Hero Banner - Premium with refined overlay */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner_home_placeholder.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-promessa-900/40 to-promessa-700/20" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl">
            <Badge className="bg-white/20 text-white border border-white/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Bem-vindo
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-white">
              Olá, {profile?.nome?.split(' ')[0] || 'Visitante'}!
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Seja bem-vindo à Igreja da Promessa. Aqui você encontra todas as informações e recursos da nossa comunidade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="promessa" size="lg" className="bg-white text-promessa-700 hover:bg-white/90 font-semibold">
                <Link to="/sou-novo">Sou Novo Aqui</Link>
              </Button>
              <Button asChild size="lg" className="bg-white/10 text-white border border-white/30 hover:bg-white/20 font-semibold">
                <Link to="/bases">Encontrar uma Base</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions - Premium Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/bases" className="group">
            <Card className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150 h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-xl bg-neutral-100 text-promessa-700 mb-3 group-hover:bg-promessa-100 transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground">Bases</h3>
                <p className="text-xs text-muted-foreground">Encontre sua base</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/eventos" className="group">
            <Card className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150 h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-xl bg-neutral-100 text-promessa-700 mb-3 group-hover:bg-promessa-100 transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground">Eventos</h3>
                <p className="text-xs text-muted-foreground">Próximas atividades</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/oracao" className="group">
            <Card className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150 h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-xl bg-neutral-100 text-promessa-700 mb-3 group-hover:bg-promessa-100 transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground">Oração</h3>
                <p className="text-xs text-muted-foreground">Pedidos de oração</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/avisos" className="group">
            <Card className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150 h-full">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-3 rounded-xl bg-neutral-100 text-promessa-700 mb-3 group-hover:bg-promessa-100 transition-colors">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-foreground">Avisos</h3>
                <p className="text-xs text-muted-foreground">Comunicados</p>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Avisos Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Últimos Avisos</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/avisos">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {avisos.map((aviso) => (
              <Card key={aviso.id} className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-promessa-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{aviso.titulo}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{aviso.conteudo}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(aviso.data_publicacao), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {avisos.length === 0 && !loading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum aviso no momento
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Eventos Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Próximos Eventos</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/eventos">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {eventos.map((evento) => (
              <Link key={evento.id} to={`/eventos/${evento.id}`}>
                <Card className="rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-150 h-full overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-promessa-500 to-promessa-700 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-white/30" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                      {evento.titulo}
                    </h3>
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(evento.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {evento.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{evento.local}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {eventos.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum evento programado
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
