import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { GraduationCap, Users, UserPlus, Loader2 } from 'lucide-react';

const CHURCH_ID = 'e19bf49a-4532-4fd9-98af-5b5682e50cd6';
const MES_ATUAL = new Date().getMonth() + 1;

export default function AdminEnsino() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [cicloId, setCicloId] = useState('');
  const [membroId, setMembroId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: ciclos = [], isLoading } = useQuery({
    queryKey: ['eb_ciclos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_ciclos')
        .select('*').eq('church_id', CHURCH_ID).order('ordem');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: disciplinas = [] } = useQuery({
    queryKey: ['eb_disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_disciplinas').select('id, ciclo_id, mes');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: aulas = [] } = useQuery({
    queryKey: ['eb_aulas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_aulas').select('id, disciplina_id');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: matriculas = [] } = useQuery({
    queryKey: ['eb_matriculas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_matriculas')
        .select('id, perfil_id, ciclo_id').eq('ativo', true);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: presencas = [] } = useQuery({
    queryKey: ['eb_presencas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eb_presencas')
        .select('perfil_id, aula_id, presente');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: todosAtivos = [] } = useQuery({
    queryKey: ['membros_ativos_basico'],
    queryFn: async () => {
      const { data, error } = await supabase.from('membros')
        .select('id, nome, perfil_id').eq('status', 'ativo').order('nome');
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const enrolledIds = useMemo(() => matriculas.map((m: any) => m.perfil_id), [matriculas]);

  const semMatricula = useMemo(
    () => todosAtivos.filter((m: any) => m.perfil_id && !enrolledIds.includes(m.perfil_id)),
    [todosAtivos, enrolledIds],
  );

  const cicloStats = useMemo(() => ciclos.map((ciclo: any) => {
    const cm = matriculas.filter((m: any) => m.ciclo_id === ciclo.id);
    const cd = disciplinas.filter((d: any) => d.ciclo_id === ciclo.id && d.mes <= MES_ATUAL);
    const allAulas = cd.flatMap((d: any) => aulas.filter((a: any) => a.disciplina_id === d.id));
    const totalPerMember = allAulas.length;
    let sumPct = 0;
    cm.forEach((m: any) => {
      const p = allAulas.filter((a: any) =>
        presencas.some((pr: any) => pr.aula_id === a.id && pr.perfil_id === m.perfil_id && pr.presente)
      ).length;
      sumPct += totalPerMember > 0 ? (p / totalPerMember) * 100 : 0;
    });
    return { ciclo, enrolled: cm.length, avgFreq: cm.length > 0 ? Math.round(sumPct / cm.length) : 0 };
  }), [ciclos, matriculas, disciplinas, aulas, presencas]);

  const handleMatricular = async () => {
    if (!cicloId || !membroId) return;
    const membro = todosAtivos.find((m: any) => m.id === membroId);
    if (!membro?.perfil_id) { toast.error('Membro sem perfil vinculado'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('eb_matriculas').insert({
        perfil_id: membro.perfil_id,
        ciclo_id: cicloId,
        data_inicio: new Date().toISOString().slice(0, 10),
        ativo: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['eb_matriculas'] });
      toast.success('Matrícula realizada com sucesso');
      setShowModal(false); setCicloId(''); setMembroId('');
    } catch {
      toast.error('Erro ao matricular membro');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48" /></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Escola Bíblica</h1>
          <p className="text-muted-foreground">Visão geral das matrículas e frequência</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />Matricular Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cicloStats.map(({ ciclo, enrolled, avgFreq }) => (
          <Card key={ciclo.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-promessa-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-promessa-700" />
                </div>
                <div>
                  <p className="font-semibold">{ciclo.nome}</p>
                  <p className="text-xs text-muted-foreground">{ciclo.subtitulo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{enrolled}</p>
                  <p className="text-xs text-muted-foreground">Matriculados</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${avgFreq >= 75 ? 'text-green-600' : avgFreq >= 50 ? 'text-amber-500' : avgFreq > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {avgFreq}%
                  </p>
                  <p className="text-xs text-muted-foreground">Freq. média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Membros sem matrícula ({semMatricula.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {semMatricula.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todos os membros ativos estão matriculados
            </p>
          ) : (
            <div className="divide-y">
              {semMatricula.slice(0, 50).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{m.nome}</span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setMembroId(m.id); setShowModal(true); }}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />Matricular
                  </Button>
                </div>
              ))}
              {semMatricula.length > 50 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  +{semMatricula.length - 50} membros não exibidos
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={open => { setShowModal(open); if (!open) { setCicloId(''); setMembroId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matricular Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Ciclo</label>
              <Select value={cicloId} onValueChange={setCicloId}>
                <SelectTrigger><SelectValue placeholder="Selecionar ciclo..." /></SelectTrigger>
                <SelectContent>
                  {ciclos.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Membro</label>
              <Select value={membroId} onValueChange={setMembroId}>
                <SelectTrigger><SelectValue placeholder="Selecionar membro..." /></SelectTrigger>
                <SelectContent>
                  {semMatricula.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); setCicloId(''); setMembroId(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleMatricular} disabled={saving || !cicloId || !membroId}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Matricular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
