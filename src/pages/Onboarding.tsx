import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Church } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome_igreja: '',
    responsavel_nome: profile?.nome ?? '',
    responsavel_email: profile?.email ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const doInsert = async (slug: string) =>
    supabase
      .from('igrejas')
      .insert({
        nome: form.nome_igreja.trim(),
        slug,
        responsavel_nome: form.responsavel_nome.trim(),
        responsavel_email: form.responsavel_email.trim() || null,
        plano: 'teste',
        ativo: true,
      })
      .select('id')
      .single();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_igreja.trim() || !form.responsavel_nome.trim()) {
      toast.error('Preencha o nome da igreja e do responsável.');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const baseSlug = slugify(form.nome_igreja);
      let { data: igrejaCriada, error: igrejaError } = await doInsert(baseSlug);

      // slug conflict — retry with timestamp suffix
      if (igrejaError?.code === '23505') {
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
        const retry = await doInsert(uniqueSlug);
        if (retry.error) throw retry.error;
        igrejaCriada = retry.data;
      } else if (igrejaError) {
        throw igrejaError;
      }

      // Vincular perfil à nova igreja
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ church_id: igrejaCriada!.id })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Tornar o criador da igreja admin automaticamente
      // upsert evita erro se já tiver role (unique: user_id, role)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'admin', church_id: igrejaCriada!.id },
          { onConflict: 'user_id,role' }
        );
      if (roleError) console.warn('[onboarding] role admin não atribuído:', roleError.message);

      toast.success('Igreja configurada! Você é o administrador da nova igreja.');

      // Recarrega a página para que o AuthContext atualize o churchId e roles
      window.location.href = '/admin/dashboard';
    } catch (error: any) {
      console.error('Erro ao criar igreja:', error);
      toast.error(error.message ?? 'Erro ao configurar a igreja. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-promessa-100 rounded-full">
              <Church className="w-8 h-8 text-promessa-700" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold">Configure sua Igreja</h1>
          <p className="text-muted-foreground text-sm">
            Bem-vindo ao Promessa Conecta! Preencha os dados abaixo para começar a usar a plataforma.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_igreja">Nome da Igreja *</Label>
                <Input
                  id="nome_igreja"
                  name="nome_igreja"
                  placeholder="Ex: Igreja da Promessa – Centro"
                  value={form.nome_igreja}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_nome">Nome do Responsável *</Label>
                <Input
                  id="responsavel_nome"
                  name="responsavel_nome"
                  placeholder="Seu nome completo"
                  value={form.responsavel_nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel_email">E-mail do Responsável</Label>
                <Input
                  id="responsavel_email"
                  name="responsavel_email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.responsavel_email}
                  onChange={handleChange}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  'Configurar Igreja'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Você poderá editar essas informações depois em{' '}
          <strong>Admin → Configurações</strong>.
        </p>
      </div>
    </div>
  );
}
