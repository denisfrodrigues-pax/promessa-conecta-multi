import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Baby, Plus, Pencil, Trash2, Users, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MCA_MINISTERIO_ID = '2716147f-b6a4-442f-8020-21c6d9ba4b72';

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  sala_id: string | null;
  foto_url: string | null;
  observacoes: string | null;
  ativo: boolean;
  sala_nome?: string;
}

interface Sala {
  id: string;
  nome: string;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  capacidade: number | null;
  professor_id: string | null;
  ativo: boolean;
  professor_nome?: string;
}

interface Responsavel {
  id: string;
  nome: string;
}

function calcAge(dob: string | null): string {
  if (!dob) return '–';
  const years = differenceInYears(new Date(), new Date(dob));
  return `${years} ano${years !== 1 ? 's' : ''}`;
}

function formatDate(d: string | null): string {
  if (!d) return '–';
  return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });
}

function faixaLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max} anos`;
  if (min != null) return `${min}+ anos`;
  if (max != null) return `até ${max} anos`;
  return '–';
}

// ── Criança form modal ────────────────────────────────────────────────────────

interface CriancaFormProps {
  open: boolean;
  initial: Partial<Crianca> | null;
  salas: Sala[];
  onClose: () => void;
  onSaved: () => void;
}

function CriancaForm({ open, initial, salas, onClose, onSaved }: CriancaFormProps) {
  const editing = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    sala_id: 'none',
    observacoes: '',
    ativo: true,
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        data_nascimento: initial?.data_nascimento ?? '',
        sala_id: initial?.sala_id ?? 'none',
        observacoes: initial?.observacoes ?? '',
        ativo: initial?.ativo ?? true,
      });
      setFotoFile(null);
      setFotoPreview(initial?.foto_url ?? null);
    }
  }, [open, initial]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const uploadFoto = async (): Promise<string | null> => {
    if (!fotoFile) return initial?.foto_url ?? null;
    const ext = fotoFile.name.split('.').pop() ?? 'jpg';
    const path = `kids/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, fotoFile, { upsert: true });
    if (error) {
      toast.error('Erro ao fazer upload da foto');
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const foto_url = await uploadFoto();
      const payload = {
        nome: form.nome.trim(),
        data_nascimento: form.data_nascimento || null,
        sala_id: form.sala_id === 'none' ? null : form.sala_id || null,
        observacoes: form.observacoes.trim() || null,
        ativo: form.ativo,
        foto_url,
      };
      if (editing) {
        const { error } = await supabase.from('mca_criancas').update(payload).eq('id', initial!.id!);
        if (error) throw error;
        toast.success('Criança atualizada!');
      } else {
        const { error } = await supabase.from('mca_criancas').insert({ ...payload, church_id: churchId! });
        if (error) throw error;
        toast.success('Criança cadastrada!');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Criança' : 'Nova Criança'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {fotoPreview && <AvatarImage src={fotoPreview} alt="Foto" />}
              <AvatarFallback><Baby className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <Label className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Upload className="w-4 h-4" />
              {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </Label>
          </div>
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1">
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Sala</Label>
            <Select value={form.sala_id} onValueChange={v => set('sala_id', v)}>
              <SelectTrigger><SelectValue placeholder="Sem sala" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem sala</SelectItem>
                {salas.filter(s => s.id).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} placeholder="Informações adicionais..." />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => set('ativo', v)} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sala form modal ───────────────────────────────────────────────────────────

interface SalaFormProps {
  open: boolean;
  initial: Partial<Sala> | null;
  responsaveis: Responsavel[];
  onClose: () => void;
  onSaved: () => void;
}

function SalaForm({ open, initial, responsaveis, onClose, onSaved }: SalaFormProps) {
  const editing = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    faixa_etaria_min: '',
    faixa_etaria_max: '',
    capacidade: '',
    professor_id: 'none',
    ativo: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        faixa_etaria_min: initial?.faixa_etaria_min != null ? String(initial.faixa_etaria_min) : '',
        faixa_etaria_max: initial?.faixa_etaria_max != null ? String(initial.faixa_etaria_max) : '',
        capacidade: initial?.capacidade != null ? String(initial.capacidade) : '',
        professor_id: initial?.professor_id ?? 'none',
        ativo: initial?.ativo ?? true,
      });
    }
  }, [open, initial]);

  const setF = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        nome: form.nome.trim(),
        faixa_etaria_min: form.faixa_etaria_min !== '' ? Number(form.faixa_etaria_min) : null,
        faixa_etaria_max: form.faixa_etaria_max !== '' ? Number(form.faixa_etaria_max) : null,
        capacidade: form.capacidade !== '' ? Number(form.capacidade) : null,
        professor_id: form.professor_id === 'none' ? null : form.professor_id || null,
        ativo: form.ativo,
      };
      if (editing) {
        const { error } = await supabase.from('mca_salas').update(payload).eq('id', initial!.id!);
        if (error) throw error;
        toast.success('Sala atualizada!');
      } else {
        const { error } = await supabase.from('mca_salas').insert({
          ...payload,
          church_id: churchId!,
          ministerio_id: MCA_MINISTERIO_ID,
        });
        if (error) throw error;
        toast.success('Sala criada!');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setF('nome', e.target.value)} placeholder="Ex: Berçário, Jardim..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Idade mínima (anos)</Label>
              <Input type="number" min="0" value={form.faixa_etaria_min} onChange={e => setF('faixa_etaria_min', e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Idade máxima (anos)</Label>
              <Input type="number" min="0" value={form.faixa_etaria_max} onChange={e => setF('faixa_etaria_max', e.target.value)} placeholder="12" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Capacidade</Label>
            <Input type="number" min="0" value={form.capacidade} onChange={e => setF('capacidade', e.target.value)} placeholder="Nº máximo de crianças" />
          </div>
          <div className="space-y-1">
            <Label>Professor(a)</Label>
            <Select value={form.professor_id} onValueChange={v => setF('professor_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {responsaveis.filter(r => r.id).map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.ativo} onCheckedChange={v => setF('ativo', v)} />
            <Label>Ativa</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminKids() {
  const { churchId } = useAuth();
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loadingCriancas, setLoadingCriancas] = useState(true);
  const [loadingSalas, setLoadingSalas] = useState(true);

  const [criancaForm, setCriancaForm] = useState<{ open: boolean; initial: Partial<Crianca> | null }>({ open: false, initial: null });
  const [salaForm, setSalaForm] = useState<{ open: boolean; initial: Partial<Sala> | null }>({ open: false, initial: null });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchResponsaveis();
    fetchCriancas();
    fetchSalas();
  };

  const fetchResponsaveis = async () => {
    const { data } = await supabase.from('profiles').select('id, nome').order('nome');
    setResponsaveis(((data as any[]) || []).filter(p => p.id).map(p => ({ id: p.id, nome: p.nome })));
  };

  const fetchCriancas = async () => {
    setLoadingCriancas(true);
    try {
      const { data, error } = await supabase
        .from('mca_criancas')
        .select('*')
        .eq('church_id', churchId!)
        .order('nome');
      if (error) throw error;

      const rows = (data as any[]) || [];
      const salaIds = [...new Set(rows.map(r => r.sala_id).filter(Boolean))];
      const salasRes = salaIds.length
        ? await supabase.from('mca_salas').select('id, nome').in('id', salaIds)
        : { data: [] };

      const salaMap: Record<string, string> = Object.fromEntries(
        (((salasRes.data as any[]) || [])).map(s => [s.id, s.nome])
      );

      setCriancas(rows.map(r => ({
        ...r,
        sala_nome: r.sala_id ? salaMap[r.sala_id] : undefined,
      })));
    } catch {
      toast.error('Erro ao carregar crianças');
    } finally {
      setLoadingCriancas(false);
    }
  };

  const fetchSalas = async () => {
    setLoadingSalas(true);
    try {
      const { data, error } = await supabase
        .from('mca_salas')
        .select('*')
        .eq('church_id', churchId!)
        .order('nome');
      if (error) throw error;

      const rows = (data as any[]) || [];
      const profIds = [...new Set(rows.map(r => r.professor_id).filter(Boolean))];
      const profilesRes = profIds.length
        ? await supabase.from('profiles').select('id, nome').in('id', profIds)
        : { data: [] };

      const profileMap: Record<string, string> = Object.fromEntries(
        (((profilesRes.data as any[]) || [])).map(p => [p.id, p.nome])
      );

      setSalas(rows.map(r => ({
        ...r,
        professor_nome: r.professor_id ? profileMap[r.professor_id] : undefined,
      })));
    } catch {
      toast.error('Erro ao carregar salas');
    } finally {
      setLoadingSalas(false);
    }
  };

  const deleteCrianca = async (id: string) => {
    const { error } = await supabase.from('mca_criancas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Criança removida');
    fetchCriancas();
  };

  const deleteSala = async (id: string) => {
    const { error } = await supabase.from('mca_salas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir sala'); return; }
    toast.success('Sala removida');
    fetchSalas();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Baby className="w-6 h-6 text-primary" />
          Kids
        </h1>
        <p className="text-muted-foreground mt-1">Gestão de crianças e salas infantis</p>
      </div>

      <Tabs defaultValue="criancas">
        <TabsList>
          <TabsTrigger value="criancas">
            Crianças
            <Badge variant="secondary" className="ml-2">{criancas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="salas">
            Salas
            <Badge variant="secondary" className="ml-2">{salas.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Crianças ──────────────────────────────────────────────────── */}
        <TabsContent value="criancas" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Lista de Crianças</CardTitle>
              <Button size="sm" onClick={() => setCriancaForm({ open: true, initial: null })}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Criança
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCriancas ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : criancas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Baby className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma criança cadastrada</p>
                  <Button size="sm" className="mt-4" onClick={() => setCriancaForm({ open: true, initial: null })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar primeira criança
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 px-3 font-medium w-12"></th>
                        <th className="text-left py-2 px-3 font-medium">Nome</th>
                        <th className="text-left py-2 px-3 font-medium">Nascimento / Idade</th>
                        <th className="text-left py-2 px-3 font-medium">Sala</th>
                        <th className="text-left py-2 px-3 font-medium">Status</th>
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {criancas.map(c => (
                        <tr key={c.id} className="border-b hover:bg-muted/40">
                          <td className="py-2 px-3">
                            <Avatar className="w-8 h-8">
                              {c.foto_url && <AvatarImage src={c.foto_url} alt={c.nome} />}
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {c.nome.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="py-2 px-3 font-medium">{c.nome}</td>
                          <td className="py-2 px-3 text-muted-foreground">
                            <span>{formatDate(c.data_nascimento)}</span>
                            {c.data_nascimento && (
                              <span className="ml-2 text-xs">({calcAge(c.data_nascimento)})</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {c.sala_nome
                              ? <Badge variant="secondary">{c.sala_nome}</Badge>
                              : <span className="text-muted-foreground">–</span>}
                          </td>
                          <td className="py-2 px-3">
                            {c.ativo
                              ? <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                              : <Badge variant="outline">Inativo</Badge>}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setCriancaForm({ open: true, initial: c })}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir criança?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir <strong>{c.nome}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteCrianca(c.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Salas ─────────────────────────────────────────────────────── */}
        <TabsContent value="salas" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Salas Infantis</CardTitle>
              <Button size="sm" onClick={() => setSalaForm({ open: true, initial: null })}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sala
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSalas ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : salas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma sala cadastrada</p>
                  <Button size="sm" className="mt-4" onClick={() => setSalaForm({ open: true, initial: null })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira sala
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {salas.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{s.nome}</p>
                          {!s.ativo && <Badge variant="outline" className="text-xs">Inativa</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {faixaLabel(s.faixa_etaria_min, s.faixa_etaria_max) !== '–' && (
                            <span className="mr-3">Faixa: {faixaLabel(s.faixa_etaria_min, s.faixa_etaria_max)}</span>
                          )}
                          {s.capacidade != null && <span className="mr-3">Capacidade: {s.capacidade}</span>}
                          {s.professor_nome && <span>Professor(a): {s.professor_nome}</span>}
                          {faixaLabel(s.faixa_etaria_min, s.faixa_etaria_max) === '–' && !s.capacidade && !s.professor_nome && '–'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setSalaForm({ open: true, initial: s })}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir sala?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a sala <strong>{s.nome}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSala(s.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CriancaForm
        open={criancaForm.open}
        initial={criancaForm.initial}
        salas={salas}
        onClose={() => setCriancaForm({ open: false, initial: null })}
        onSaved={fetchCriancas}
      />
      <SalaForm
        open={salaForm.open}
        initial={salaForm.initial}
        responsaveis={responsaveis}
        onClose={() => setSalaForm({ open: false, initial: null })}
        onSaved={fetchSalas}
      />
    </div>
  );
}
