import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, Plus, ExternalLink, LogOut, RefreshCw, MapPin, Calendar } from 'lucide-react';

interface Igreja {
  id: string;
  nome: string;
  slug: string;
  plano: string | null;
  ativo: boolean;
  created_at: string;
  cidade: string | null;
  estado: string | null;
}

export default function PainelSuperAdmin() {
  const navigate = useNavigate();
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIgrejas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('igrejas')
      .select('id, nome, slug, plano, ativo, created_at, cidade, estado')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar igrejas: ' + error.message);
    } else {
      setIgrejas((data ?? []) as Igreja[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchIgrejas(); }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-promessa-100 rounded-lg">
              <Building2 className="w-5 h-5 text-promessa-700" />
            </div>
            <div>
              <h1 className="font-display font-bold text-promessa-700">Super Admin</h1>
              <p className="text-xs text-neutral-500">Promessa Conecta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchIgrejas} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/igrejas/nova')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Igreja
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-display font-bold text-neutral-900">Igrejas Cadastradas</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {!loading && `${igrejas.length} ${igrejas.length === 1 ? 'igreja' : 'igrejas'} no sistema`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : igrejas.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-neutral-100 rounded-full">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <div>
              <p className="text-neutral-700 font-medium">Nenhuma igreja cadastrada</p>
              <p className="text-neutral-500 text-sm mt-1">Crie a primeira igreja para começar</p>
            </div>
            <Button onClick={() => navigate('/admin/igrejas/nova')}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Igreja
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {igrejas.map(igreja => (
              <div
                key={igreja.id}
                className="bg-white rounded-2xl border p-5 space-y-3 hover:border-promessa-300 hover:shadow-sm transition-all"
              >
                {/* Nome e status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{igreja.nome}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{igreja.slug}</p>
                  </div>
                  <Badge
                    variant={igreja.ativo ? 'default' : 'secondary'}
                    className="flex-shrink-0 text-xs"
                  >
                    {igreja.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                {/* Localização */}
                {(igreja.cidade || igreja.estado) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{[igreja.cidade, igreja.estado].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {/* Plano + data */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="bg-neutral-100 px-2 py-0.5 rounded font-medium">
                    {igreja.plano ?? 'teste'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(igreja.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Botão de acesso */}
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => navigate(`/i/${igreja.slug}/admin/dashboard`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acessar Painel
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
