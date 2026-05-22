import { useState, useEffect } from 'react';
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
import { Baby, Plus, Pencil, Trash2, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Crianca {
  id: string;
  nome: string;
  data_nascimento: string | null;
  responsavel_id: string | null;
  turma_id: string | null;
  alergias: string | null;
  autorizacao_foto: boolean | null;
  observacoes: string | null;
  responsavel_nome?: string;
  turma_nome?: string;
}

interface Turma {
  id: string;
  nome: string;
  faixa_etaria: string | null;
  responsavel_id: string | null;
  responsavel_nome?: string;
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

// ── Criança form modal ────────────────────────────────────────────────────────

interface CriancaFormProps {
  open: boolean;
  initial: Partial<Crianca> | null;
  turmas: Turma[];
  responsaveis: Responsavel[];
  onClose: () => void;
  onSaved: () => void;
}

function CriancaForm({ open, initial, turmas, responsaveis, onClose, onSaved }: CriancaFormProps) {
  const editing = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    responsavel_id: '',
    turma_id: '',
    alergias: '',
    autorizacao_foto: false,
    observacoes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        data_nascimento: initial?.data_nascimento ?? '',
        responsavel_id: initial?.responsavel_id ?? '',
        turma_id: initial?.turma_id ?? '',
        alergias: initial?.alergias ?? '',
        autorizacao_foto: initial?.autorizacao_foto ?? false,
        observacoes: initial?.observacoes ?? '',
      });
    }
  }, [open, initial]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        data_nascimento: form.data_nascimento || null,
        responsavel_id: form.responsavel_id || null,
        turma_id: form.turma_id || null,
        alergias: form.alergias.trim() || null,
        autorizacao_foto: form.autorizacao_foto,
        observacoes: form.observacoes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from('criancas').update(payload).eq('id', initial!.id!);
        if (error) throw error;
        toast.success('Criança atualizada!');
      } else {
        const { error } = await supabase.from('criancas').insert(payload);
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
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1">
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Responsável</Label>
            <Select value={form.responsavel_id} onValueChange={v => set('responsavel_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                {responsaveis.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Turma</Label>
            <Select value={form.turma_id} onValueChange={v => set('turma_id', v)}>
              <SelectTrigger><SelectValue placeholder="Sem turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem turma</SelectItem>
                {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Alergias</Label>
            <Input value={form.alergias} onChange={e => set('alergias', e.target.value)} placeholder="Ex: amendoim, glúten..." />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.autorizacao_foto} onCheckedChange={v => set('autorizacao_foto', v)} />
            <Label>Autorização de uso de foto</Label>
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={2} placeholder="Informações adicionais..." />
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

// ── Turma form modal ──────────────────────────────────────────────────────────

interface TurmaFormProps {
  open: boolean;
  initial: Partial<Turma> | null;
  responsaveis: Responsavel[];
  onClose: () => void;
  onSaved: () => void;
}

function TurmaForm({ open, initial, responsaveis, onClose, onSaved }: TurmaFormProps) {
  const editing = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', faixa_etaria: '', responsavel_id: '' });

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        faixa_etaria: initial?.faixa_etaria ?? '',
        responsavel_id: initial?.responsavel_id ?? '',
      });
    }
  }, [open, initial]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        faixa_etaria: form.faixa_etaria.trim() || null,
        responsavel_id: form.responsavel_id || null,
      };
      if (editing) {
        const { error } = await supabase.from('turmas_infantil').update(payload).eq('id', initial!.id!);
        if (error) throw error;
        toast.success('Turma atualizada!');
      } else {
        const { error } = await supabase.from('turmas_infantil').insert(payload);
        if (error) throw error;
        toast.success('Turma criada!');
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
          <DialogTitle>{editing ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Berçário, Maternal..." />
          </div>
          <div className="space-y-1">
            <Label>Faixa Etária</Label>
            <Input value={form.faixa_etaria} onChange={e => set('faixa_etaria', e.target.value)} placeholder="Ex: 0-2 anos, 3-5 anos..." />
          </div>
          <div className="space-y-1">
            <Label>Responsável</Label>
            <Select value={form.responsavel_id} onValueChange={v => set('responsavel_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {responsaveis.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
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
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loadingCriancas, setLoadingCriancas] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  const [criancaForm, setCriancaForm] = useState<{ open: boolean; initial: Partial<Crianca> | null }>({ open: false, initial: null });
  const [turmaForm, setTurmaForm] = useState<{ open: boolean; initial: Partial<Turma> | null }>({ open: false, initial: null });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchResponsaveis();
    fetchCriancas();
    fetchTurmas();
  };

  const fetchResponsaveis = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome')
      .order('nome');
    setResponsaveis((data as any[] || []).map(p => ({ id: p.id, nome: p.nome })));
  };

  const fetchCriancas = async () => {
    setLoadingCriancas(true);
    try {
      const { data, error } = await supabase
        .from('criancas')
        .select('*')
        .order('nome');
      if (error) throw error;

      const rows = data as any[] || [];
      const [profileIds, turmaIds] = [
        [...new Set(rows.map(r => r.responsavel_id).filter(Boolean))],
        [...new Set(rows.map(r => r.turma_id).filter(Boolean))],
      ];

      const [profilesRes, turmasRes] = await Promise.all([
        profileIds.length
          ? supabase.from('profiles').select('id, nome').in('id', profileIds)
          : Promise.resolve({ data: [] }),
        turmaIds.length
          ? supabase.from('turmas_infantil').select('id, nome').in('id', turmaIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, string> = Object.fromEntries(
        ((profilesRes.data as any[]) || []).map(p => [p.id, p.nome])
      );
      const turmaMap: Record<string, string> = Object.fromEntries(
        ((turmasRes.data as any[]) || []).map(t => [t.id, t.nome])
      );

      setCriancas(rows.map(r => ({
        ...r,
        responsavel_nome: r.responsavel_id ? profileMap[r.responsavel_id] : undefined,
        turma_nome: r.turma_id ? turmaMap[r.turma_id] : undefined,
      })));
    } catch {
      toast.error('Erro ao carregar crianças');
    } finally {
      setLoadingCriancas(false);
    }
  };

  const fetchTurmas = async () => {
    setLoadingTurmas(true);
    try {
      const { data, error } = await supabase
        .from('turmas_infantil')
        .select('*')
        .order('nome');
      if (error) throw error;

      const rows = data as any[] || [];
      const respIds = [...new Set(rows.map(r => r.responsavel_id).filter(Boolean))];
      const profilesRes = respIds.length
        ? await supabase.from('profiles').select('id, nome').in('id', respIds)
        : { data: [] };

      const profileMap: Record<string, string> = Object.fromEntries(
        ((profilesRes.data as any[]) || []).map(p => [p.id, p.nome])
      );

      setTurmas(rows.map(r => ({
        ...r,
        responsavel_nome: r.responsavel_id ? profileMap[r.responsavel_id] : undefined,
      })));
    } catch {
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoadingTurmas(false);
    }
  };

  const deleteCrianca = async (id: string) => {
    const { error } = await supabase.from('criancas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Criança removida');
    fetchCriancas();
  };

  const deleteTurma = async (id: string) => {
    const { error } = await supabase.from('turmas_infantil').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir turma'); return; }
    toast.success('Turma removida');
    fetchTurmas();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Baby className="w-6 h-6 text-primary" />
          Kids
        </h1>
        <p className="text-muted-foreground mt-1">Gestão de crianças e turmas infantis</p>
      </div>

      <Tabs defaultValue="criancas">
        <TabsList>
          <TabsTrigger value="criancas">
            Crianças
            <Badge variant="secondary" className="ml-2">{criancas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="turmas">
            Turmas
            <Badge variant="secondary" className="ml-2">{turmas.length}</Badge>
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
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
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
                        <th className="text-left py-2 px-3 font-medium">Nome</th>
                        <th className="text-left py-2 px-3 font-medium">Nascimento / Idade</th>
                        <th className="text-left py-2 px-3 font-medium">Responsável</th>
                        <th className="text-left py-2 px-3 font-medium">Turma</th>
                        <th className="text-left py-2 px-3 font-medium">Foto</th>
                        <th className="py-2 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {criancas.map(c => (
                        <tr key={c.id} className="border-b hover:bg-muted/40">
                          <td className="py-2 px-3 font-medium">
                            {c.nome}
                            {c.alergias && (
                              <span className="ml-2 text-[10px] bg-red-100 text-red-700 rounded px-1" title={`Alergias: ${c.alergias}`}>
                                alergia
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            <span>{formatDate(c.data_nascimento)}</span>
                            {c.data_nascimento && (
                              <span className="ml-2 text-xs">({calcAge(c.data_nascimento)})</span>
                            )}
                          </td>
                          <td className="py-2 px-3">{c.responsavel_nome || <span className="text-muted-foreground">–</span>}</td>
                          <td className="py-2 px-3">
                            {c.turma_nome
                              ? <Badge variant="secondary">{c.turma_nome}</Badge>
                              : <span className="text-muted-foreground">–</span>}
                          </td>
                          <td className="py-2 px-3">
                            {c.autorizacao_foto
                              ? <Badge className="bg-green-100 text-green-700">Sim</Badge>
                              : <Badge variant="outline">Não</Badge>}
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

        {/* ── Turmas ────────────────────────────────────────────────────── */}
        <TabsContent value="turmas" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Turmas Infantis</CardTitle>
              <Button size="sm" onClick={() => setTurmaForm({ open: true, initial: null })}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Turma
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTurmas ? (
                <div className="space-y-3">
                  {[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : turmas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma turma cadastrada</p>
                  <Button size="sm" className="mt-4" onClick={() => setTurmaForm({ open: true, initial: null })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira turma
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {turmas.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40">
                      <div>
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.faixa_etaria && <span className="mr-3">Faixa: {t.faixa_etaria}</span>}
                          {t.responsavel_nome && <span>Responsável: {t.responsavel_nome}</span>}
                          {!t.faixa_etaria && !t.responsavel_nome && '–'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setTurmaForm({ open: true, initial: t })}
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
                              <AlertDialogTitle>Excluir turma?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a turma <strong>{t.nome}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTurma(t.id)} className="bg-destructive text-white hover:bg-destructive/90">
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
        turmas={turmas}
        responsaveis={responsaveis}
        onClose={() => setCriancaForm({ open: false, initial: null })}
        onSaved={fetchCriancas}
      />
      <TurmaForm
        open={turmaForm.open}
        initial={turmaForm.initial}
        responsaveis={responsaveis}
        onClose={() => setTurmaForm({ open: false, initial: null })}
        onSaved={fetchTurmas}
      />
    </div>
  );
}
