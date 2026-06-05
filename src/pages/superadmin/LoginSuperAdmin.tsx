import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Check } from 'lucide-react';
import { RedeConectLogo } from '@/components/RedeConectLogo';

const FEATURES = [
  'Gerenciamento centralizado de múltiplas igrejas',
  'Dashboard financeiro e relatórios em tempo real',
  'Escalas, ministérios e comunicação integrados',
];

export default function LoginSuperAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleRows } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        if (roleRows?.some(r => r.role === 'superadmin')) {
          navigate('/admin', { replace: true });
          return;
        }
      }
      setChecking(false);
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado após login');

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isSuperAdmin = roleRows?.some(r => r.role === 'superadmin');
      if (!isSuperAdmin) {
        await supabase.auth.signOut();
        toast.error('Acesso restrito. Esta área é exclusiva para super-admins.');
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--rc-bg-deep)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--rc-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--rc-bg-deep)' }}>
      {/* Left panel — branding (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-[60%] flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, var(--rc-bg-deep) 0%, var(--rc-bg-surface) 100%)',
          borderRight: '1px solid var(--rc-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <RedeConectLogo size={44} />
          <div>
            <span className="font-bold text-white text-xl">Rede Conect</span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--rc-text-secondary)' }}>
              Sistema de Gestão Eclesiástica
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Gestão eclesiástica<br />
              <span style={{ color: 'var(--rc-primary)' }}>inteligente</span> para<br />
              igrejas que crescem
            </h1>
            <p className="text-lg mt-4" style={{ color: 'var(--rc-text-secondary)' }}>
              Centralize a gestão de todas as suas igrejas em uma única plataforma poderosa.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--rc-accent-glow)', border: '1px solid var(--rc-primary)' }}
                >
                  <Check className="w-3 h-3" style={{ color: 'var(--rc-primary)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--rc-text-secondary)' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'var(--rc-text-muted)' }}>
          © 2025 Rede Conect. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <RedeConectLogo size={40} />
          <span className="font-bold text-white text-lg">Rede Conect</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Entrar</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--rc-text-secondary)' }}>
              Acesso exclusivo para administradores do sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--rc-text-secondary)' }}>
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--rc-text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="admin@redeconect.com.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#64748B] outline-none transition-colors"
                  style={{
                    background: 'var(--rc-bg-card)',
                    border: '1px solid var(--rc-border)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--rc-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--rc-border)')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--rc-text-secondary)' }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--rc-text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#64748B] outline-none transition-colors"
                  style={{
                    background: 'var(--rc-bg-card)',
                    border: '1px solid var(--rc-border)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--rc-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--rc-border)')}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 mt-2"
              style={{ background: 'var(--rc-primary)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--rc-primary-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--rc-primary)')}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
