import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Building2, Save, Loader2, Upload, X, Image as ImageIcon, Palette,
  User, Mail, Phone, Crown,
} from 'lucide-react';

type Plano = 'teste' | 'basico' | 'completo';

interface IgrejaForm {
  nome: string;
  logo_url: string;
  cor_primaria: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
  plano: Plano;
  ativo: boolean;
}

const PLANO_LABELS: Record<Plano, string> = {
  teste: 'Teste (30 dias gratuitos)',
  basico: 'Básico',
  completo: 'Completo',
};

const PLANO_COLORS: Record<Plano, string> = {
  teste: 'bg-amber-100 text-amber-800',
  basico: 'bg-blue-100 text-blue-800',
  completo: 'bg-green-100 text-green-800',
};

const EMPTY_FORM: IgrejaForm = {
  nome: '',
  logo_url: '',
  cor_primaria: '#396939',
  responsavel_nome: '',
  responsavel_email: '',
  responsavel_telefone: '',
  plano: 'teste',
  ativo: true,
};

export default function ConfiguracaoIgreja() {
  const { churchId } = useAuth();
  const [form, setForm] = useState<IgrejaForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (churchId) fetchIgreja();
  }, [churchId]);

  const fetchIgreja = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('igrejas')
      .select('nome, logo_url, cor_primaria, responsavel_nome, responsavel_email, responsavel_telefone, plano, ativo')
      .eq('id', churchId!)
      .single();

    if (!error && data) {
      setForm({
        nome: data.nome ?? '',
        logo_url: data.logo_url ?? '',
        cor_primaria: data.cor_primaria ?? '#396939',
        responsavel_nome: data.responsavel_nome ?? '',
        responsavel_email: data.responsavel_email ?? '',
        responsavel_telefone: data.responsavel_telefone ?? '',
        plano: (data.plano as Plano) ?? 'teste',
        ativo: data.ativo ?? true,
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !churchId) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG, WebP ou SVG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `church-logos/${churchId}.${ext}`;

      const { error: upError } = await supabase.storage
        .from('documentos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upError) throw upError;

      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo enviada!');
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar logo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => setForm(prev => ({ ...prev, logo_url: '' }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome da igreja é obrigatório.'); return; }
    if (!churchId) return;

    setSaving(true);
    const { error } = await supabase
      .from('igrejas')
      .update({
        nome: form.nome.trim(),
        logo_url: form.logo_url || null,
        cor_primaria: form.cor_primaria,
        responsavel_nome: form.responsavel_nome.trim() || null,
        responsavel_email: form.responsavel_email.trim() || null,
        responsavel_telefone: form.responsavel_telefone.trim() || null,
      })
      .eq('id', churchId);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Configurações da igreja atualizadas!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-promessa-700" />
            Configurações da Igreja
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie as informações e identidade visual da sua igreja.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
            : <><Save className="w-4 h-4 mr-2" />Salvar</>
          }
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Identidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identidade da Igreja</CardTitle>
              <CardDescription>Nome público e identidade visual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Igreja *</Label>
                <Input
                  id="nome" name="nome"
                  value={form.nome} onChange={handleChange}
                  placeholder="Ex: Igreja da Promessa – Centro"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Igreja</Label>
                {form.logo_url ? (
                  <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{form.logo_url}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveLogo}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-promessa-400 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para enviar a logo
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPEG, WebP ou SVG — máx. 2 MB</p>
                  </div>
                )}
                <input
                  ref={fileRef} type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                  </p>
                )}
              </div>

              {/* Cor primária */}
              <div className="space-y-2">
                <Label htmlFor="cor_primaria" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Cor Primária
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="cor_primaria" name="cor_primaria"
                    value={form.cor_primaria}
                    onChange={handleChange}
                    className="h-10 w-16 rounded cursor-pointer border border-input p-1"
                  />
                  <Input
                    name="cor_primaria"
                    value={form.cor_primaria}
                    onChange={handleChange}
                    placeholder="#396939"
                    className="w-32 font-mono text-sm"
                    maxLength={7}
                  />
                  <span className="text-xs text-muted-foreground">
                    Usado em botões e destaques do app
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do Responsável</CardTitle>
              <CardDescription>Informações de contato do pastor/responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="responsavel_nome" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Nome
                </Label>
                <Input
                  id="responsavel_nome" name="responsavel_nome"
                  value={form.responsavel_nome} onChange={handleChange}
                  placeholder="Nome completo do responsável"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel_email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> E-mail
                  </Label>
                  <Input
                    id="responsavel_email" name="responsavel_email" type="email"
                    value={form.responsavel_email} onChange={handleChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_telefone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Telefone
                  </Label>
                  <Input
                    id="responsavel_telefone" name="responsavel_telefone"
                    value={form.responsavel_telefone} onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Plano Atual
              </CardTitle>
              <CardDescription>
                Para alterar o plano, entre em contato com a equipe Promessa Conecta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={`text-sm px-3 py-1 ${PLANO_COLORS[form.plano]}`}>
                {PLANO_LABELS[form.plano]}
              </Badge>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✅ Dashboard e relatórios</p>
                <p>✅ Gestão de membros e bases</p>
                <p>✅ Escalas e ministérios</p>
                {form.plano !== 'teste' && <p>✅ Financeiro completo</p>}
                {form.plano === 'completo' && <p>✅ Módulos avançados</p>}
                {form.plano === 'teste' && (
                  <p className="text-amber-600 font-medium pt-1">
                    ⚠️ Período de avaliação — entre em contato para ativar um plano.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status da Igreja</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className={form.ativo
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'}
              >
                {form.ativo ? '✅ Ativa' : '❌ Inativa'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Para alterar o status, entre em contato com o suporte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
