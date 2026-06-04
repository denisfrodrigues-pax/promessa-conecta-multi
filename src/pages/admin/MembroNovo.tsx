import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, Save, Upload, User, Search, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneBR } from '@/lib/formatters';
import { buscarCep } from '@/utils/cep';

// ─── Options ──────────────────────────────────────────────────────────────────

const GENERO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
];

const ESTADO_CIVIL_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

const GRAU_INSTRUCAO_OPTIONS = [
  { value: 'analfabeto', label: 'Analfabeto' },
  { value: 'le_escreve', label: 'Lê e escreve' },
  { value: 'fundamental_incompleto', label: 'Ensino Fundamental Incompleto' },
  { value: 'fundamental_completo', label: 'Ensino Fundamental Completo' },
  { value: 'medio_incompleto', label: 'Ensino Médio Incompleto' },
  { value: 'medio_completo', label: 'Ensino Médio Completo' },
  { value: 'superior_incompleto', label: 'Superior Incompleto' },
  { value: 'superior_completo', label: 'Superior Completo' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
  { value: 'pos_doutorado', label: 'Pós-doutorado' },
];

const PCD_OPTIONS = [
  { value: 'Nenhum', label: 'Nenhum' },
  { value: 'Visual', label: 'Visual' },
  { value: 'Auditiva', label: 'Auditiva' },
  { value: 'Física', label: 'Física' },
  { value: 'Intelectual', label: 'Intelectual' },
  { value: 'Múltipla', label: 'Múltipla' },
];

const SITUACAO_OPTIONS = [
  { value: 'ativo', label: 'Membro Ativo' },
  { value: 'em_disciplina', label: 'Membro em Disciplina' },
  { value: 'frequentador', label: 'Frequentador' },
];

const ORDENACAO_OPTIONS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'pastor_parcial', label: 'Pastor Tempo Parcial' },
  { value: 'pastor_integral', label: 'Pastor Tempo Integral' },
  { value: 'missionaria_parcial', label: 'Missionária Tempo Parcial' },
  { value: 'missionaria_integral', label: 'Missionária Tempo Integral' },
  { value: 'presbitero', label: 'Presbítero' },
  { value: 'diacono', label: 'Diácono(isa)' },
  { value: 'jubilado', label: 'Jubilado(a)' },
];

const ORIGEM_OPTIONS = [
  { value: 'promessista_nato', label: 'Promessista Nato' },
  { value: 'transferencia_denominacao', label: 'Transferência de outra denominação' },
  { value: 'transferencia_iap', label: 'Transferência de outra IAP' },
  { value: 'neopentecostal', label: 'Igreja Neopentecostal' },
  { value: 'reformada', label: 'Igreja Reformada' },
  { value: 'pentecostal', label: 'Pentecostal' },
  { value: 'sabatista', label: 'Sabatista' },
  { value: 'catolica', label: 'Igreja Católica' },
  { value: 'outras_religioes', label: 'Outras religiões' },
  { value: 'sem_religiao', label: 'Sem religião anterior' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'em_acompanhamento', label: 'Em Acompanhamento' },
];

const ABAS = [
  'Identificação',
  'Imagem/Outros',
  'Notificação',
  'Ordenação',
  'Origem/Batismo',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCpf = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
};

const formatCep = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
};

const getInitials = (nome: string) =>
  nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembroNovo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { churchId: authChurchId } = useAuth();
  const { church, p } = useIgrejaSlug();
  const churchId = authChurchId ?? church?.id ?? null;
  const fromVisitante = searchParams.get('fromVisitante');
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [abaAtual, setAbaAtual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingVisitante, setLoadingVisitante] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    // ── Aba 1: Identificação ──────────────────────────────────────────────
    nome: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    genero: '',
    estado_civil: '',
    nacionalidade: 'Brasileiro(a)',
    naturalidade: '',
    // Família
    nome_mae: '',
    nome_pai: '',
    pai_mae_promessista: 'nao' as 'sim' | 'nao',
    // Endereço
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    // ── Aba 2: Imagem/Outros ──────────────────────────────────────────────
    grau_instrucao: '',
    curso: '',
    profissao: '',
    pcd: 'Nenhum',
    // ── Aba 3: Notificação ────────────────────────────────────────────────
    situacao_ministerial: 'ativo',
    data_situacao_inicio: '',
    data_situacao_fim: '',
    situacao_observacao: '',
    status: 'ativo',
    observacoes_pastorais: '',
    // ── Aba 4: Ordenação ──────────────────────────────────────────────────
    ordenacao_funcao: 'nenhum',
    data_ordenacao_inicio: '',
    data_ordenacao_fim: '',
    ordenacao_observacao: '',
    // ── Aba 5: Origem/Batismo ─────────────────────────────────────────────
    origem_membro: '',
    igreja_anterior: '',
    data_recebimento: '',
    local_batismo: '',
    pastor_oficiante: '',
    data_batismo_agua: '',
    batismo_espirito_santo: 'nao' as 'sim' | 'nao',
    data_batismo_espirito: '',
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (fromVisitante) fetchVisitante(fromVisitante);
  }, [fromVisitante]);

  const fetchVisitante = async (id: string) => {
    setLoadingVisitante(true);
    try {
      const { data, error } = await supabase
        .from('visitantes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return;
      let obs = data.observacoes || '';
      if (data.culto) obs = obs ? `${obs}\n\nCulto visitado: ${data.culto}` : `Culto visitado: ${data.culto}`;
      if (data.melhor_horario) obs = obs ? `${obs}\nMelhor horário: ${data.melhor_horario}` : `Melhor horário: ${data.melhor_horario}`;
      setForm((prev) => ({
        ...prev,
        nome: data.nome || '',
        telefone: data.telefone || '',
        email: data.email || '',
        observacoes_pastorais: obs.trim(),
        status: 'em_acompanhamento',
      }));
    } catch {
      toast.error('Erro ao carregar dados do visitante');
    } finally {
      setLoadingVisitante(false);
    }
  };

  const handleBuscarCep = async () => {
    setBuscandoCep(true);
    const resultado = await buscarCep(form.cep);
    setBuscandoCep(false);
    if (!resultado) { toast.error('CEP não encontrado'); return; }
    setForm((prev) => ({
      ...prev,
      rua: resultado.rua,
      bairro: resultado.bairro,
      cidade: resultado.cidade,
      estado: resultado.estado,
    }));
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadFoto = async (membroId: string): Promise<string | null> => {
    if (!fotoFile) return null;
    setUploading(true);
    try {
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${membroId}.${ext}`;
      const { error } = await supabase.storage
        .from('membros_fotos')
        .upload(fileName, fotoFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('membros_fotos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const avancar = () => {
    if (abaAtual === 0 && !form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setAbaAtual((v) => Math.min(v + 1, ABAS.length - 1));
  };
  const voltar = () => setAbaAtual((v) => Math.max(v - 1, 0));

  const handleSubmit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); setAbaAtual(0); return; }
    if (form.email.trim()) {
      const { data: dup } = await supabase
        .from('membros')
        .select('id, nome')
        .eq('email', form.email.trim())
        .maybeSingle();
      if (dup) { toast.error(`Já existe um membro com este e-mail: ${dup.nome}`); setAbaAtual(0); return; }
    }
    setLoading(true);
    try {
      const enderecoLegado = [form.rua, form.numero, form.bairro, form.cidade, form.estado]
        .filter(Boolean).join(', ');

      const { data: membro, error } = await supabase
        .from('membros')
        .insert({
          // Identificação
          nome: form.nome.trim(),
          cpf: form.cpf.trim() || null,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          data_nascimento: form.data_nascimento || null,
          genero: form.genero || null,
          estado_civil: form.estado_civil || null,
          nacionalidade: form.nacionalidade.trim() || null,
          naturalidade: form.naturalidade.trim() || null,
          // Família
          nome_mae: form.nome_mae.trim() || null,
          nome_pai: form.nome_pai.trim() || null,
          pai_mae_promessista: form.pai_mae_promessista === 'sim',
          // Endereço
          endereco: enderecoLegado || null,
          cep: form.cep.trim() || null,
          rua: form.rua.trim() || null,
          numero: form.numero.trim() || null,
          complemento: form.complemento.trim() || null,
          bairro: form.bairro.trim() || null,
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          pais: form.pais.trim() || 'Brasil',
          // Formação
          grau_instrucao: form.grau_instrucao || null,
          curso: form.curso.trim() || null,
          profissao: form.profissao.trim() || null,
          pcd: form.pcd || 'Nenhum',
          // Situação
          status: form.status,
          situacao_ministerial: form.situacao_ministerial || 'ativo',
          data_situacao_inicio: form.data_situacao_inicio || null,
          data_situacao_fim: form.data_situacao_fim || null,
          situacao_observacao: form.situacao_observacao.trim() || null,
          observacoes_pastorais: form.observacoes_pastorais.trim() || null,
          // Ordenação
          ordenacao_funcao: form.ordenacao_funcao || 'nenhum',
          data_ordenacao_inicio: form.data_ordenacao_inicio || null,
          data_ordenacao_fim: form.data_ordenacao_fim || null,
          ordenacao_observacao: form.ordenacao_observacao.trim() || null,
          // Origem / Batismo
          origem_membro: form.origem_membro || null,
          igreja_anterior: form.origem_membro !== 'promessista_nato' ? (form.igreja_anterior.trim() || null) : null,
          data_recebimento: form.data_recebimento || null,
          local_batismo: form.local_batismo.trim() || null,
          pastor_oficiante: form.pastor_oficiante.trim() || null,
          data_batismo: form.data_batismo_agua || null,
          data_batismo_agua: form.data_batismo_agua || null,
          batismo_espirito_santo: form.batismo_espirito_santo === 'sim',
          data_batismo_espirito: form.batismo_espirito_santo === 'sim' ? (form.data_batismo_espirito || null) : null,
          church_id: churchId!,
        })
        .select()
        .single();

      if (error) throw error;

      if (fotoFile && membro) {
        const url = await uploadFoto(membro.id);
        if (url) await supabase.from('membros').update({ foto_perfil: url }).eq('id', membro.id);
      }
      if (fromVisitante) {
        await supabase.from('visitantes').update({ status: 'concluido' }).eq('id', fromVisitante);
      }

      toast.success('Membro criado com sucesso!');
      navigate(p('/admin/membros'));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar membro');
    } finally {
      setLoading(false);
    }
  };

  if (loadingVisitante) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(p('/admin/membros'))}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold">
            {fromVisitante ? 'Converter Visitante em Membro' : 'Novo Membro'}
          </h1>
          <p className="text-muted-foreground">Preencha os dados do membro</p>
        </div>
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-1">
        {ABAS.map((aba, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setAbaAtual(i)}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors ${
                i === abaAtual
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i < abaAtual
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-xs hidden sm:inline truncate ${i === abaAtual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {aba}
            </span>
            {i < ABAS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Conteúdo da aba */}
      <Card>
        <CardContent className="pt-6 space-y-6">

          {/* ── ABA 1: Identificação ───────────────────────────────────── */}
          {abaAtual === 0 && (
            <>
              <Section title="Dados Pessoais">
                <Row2>
                  <Field label="Nome Completo *" className="sm:col-span-2">
                    <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome completo" />
                  </Field>
                  <Field label="CPF">
                    <Input value={form.cpf} onChange={(e) => set('cpf', formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </Field>
                  <Field label="Data de Nascimento">
                    <Input type="date" value={form.data_nascimento} onChange={(e) => set('data_nascimento', e.target.value)} />
                  </Field>
                  <Field label="E-mail">
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
                  </Field>
                  <Field label="Telefone Celular">
                    <Input value={form.telefone} onChange={(e) => set('telefone', formatPhoneBR(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
                  </Field>
                  <Field label="Gênero">
                    <SelectField value={form.genero} onValueChange={(v) => set('genero', v)} options={GENERO_OPTIONS} placeholder="Selecione" />
                  </Field>
                  <Field label="Estado Civil">
                    <SelectField value={form.estado_civil} onValueChange={(v) => set('estado_civil', v)} options={ESTADO_CIVIL_OPTIONS} placeholder="Selecione" />
                  </Field>
                  <Field label="Nacionalidade">
                    <Input value={form.nacionalidade} onChange={(e) => set('nacionalidade', e.target.value)} placeholder="Brasileiro(a)" />
                  </Field>
                  <Field label="Naturalidade" hint="Cidade onde nasceu">
                    <Input value={form.naturalidade} onChange={(e) => set('naturalidade', e.target.value)} placeholder="Ex: São Paulo - SP" />
                  </Field>
                </Row2>
              </Section>

              <Section title="Família">
                <Row2>
                  <Field label="Nome da Mãe">
                    <Input value={form.nome_mae} onChange={(e) => set('nome_mae', e.target.value)} placeholder="Nome da mãe" />
                  </Field>
                  <Field label="Nome do Pai">
                    <Input value={form.nome_pai} onChange={(e) => set('nome_pai', e.target.value)} placeholder="Nome do pai" />
                  </Field>
                  <Field label="Pai ou Mãe Promessista?">
                    <SelectField
                      value={form.pai_mae_promessista}
                      onValueChange={(v) => set('pai_mae_promessista', v)}
                      options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
                      placeholder="Selecione"
                    />
                  </Field>
                </Row2>
              </Section>

              <Section title="Endereço">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">CEP</Label>
                    <Input value={form.cep} onChange={(e) => set('cep', formatCep(e.target.value))} placeholder="00000-000" maxLength={9} />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleBuscarCep} disabled={buscandoCep} className="mb-0.5">
                    {buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                    Buscar
                  </Button>
                </div>
                <Row2>
                  <Field label="Rua / Avenida" className="sm:col-span-2">
                    <Input value={form.rua} onChange={(e) => set('rua', e.target.value)} placeholder="Rua, Avenida, etc." />
                  </Field>
                  <Field label="Número">
                    <Input value={form.numero} onChange={(e) => set('numero', e.target.value)} placeholder="123" />
                  </Field>
                  <Field label="Complemento">
                    <Input value={form.complemento} onChange={(e) => set('complemento', e.target.value)} placeholder="Apto, Bloco, etc." />
                  </Field>
                  <Field label="Bairro">
                    <Input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} placeholder="Bairro" />
                  </Field>
                  <Field label="Cidade">
                    <Input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="Cidade" />
                  </Field>
                  <Field label="Estado (UF)">
                    <Input value={form.estado} onChange={(e) => set('estado', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
                  </Field>
                  <Field label="País">
                    <Input value={form.pais} onChange={(e) => set('pais', e.target.value)} placeholder="Brasil" />
                  </Field>
                </Row2>
              </Section>
            </>
          )}

          {/* ── ABA 2: Imagem/Outros ───────────────────────────────────── */}
          {abaAtual === 1 && (
            <>
              <Section title="Imagem">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {form.nome ? getInitials(form.nome) : <User className="w-10 h-10" />}
                    </AvatarFallback>
                    <AvatarImage src={fotoPreview || undefined} />
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fotoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {fotoFile ? 'Trocar foto' : 'Selecionar foto'}
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máx. 5MB</p>
                  </div>
                </div>
              </Section>

              <Section title="Outros">
                <Row2>
                  <Field label="Grau de Instrução">
                    <SelectField value={form.grau_instrucao} onValueChange={(v) => set('grau_instrucao', v)} options={GRAU_INSTRUCAO_OPTIONS} placeholder="Selecione" />
                  </Field>
                  <Field label="Curso">
                    <Input value={form.curso} onChange={(e) => set('curso', e.target.value)} placeholder="Ex: Administração, Engenharia..." />
                  </Field>
                  <Field label="Profissão">
                    <Input value={form.profissao} onChange={(e) => set('profissao', e.target.value)} placeholder="Ex: Professor, Médico..." />
                  </Field>
                  <Field label="PCD (Pessoa com Deficiência)">
                    <SelectField value={form.pcd} onValueChange={(v) => set('pcd', v)} options={PCD_OPTIONS} placeholder="Selecione" />
                  </Field>
                </Row2>
              </Section>
            </>
          )}

          {/* ── ABA 3: Notificação (Situação Ministerial) ─────────────── */}
          {abaAtual === 2 && (
            <>
              <Section title="Notificação Ministerial">
                <Row2>
                  <Field label="Situação">
                    <SelectField value={form.situacao_ministerial} onValueChange={(v) => set('situacao_ministerial', v)} options={SITUACAO_OPTIONS} placeholder="Selecione" />
                  </Field>
                  <Field label="Início">
                    <Input type="date" value={form.data_situacao_inicio} onChange={(e) => set('data_situacao_inicio', e.target.value)} />
                  </Field>
                  <Field label="Término">
                    <Input type="date" value={form.data_situacao_fim} onChange={(e) => set('data_situacao_fim', e.target.value)} />
                  </Field>
                  <Field label="Observação" className="sm:col-span-2">
                    <Textarea value={form.situacao_observacao} onChange={(e) => set('situacao_observacao', e.target.value)} rows={3} placeholder="Observações sobre a situação ministerial..." />
                  </Field>
                </Row2>
              </Section>

              <Section title="Dados Administrativos">
                <Row2>
                  <Field label="Status do Membro">
                    <SelectField value={form.status} onValueChange={(v) => set('status', v)} options={STATUS_OPTIONS} placeholder="Selecione" />
                  </Field>
                </Row2>
                <Field label="Observações Pastorais">
                  <Textarea
                    value={form.observacoes_pastorais}
                    onChange={(e) => set('observacoes_pastorais', e.target.value)}
                    rows={4}
                    placeholder="Informações confidenciais de acompanhamento pastoral..."
                  />
                </Field>
              </Section>
            </>
          )}

          {/* ── ABA 4: Ordenação ──────────────────────────────────────── */}
          {abaAtual === 3 && (
            <Section title="Ordenação Ministerial">
              <Row2>
                <Field label="Função">
                  <SelectField value={form.ordenacao_funcao} onValueChange={(v) => set('ordenacao_funcao', v)} options={ORDENACAO_OPTIONS} placeholder="Selecione" />
                </Field>
                <Field label="Início">
                  <Input type="date" value={form.data_ordenacao_inicio} onChange={(e) => set('data_ordenacao_inicio', e.target.value)} />
                </Field>
                <Field label="Término (opcional)">
                  <Input type="date" value={form.data_ordenacao_fim} onChange={(e) => set('data_ordenacao_fim', e.target.value)} />
                </Field>
                <Field label="Observação" className="sm:col-span-2">
                  <Textarea value={form.ordenacao_observacao} onChange={(e) => set('ordenacao_observacao', e.target.value)} rows={3} placeholder="Observações sobre a ordenação..." />
                </Field>
              </Row2>
            </Section>
          )}

          {/* ── ABA 5: Origem / Batismo ────────────────────────────────── */}
          {abaAtual === 4 && (
            <>
              <Section title="Origem Membro e Batismos">
                <Row2>
                  <Field label="Origem">
                    <SelectField value={form.origem_membro} onValueChange={(v) => set('origem_membro', v)} options={ORIGEM_OPTIONS} placeholder="Selecione" />
                  </Field>
                  {form.origem_membro && form.origem_membro !== 'promessista_nato' && (
                    <Field label="Igreja anterior">
                      <Input value={form.igreja_anterior} onChange={(e) => set('igreja_anterior', e.target.value)} placeholder="Nome da igreja de origem" />
                    </Field>
                  )}
                  <Field label="Data de recebimento">
                    <Input type="date" value={form.data_recebimento} onChange={(e) => set('data_recebimento', e.target.value)} />
                  </Field>
                </Row2>
              </Section>

              <Section title="Batismo em Água">
                <Row2>
                  <Field label="Local do Batismo">
                    <Input value={form.local_batismo} onChange={(e) => set('local_batismo', e.target.value)} placeholder="Local onde foi batizado" />
                  </Field>
                  <Field label="Pastor Oficiante">
                    <Input value={form.pastor_oficiante} onChange={(e) => set('pastor_oficiante', e.target.value)} placeholder="Nome do pastor" />
                  </Field>
                  <Field label="Data do Batismo">
                    <Input type="date" value={form.data_batismo_agua} onChange={(e) => set('data_batismo_agua', e.target.value)} />
                  </Field>
                </Row2>
              </Section>

              <Section title="Batismo no Espírito Santo">
                <Row2>
                  <Field label="Batizado no Espírito Santo">
                    <SelectField
                      value={form.batismo_espirito_santo}
                      onValueChange={(v) => set('batismo_espirito_santo', v)}
                      options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
                      placeholder="Selecione"
                    />
                  </Field>
                  {form.batismo_espirito_santo === 'sim' && (
                    <Field label="Data do Batismo no Espírito Santo">
                      <Input type="date" value={form.data_batismo_espirito} onChange={(e) => set('data_batismo_espirito', e.target.value)} />
                    </Field>
                  )}
                </Row2>
              </Section>
            </>
          )}

        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={abaAtual === 0 ? () => navigate(p('/admin/membros')) : voltar}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {abaAtual === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{abaAtual + 1} de {ABAS.length}</span>
          {abaAtual < ABAS.length - 1 ? (
            <Button type="button" onClick={avancar}>
              Avançar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading || uploading}>
              {loading || uploading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Save className="w-4 h-4 mr-2" />}
              Salvar Membro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      {label && <Label className="text-sm">{label}</Label>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
