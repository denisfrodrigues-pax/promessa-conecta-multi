import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Baby, Music, BookOpen, Users, Heart, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Ministry {
  ministerio_id: string;
  nome: string;
  slug: string | null;
  descricao: string | null;
}

// Map ministry slugs to icons and routes
const SLUG_CONFIG: Record<string, { icon: typeof Baby; route: string | null; color: string }> = {
  kids: { icon: Baby, route: '/kids/check-in', color: 'text-pink-600 bg-pink-100' },
  louvor: { icon: Music, route: null, color: 'text-purple-600 bg-purple-100' },
  ensino: { icon: BookOpen, route: null, color: 'text-blue-600 bg-blue-100' },
  recepcao: { icon: Users, route: null, color: 'text-green-600 bg-green-100' },
};

const DEFAULT_CONFIG = { icon: Heart, route: null, color: 'text-amber-600 bg-amber-100' };

const getMinistryConfig = (slug: string | null) => {
  if (!slug) return DEFAULT_CONFIG;
  return SLUG_CONFIG[slug] ?? DEFAULT_CONFIG;
};

export default function VoluntarioDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_ministries');
      if (error) throw error;
      const parsed: Ministry[] = (data ?? []) as Ministry[];
      setMinistries(parsed);
    } catch (error: any) {
      console.error('Erro ao buscar ministérios:', error);
      toast({ title: 'Erro ao carregar ministérios', description: error?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMinistryClick = (ministry: Ministry) => {
    const config = getMinistryConfig(ministry.slug);
    if (config.route) {
      navigate(config.route);
    } else {
      toast({ title: `Módulo "${ministry.nome}"`, description: 'Em breve! Este módulo está sendo preparado.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel do Voluntário</h1>
        <p className="text-muted-foreground">
          Olá, {profile?.nome?.split(' ')[0]}! Acesse os módulos dos seus ministérios.
        </p>
      </div>

      {ministries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ministério vinculado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não está vinculado a um ministério ativo. 
              Fale com a administração da igreja para ser adicionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ministries.map(ministry => {
            const config = getMinistryConfig(ministry.slug);
            const Icon = config.icon;
            return (
              <Card
                key={ministry.ministerio_id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleMinistryClick(ministry)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{ministry.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {config.route ? 'Clique para acessar' : 'Em breve'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
