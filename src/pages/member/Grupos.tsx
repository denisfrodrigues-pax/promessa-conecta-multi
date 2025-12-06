import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, Users, MapPin, Clock, ChevronRight, CheckCircle } from 'lucide-react';

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  dia_semana: string | null;
  horario: string | null;
  local: string | null;
  capacidade: number;
  lider_id: string | null;
}

interface Profile {
  id: string;
  nome: string;
}

export default function MemberGrupos() {
  const { profile } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [meusGrupos, setMeusGrupos] = useState<string[]>([]);
  const [pendingGrupos, setPendingGrupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const [gruposRes, profilesRes, participacoesRes] = await Promise.all([
        supabase.from('grupos').select('*').eq('visibilidade', 'publica').order('nome'),
        supabase.from('profiles').select('id, nome'),
        profile ? supabase.from('grupos_participantes').select('grupo_id, status').eq('usuario_id', profile.id) : Promise.resolve({ data: [] }),
      ]);

      setGrupos(gruposRes.data || []);
      setProfiles(profilesRes.data || []);
      
      const participacoes = participacoesRes.data || [];
      setMeusGrupos(participacoes.filter((p: any) => p.status === 'ativo').map((p: any) => p.grupo_id));
      setPendingGrupos(participacoes.filter((p: any) => p.status === 'pendente').map((p: any) => p.grupo_id));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLiderNome = (liderId: string | null) => {
    if (!liderId) return 'Sem líder definido';
    const lider = profiles.find((p) => p.id === liderId);
    return lider?.nome || 'Líder';
  };

  const handleSolicitarEntrada = async () => {
    if (!selectedGrupo || !profile) return;

    try {
      const { error } = await supabase.from('grupos_participantes').insert({
        grupo_id: selectedGrupo.id,
        usuario_id: profile.id,
        status: 'pendente',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já solicitou participação neste grupo');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Solicitação enviada! O líder irá avaliar.');
      setSelectedGrupo(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao solicitar entrada');
    }
  };

  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(search.toLowerCase()) ||
    grupo.local?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Grupos</h1>
        <p className="text-muted-foreground">Encontre um grupo para participar</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou local..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredGrupos.map((grupo) => {
          const isMember = meusGrupos.includes(grupo.id);
          const isPending = pendingGrupos.includes(grupo.id);

          return (
            <Card 
              key={grupo.id} 
              className={`shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer ${isMember ? 'ring-2 ring-primary' : ''}`}
              onClick={() => !isMember && !isPending && setSelectedGrupo(grupo)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold">{grupo.nome}</h3>
                      {isMember && (
                        <Badge className="bg-primary text-primary-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Participando
                        </Badge>
                      )}
                      {isPending && (
                        <Badge variant="secondary">Solicitação Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Líder: {getLiderNome(grupo.lider_id)}
                    </p>
                    {grupo.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{grupo.descricao}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {grupo.dia_semana && grupo.horario && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {grupo.dia_semana} às {grupo.horario}
                        </div>
                      )}
                      {grupo.local && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {grupo.local}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Até {grupo.capacidade} pessoas
                      </div>
                    </div>
                  </div>
                  {!isMember && !isPending && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredGrupos.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum grupo encontrado
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Solicitação */}
      <Dialog open={!!selectedGrupo} onOpenChange={() => setSelectedGrupo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGrupo?.nome}</DialogTitle>
            <DialogDescription>
              Detalhes do grupo e solicitação de entrada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedGrupo?.descricao && (
              <p className="text-muted-foreground">{selectedGrupo.descricao}</p>
            )}
            <div className="space-y-2 text-sm">
              <p><strong>Líder:</strong> {getLiderNome(selectedGrupo?.lider_id || null)}</p>
              {selectedGrupo?.dia_semana && selectedGrupo?.horario && (
                <p><strong>Encontro:</strong> {selectedGrupo.dia_semana} às {selectedGrupo.horario}</p>
              )}
              {selectedGrupo?.local && (
                <p><strong>Local:</strong> {selectedGrupo.local}</p>
              )}
              <p><strong>Capacidade:</strong> {selectedGrupo?.capacidade} pessoas</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGrupo(null)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSolicitarEntrada}>
              Solicitar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
