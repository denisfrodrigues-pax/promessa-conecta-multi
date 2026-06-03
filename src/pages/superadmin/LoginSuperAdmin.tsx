import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginSuperAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Se já estiver logado como super-admin, redireciona
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-promessa-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm space-y-8 p-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-promessa-100 rounded-full">
              <ShieldCheck className="w-8 h-8 text-promessa-700" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              Promessa Conecta
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Painel de Super Administração</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                placeholder="admin@promessaconecta.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                id="password"
                type="password"
                className="pl-9"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-neutral-400">
          Acesso exclusivo para administradores do sistema
        </p>
      </div>
    </div>
  );
}
