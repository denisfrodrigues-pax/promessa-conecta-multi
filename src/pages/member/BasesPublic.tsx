import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Clock, ChevronRight, Search, Home } from 'lucide-react';

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
  lider: {
    nome: string;
  } | null;
  membros_count: number;
}

export default function BasesPublic() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    try {
      const { data: basesData, error } = await supabase
        .from('bases')
        .select(`
          id,
          nome,
          descricao,
          dia_semana,
          horario,
          local,
          capacidade,
          visibilidade,
          lider_id,
          lider:membros!bases_lider_id_fkey(nome)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      // Get member counts for each base
      const basesWithCounts = await Promise.all(
        (basesData || []).map(async (base) => {
          const { count } = await supabase
            .from('bases_membros')
            .select('*', { count: 'exact', head: true })
            .eq('base_id', base.id)
            .eq('status', 'ativo');

          return {
            ...base,
            membros_count: count || 0,
          };
        })
      );

      setBases(basesWithCounts);
    } catch (error) {
      console.error('Error fetching bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDiaHorario = (dia: string | null, horario: string | null) => {
    if (!dia && !horario) return null;
    const parts = [];
    if (dia) parts.push(dia.toLowerCase());
    if (horario) parts.push(horario);
    return parts.join(' • ');
  };

  const isLotada = (base: Base) => {
    if (!base.capacidade) return false;
    return base.membros_count >= base.capacidade;
  };

  const filteredBases = bases.filter((base) =>
    base.nome.toLowerCase().includes(search.toLowerCase()) ||
    base.local?.toLowerCase().includes(search.toLowerCase()) ||
    base.lider?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 md:pb-6">
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/banner_home_placeholder.png')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-2xl">
            <Badge className="bg-church-gold text-primary-foreground mb-4">
              <Home className="w-3 h-3 mr-1" />
              Comunidade
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Encontre uma Base
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-6">
              Nossas Bases são pequenos grupos onde você pode crescer na fé, fazer amizades e ser acompanhado de perto.
            </p>
            <Button asChild variant="gold" size="lg">
              <Link to="/sou-novo">Sou Novo Aqui</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, local ou líder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filteredBases.length} {filteredBases.length === 1 ? 'base encontrada' : 'bases encontradas'}</span>
        </div>

        {/* Bases Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma base encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBases.map((base) => (
              <Link key={base.id} to={`/bases/${base.id}`}>
                <Card className="shadow-card hover:shadow-elevated transition-all duration-300 h-full group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      {isLotada(base) && (
                        <Badge variant="destructive" className="text-xs">
                          Lotada
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {base.nome}
                    </h3>

                    {base.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {base.descricao}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {formatDiaHorario(base.dia_semana, base.horario) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-church-gold" />
                          <span>{formatDiaHorario(base.dia_semana, base.horario)}</span>
                        </div>
                      )}

                      {base.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="truncate">{base.local}</span>
                        </div>
                      )}

                      {base.lider?.nome && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Líder: {base.lider.nome}</span>
                        </div>
                      )}

                      {base.capacidade && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {base.membros_count}/{base.capacidade} membros
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-primary font-medium group-hover:underline">
                        Ver detalhes
                      </span>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
