import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Send, MessageSquare, Phone, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Crianca { id: string; nome: string }
interface Responsavel { id: string; nome: string; telefone: string; parentesco: string; is_primary: boolean }
interface Comunicacao {
  id: string;
  mensagem_original: string;
  mensagem_melhorada: string | null;
  responsavel_telefone: string;
  enviado: boolean;
  enviado_at: string | null;
  created_at: string;
}

function cleanPhone(tel: string): string {
  return tel.replace(/\D/g, '');
}

export default function Comunicacao({ ministerioId: propMid }: { ministerioId?: string } = {}) {
  const ctx = useOutletContext<{ ministerioId: string } | null>();
  const ministerioId = propMid ?? ctx?.ministerioId ?? '';
  const { user } = useAuth();
  const qc = useQueryClient();

  const [criancaId, setCriancaId] = useState('');
  const [respId, setRespId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [melhorada, setMelhorada] = useState('');
  const [contexto, setContexto] = useState('');
  const [melhorando, setMelhorando] = useState(false);
  const [usarMelhorada, setUsarMelhorada] = useState(false);

  const { data: churchId } = useQuery({
    queryKey: ['my_church_id'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from('igrejas').select('id').limit(1).maybeSingle();
      return (data as any)?.id as string | null ?? null;
    },
  });

  const { data: criancas = [] } = useQuery({
    queryKey: ['mca_criancas_simples', churchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_criancas').select('id, nome').eq('church_id', churchId).eq('ativo', true).order('nome');
      if (error) throw error;
      return data as Crianca[];
    },
    enabled: !!churchId,
  });

  const { data: responsaveis = [] } = useQuery({
    queryKey: ['mca_resp_crianca', criancaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_responsaveis').select('*').eq('crianca_id', criancaId).order('is_primary', { ascending: false });
      if (error) throw error;
      return data as Responsavel[];
    },
    enabled: !!criancaId,
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['mca_comunicacoes', criancaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mca_comunicacoes').select('*').eq('crianca_id', criancaId).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data as Comunicacao[];
    },
    enabled: !!criancaId,
  });

  async function melhorarMensagem() {
    if (!mensagem.trim()) { toast.error('Escreva uma mensagem primeiro'); return; }
    setMelhorando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/melhorar-mensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mensagem, contexto: contexto || undefined }),
      });
      const json = await res.json();
      if (json.mensagem_melhorada && json.mensagem_melhorada !== mensagem) {
        setMelhorada(json.mensagem_melhorada);
        setUsarMelhorada(true);
        toast.success('Mensagem melhorada pela IA');
      } else {
        toast.info(json.aviso ?? 'Sem alterações sugeridas');
      }
    } catch {
      toast.error('Erro ao conectar com a IA');
    } finally {
      setMelhorando(false);
    }
  }

  const enviarMutation = useMutation({
    mutationFn: async () => {
      const resp = responsaveis.find(r => r.id === respId) ?? responsaveis[0];
      if (!resp) throw new Error('Selecione um responsável');
      const textoFinal = usarMelhorada && melhorada ? melhorada : mensagem;
      if (!textoFinal.trim()) throw new Error('Mensagem vazia');

      const { error } = await (supabase as any).from('mca_comunicacoes').insert({
        crianca_id: criancaId,
        responsavel_telefone: resp.telefone,
        mensagem_original: mensagem,
        mensagem_melhorada: melhorada || null,
        enviado: true,
        enviado_at: new Date().toISOString(),
        criado_por: user?.id,
      });
      if (error) throw error;

      const phone = cleanPhone(resp.telefone);
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(textoFinal)}`;
      window.open(url, '_blank');
      return resp;
    },
    onSuccess: (resp) => {
      qc.invalidateQueries({ queryKey: ['mca_comunicacoes', criancaId] });
      toast.success(`WhatsApp aberto para ${resp?.nome}`);
      setMensagem('');
      setMelhorada('');
      setUsarMelhorada(false);
      setContexto('');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao enviar'),
  });

  const crianca = criancas.find(c => c.id === criancaId);
  const resp = responsaveis.find(r => r.id === respId) ?? responsaveis[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-promessa-900">Comunicação</h1>
        <p className="text-muted-foreground text-sm mt-1">Envie mensagens para responsáveis via WhatsApp</p>
      </div>

      {/* Seleção */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label>Criança</Label>
            <Select value={criancaId} onValueChange={v => { setCriancaId(v); setRespId(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar criança" /></SelectTrigger>
              <SelectContent>
                {criancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {responsaveis.length > 0 && (
            <div>
              <Label>Responsável</Label>
              <Select value={respId || responsaveis[0]?.id} onValueChange={setRespId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {responsaveis.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome} {r.is_primary ? '(principal)' : ''} · {r.telefone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {criancaId && responsaveis.length === 0 && (
            <p className="text-sm text-amber-600">Esta criança não tem responsáveis cadastrados.</p>
          )}
        </CardContent>
      </Card>

      {/* Mensagem */}
      {criancaId && responsaveis.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label>Contexto (opcional)</Label>
              <input
                className="w-full border rounded-md px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-promessa-400"
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                placeholder="Ex: Aviso sobre material, ocorrência na sala, etc."
              />
            </div>
            <div>
              <Label>Mensagem *</Label>
              <Textarea
                value={mensagem}
                onChange={e => { setMensagem(e.target.value); setMelhorada(''); setUsarMelhorada(false); }}
                placeholder={`Olá, sou do Ministério Infantil. Gostaria de informar sobre ${crianca?.nome}...`}
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={melhorarMensagem} disabled={melhorando || !mensagem.trim()}>
                {melhorando
                  ? <><span className="w-4 h-4 mr-2 inline-block animate-spin border-2 border-current border-t-transparent rounded-full" />Melhorando...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Melhorar com IA</>
                }
              </Button>
            </div>

            {melhorada && (
              <div className="border border-promessa-200 rounded-lg p-3 bg-promessa-50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-promessa-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />Versão melhorada pela IA
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button
                      className={`px-2 py-0.5 rounded ${usarMelhorada ? 'bg-promessa-600 text-white' : 'text-promessa-600 border border-promessa-300'}`}
                      onClick={() => setUsarMelhorada(true)}>Usar esta</button>
                    <button
                      className={`px-2 py-0.5 rounded ${!usarMelhorada ? 'bg-neutral-600 text-white' : 'text-neutral-600 border border-neutral-300'}`}
                      onClick={() => setUsarMelhorada(false)}>Usar original</button>
                  </div>
                </div>
                <p className="text-sm text-promessa-800 whitespace-pre-wrap">{melhorada}</p>
              </div>
            )}

            {resp && (
              <div className="flex items-center justify-between border-t pt-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Enviando para <strong>{resp.nome}</strong> ({resp.telefone})
                </div>
                <Button onClick={() => enviarMutation.mutate()} disabled={enviarMutation.isPending || !mensagem.trim()}>
                  <Send className="w-4 h-4 mr-2" />Enviar via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {criancaId && historico.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Histórico de comunicações</h2>
          <div className="space-y-2">
            {historico.map(c => (
              <Card key={c.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap line-clamp-3">
                        {c.mensagem_melhorada ?? c.mensagem_original}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{c.responsavel_telefone}
                        <Clock className="w-3 h-3" />
                        {format(new Date(c.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <Badge variant={c.enviado ? 'default' : 'secondary'} className="shrink-0">
                      {c.enviado ? <><CheckCircle className="w-3 h-3 mr-1" />Enviado</> : 'Rascunho'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
