import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Upload, User, Phone, Mail, MapPin, Calendar, Heart, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  estado_civil: string | null;
  data_batismo: string | null;
  foto_perfil: string | null;
  data_registro: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string | null;
}

const estadoCivilOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 border-green-300',
  inativo: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function MembroDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    estado_civil: '',
    data_batismo: '',
    status: 'ativo',
    observacoes: '',
  });

  useEffect(() => {
    if (id) fetchMembro();
  }, [id]);

  const fetchMembro = async () => {
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setMembro(data);
      setFormData({
        nome: data.nome || '',
        telefone: data.telefone || '',
        email: data.email || '',
        data_nascimento: data.data_nascimento || '',
        endereco: data.endereco || '',
        estado_civil: data.estado_civil || '',
        data_batismo: data.data_batismo || '',
        status: data.status || 'ativo',
        observacoes: data.observacoes || '',
      });
      setFotoPreview(data.foto_perfil);
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      toast.error('Erro ao carregar dados do membro');
      navigate('/admin/membros');
    } finally {
      setLoading(false);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 5MB');
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFoto = async (): Promise<string | null> => {
    if (!fotoFile || !id) return null;

    try {
      setUploading(true);
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('membros_fotos')
        .upload(fileName, fotoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('membros_fotos')
        .getPublicUrl(fileName);

      return urlData.publicUrl + `?t=${Date.now()}`;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let fotoUrl = membro?.foto_perfil;
      if (fotoFile) {
        const newUrl = await uploadFoto();
        if (newUrl) fotoUrl = newUrl;
      }

      const { error } = await supabase
        .from('membros')
        .update({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim() || null,
          email: formData.email.trim() || null,
          data_nascimento: formData.data_nascimento || null,
          endereco: formData.endereco.trim() || null,
          estado_civil: formData.estado_civil || null,
          data_batismo: formData.data_batismo || null,
          status: formData.status,
          observacoes: formData.observacoes.trim() || null,
          foto_perfil: fotoUrl,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Membro atualizado com sucesso!');
      setIsEditing(false);
      setFotoFile(null);
      fetchMembro();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!membro) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Membro não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/membros')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Detalhes do Membro</h1>
            <p className="text-muted-foreground">Visualize e edite as informações</p>
          </div>
        </div>
        <Badge variant="outline" className={statusColors[formData.status]}>
          {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium">{formatDate(membro.data_registro)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batismo</p>
                <p className="font-medium">{membro.data_batismo ? formatDate(membro.data_batismo) : 'Não batizado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{membro.telefone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={fotoPreview || undefined} alt={membro.nome} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials(membro.nome)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <Label htmlFor="foto" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    Trocar foto
                  </div>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </Label>
                <p className="text-xs text-muted-foreground">Máximo 5MB</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Nascimento
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_civil">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Estado Civil
                </Label>
                <Select
                  value={formData.estado_civil}
                  onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoCivilOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_batismo">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data do Batismo
                </Label>
                <Input
                  id="data_batismo"
                  type="date"
                  value={formData.data_batismo}
                  onChange={(e) => setFormData({ ...formData, data_batismo: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/admin/membros')}>
          Voltar
        </Button>
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              fetchMembro();
              setFotoFile(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
