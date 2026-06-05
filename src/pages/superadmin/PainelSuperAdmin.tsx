import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RedeConectLogo } from '@/components/RedeConectLogo';
import {
  Building2, Plus, ExternalLink, LogOut, RefreshCw,
  MapPin, Calendar, Globe, Loader2,
} from 'lucide-react';

interface Igreja {
  id: string;
  nome: string;
  slug: string;
  plano: string | null;
  ativo: boolean;
  created_at: string;
  cidade: string | null;
  estado: string | null;
  logo_url: string | null;
}

const PLANO_BADGE: Record<string, { label: string; classes: string }> = {
  teste:    { label: 'Teste',    classes: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  basico:   { label: 'Básico',  classes: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  completo: { label: 'Completo', classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
};

export default function PainelSuperAdmin() {
  const navigate = useNavigate();
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIgrejas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('igrejas')
      .select('id, nome, slug, plano, ativo, created_at, cidade, estado, logo_url')
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
    <div className="min-h-screen" style={{ background: 'var(--rc-bg-deep)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--rc-bg-surface)', borderBottom: '1px solid var(--rc-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <RedeConectLogo size={36} />
            <div>
              <span className="font-bold text-white text-base leading-none">Rede Conect</span>
              <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--rc-text-secondary)' }}>
                Plataforma de Gestão Eclesiástica
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchIgrejas}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50"
              style={{ color: 'var(--rc-text-secondary)', border: '1px solid var(--rc-border)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => navigate('/admin/igrejas/nova')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: 'var(--rc-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--rc-primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--rc-primary)')}
            >
              <Plus className="w-4 h-4" />
              Nova Igreja
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{ color: 'var(--rc-text-muted)' }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Igrejas Cadastradas</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--rc-text-secondary)' }}>
            {!loading && `${igrejas.length} ${igrejas.length === 1 ? 'igreja' : 'igrejas'} no sistema`}
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-52 rounded-xl animate-pulse"
                style={{ background: 'var(--rc-bg-card)', border: '1px solid var(--rc-border)' }}
              />
            ))}
          </div>
        ) : igrejas.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div
              className="inline-flex p-5 rounded-full mb-4"
              style={{ background: 'var(--rc-bg-card)', border: '1px solid var(--rc-border)' }}
            >
              <Globe className="w-10 h-10" style={{ color: 'var(--rc-border)' }} />
            </div>
            <p className="text-lg font-medium text-white mb-1">Nenhuma igreja cadastrada</p>
            <p className="text-sm mb-6" style={{ color: 'var(--rc-text-secondary)' }}>
              Crie a primeira igreja para começar
            </p>
            <button
              onClick={() => navigate('/admin/igrejas/nova')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--rc-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--rc-primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--rc-primary)')}
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Igreja
            </button>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {igrejas.map(igreja => {
              const plano = PLANO_BADGE[igreja.plano ?? 'teste'] ?? PLANO_BADGE.teste;
              return (
                <div
                  key={igreja.id}
                  className="rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 group"
                  style={{
                    background: 'var(--rc-bg-card)',
                    border: '1px solid var(--rc-border)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,180,216,0.4)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,180,216,0.05)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--rc-border)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Linha 1: logo + nome + status */}
                  <div className="flex items-center gap-3">
                    {igreja.logo_url ? (
                      <img
                        src={igreja.logo_url}
                        alt={igreja.nome}
                        className="w-10 h-10 rounded-lg object-contain bg-white/5 flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--rc-bg-surface)', border: '1px solid var(--rc-border)' }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: 'var(--rc-text-muted)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate text-sm">{igreja.nome}</h3>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--rc-text-muted)' }}>
                        {igreja.slug}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        igreja.ativo
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {igreja.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  {/* Linha 2: localização */}
                  {(igreja.cidade || igreja.estado) && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--rc-text-secondary)' }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{[igreja.cidade, igreja.estado].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {/* Linha 3: plano + data */}
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--rc-text-secondary)' }}>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${plano.classes}`}>
                      {plano.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(igreja.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Botão acessar */}
                  {igreja.slug ? (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white transition-colors mt-auto"
                      style={{ background: 'var(--rc-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--rc-primary-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--rc-primary)')}
                      onClick={() => navigate(`/i/${igreja.slug}/admin/dashboard`)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar Painel
                    </button>
                  ) : (
                    <p className="text-xs text-center py-2 rounded-lg" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      Slug não configurado
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
