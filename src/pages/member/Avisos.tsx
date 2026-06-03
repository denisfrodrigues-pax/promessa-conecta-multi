import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

export default function MemberAvisos() {
  const { churchId } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (churchId) fetchAvisos();
  }, [churchId]);

  const fetchAvisos = async () => {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('church_id', churchId ?? '')
        .eq('publico', true)
        .order('data_publicacao', { ascending: false });

      if (error) throw error;
      setAvisos(data || []);
    } catch (error) {
      console.error('Error fetching avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAvisos = avisos.filter((aviso) =>
    aviso.titulo.toLowerCase().includes(search.toLowerCase()) ||
    aviso.conteudo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold tracking-tight">Avisos</h1>
        <p className="text-muted-foreground mt-1">Comunicados e informações importantes</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar avisos..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredAvisos.map((aviso, index) => (
          <Card 
            key={aviso.id} 
            className="shadow-card border-0 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-7 h-7 text-violet-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg mb-2">{aviso.titulo}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{aviso.conteudo}</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    {format(new Date(aviso.data_publicacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredAvisos.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum aviso encontrado
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
