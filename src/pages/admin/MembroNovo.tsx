import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Upload, User, Phone, Mail, MapPin, Calendar, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneBR } from '@/lib/formatters';

const estadoCivilOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'em_acompanhamento', label: 'Em Acompanhamento' },
];

export default function MembroNovo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromVisitante = searchParams.get('fromVisitante');

  const [loading, setLoading] = useState(false);
  const [loadingVisitante, setLoadingVisitante] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    if (fromVisitante) {
      fetchVisitante(fromVisitante);
    }
  }, [fromVisitante]);

  const fetchVisitante = async (id: string) => {
    try {
      setLoadingVisitante(true);
      const { data, error } = await supabase
        .from('visitantes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      if (data) {
        let observacoes = data.observacoes || '';
        if (data.culto) {
          observacoes = observacoes 
            ? `${observacoes}\n\nCulto visitado: ${data.culto}` 
            : `Culto visitado: ${data.culto}`;
        }
        if (data.melhor_horario) {
          observacoes = observacoes
            ? `${observacoes}\nMelhor horário: ${data.melhor_horario}`
            : `Melhor horário: ${data.melhor_horario}`;
        }

        setFormData(prev => ({
          ...prev,
          nome: data.nome || '',
          telefone: data.telefone || '',
          email: data.email || '',
          observacoes: observacoes.trim(),
          status: 'em_acompanhamento',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar visitante:', error);
      toast.error('Erro ao carregar dados do visitante');
    } finally {
      setLoadingVisitante(false);
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

  const uploadFoto = async (membroId: string): Promise<string | null> => {
    if (!fotoFile) return null;

    try {
      setUploading(true);
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${membroId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('membros_fotos')
        .upload(fileName, fotoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('membros_fotos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Create member
      const { data: membro, error: insertError } = await supabase
        .from('membros')
        .insert({
          nome: formData.nome.trim(),
          telefone: formData.telefone.trim() || null,
          email: formData.email.trim() || null,
          data_nascimento: formData.data_nascimento || null,
          endereco: formData.endereco.trim() || null,
          estado_civil: formData.estado_civil || null,
          data_batismo: formData.data_batismo || null,
          status: formData.status,
          observacoes: formData.observacoes.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload photo if exists
      if (fotoFile && membro) {
        const fotoUrl = await uploadFoto(membro.id);
        if (fotoUrl) {
          await supabase
            .from('membros')
            .update({ foto_perfil: fotoUrl })
            .eq('id', membro.id);
        }
      }

      // Update visitor status if converting from visitor
      if (fromVisitante) {
        await supabase
          .from('visitantes')
          .update({ status: 'concluido' })
          .eq('id', fromVisitante);
      }

      toast.success('Membro criado com sucesso!');
      navigate('/admin/membros');
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      toast.error('Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loadingVisitante) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[500px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/membros')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">
            {fromVisitante ? 'Converter Visitante em Membro' : 'Novo Membro'}
          </h1>
          <p className="text-muted-foreground">Preencha os dados do membro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Card */}
          <Card>
            <CardHeader>
              <CardTitle>Foto</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={fotoPreview || undefined} alt="Preview" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {formData.nome ? getInitials(formData.nome) : <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="foto" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  {fotoFile ? 'Trocar foto' : 'Selecionar foto'}
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
            </CardContent>
          </Card>

          {/* Main Form */}
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
                    placeholder="Nome completo"
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
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneBR(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
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
                    placeholder="email@exemplo.com"
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
                    placeholder="Rua, número, bairro, cidade"
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
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
                  placeholder="Observações adicionais..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/membros')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
