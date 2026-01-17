import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Users, CheckCircle, Clock, XCircle, Search, Eye, MessageCircle, Send, Loader2, History, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseLocalDate, formatDateForDB, isDatePast } from '@/lib/dateUtils';

interface Ministerio {
  id: string;
  nome: string;
}

interface Funcao {
  id: string;
  ministerio_id: string;
  nome: string;
  ativo: boolean;
}

interface Profile {
  id: string;
  nome: string;
  user_id: string;
  email?: string;
  telefone?: string | null;
  funcao_principal_id?: string | null;
}

interface Escala {
  id: string;
  data: string;
  horario: string | null;
  turno: string | null;
  funcao: string;
  status: string;
  status_geral: string | null;
  ministerio_id: string | null;
  voluntario_id: string | null;
  responsavel_id: string | null;
  justificativa: string | null;
  created_at: string;
  ministerios: { nome: string } | null;
  voluntario: { nome: string } | null;
  responsavel: { nome: string } | null;
}

interface EscalaGroup {
  key: string;
  ministerio_id: string | null;
  data: string;
  horario: string | null;
  funcao: string;
  turno: string | null;
  responsavel_id: string | null;
  status_geral: string | null;
  ministerio_nome: string | null;
  responsavel_nome: string | null;
  voluntarios: Array<{
    id: string;
    voluntario_id: string;
    nome: string;
    status: string;
    justificativa: string | null;
  }>;
}

interface EscalaFormData {
  ministerio_id: string;
  data: Date;
  horario: string;
  funcao: string;
  turno: string;
  responsavel_id: string;
  voluntarios_ids: string[];
  status_geral: string;
  lembrete_automatico_dias_antes: number | null;
}

const initialFormData: EscalaFormData = {
  ministerio_id: '',
  data: new Date(),
  horario: '',
  funcao: '',
  turno: '',
  responsavel_id: '',
  voluntarios_ids: [],
  status_geral: 'planejada',
  lembrete_automatico_dias_antes: null,
};

export default function AdminEscalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [escalaGroups, setEscalaGroups] = useState<EscalaGroup[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [voluntarios, setVoluntarios] = useState<Profile[]>([]);
  const [lideres, setLideres] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EscalaGroup | null>(null);
  const [viewingGroup, setViewingGroup] = useState<EscalaGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<EscalaGroup | null>(null);
  const [formData, setFormData] = useState<EscalaFormData>(initialFormData);
  const [selectedVoluntarioForWhatsApp, setSelectedVoluntarioForWhatsApp] = useState<{
    id: string;
    nome: string;
    telefone: string | null;
  } | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [isBatchWhatsAppDialogOpen, setIsBatchWhatsAppDialogOpen] = useState(false);
  const [sendingBatchWhatsApp, setSendingBatchWhatsApp] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [communicationHistory, setCommunicationHistory] = useState<Array<{
    id: string;
    voluntario_id: string | null;
    voluntario_nome?: string;
    tipo: string;
    status: string;
    mensagem_preview: string | null;
    detalhes_erro: string | null;
    created_at: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filters
  const [filterMinisterio, setFilterMinisterio] = useState<string>('all');
  const [filterData, setFilterData] = useState<Date | undefined>();
  const [filterVoluntario, setFilterVoluntario] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEscalas(),
      fetchMinisterios(),
      fetchVoluntarios(),
      fetchLideres(),
    ]);
    setLoading(false);
  };

  const fetchEscalas = async () => {
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select(`
          *,
          ministerios(nome),
          voluntario:profiles!escalas_voluntario_id_fkey(nome),
          responsavel:profiles!escalas_responsavel_id_fkey(nome)
        `)
        .order('data', { ascending: false });

      if (error) throw error;
      setEscalas(data || []);
      
      // Group escalas by (ministerio_id, data, funcao, turno)
      const groups = groupEscalas(data || []);
      setEscalaGroups(groups);
    } catch (error) {
      console.error('Error fetching escalas:', error);
      toast.error('Erro ao carregar escalas');
    }
  };

  const groupEscalas = (escalas: Escala[]): EscalaGroup[] => {
    const groupMap = new Map<string, EscalaGroup>();
    
    escalas.forEach((escala) => {
      const key = `${escala.ministerio_id}-${escala.data}-${escala.funcao}-${escala.turno || ''}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          ministerio_id: escala.ministerio_id,
          data: escala.data,
          horario: escala.horario,
          funcao: escala.funcao,
          turno: escala.turno,
          responsavel_id: escala.responsavel_id,
          status_geral: escala.status_geral,
          ministerio_nome: escala.ministerios?.nome || null,
          responsavel_nome: escala.responsavel?.nome || null,
          voluntarios: [],
        });
      }
      
      const group = groupMap.get(key)!;
      if (escala.voluntario_id && escala.voluntario) {
        group.voluntarios.push({
          id: escala.id,
          voluntario_id: escala.voluntario_id,
          nome: escala.voluntario.nome,
          status: escala.status,
          justificativa: escala.justificativa,
        });
      }
    });
    
    return Array.from(groupMap.values());
  };

  const fetchMinisterios = async () => {
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setMinisterios(data || []);
    } catch (error) {
      console.error('Error fetching ministerios:', error);
    }
  };

  const fetchVoluntarios = async () => {
    try {
      // Buscar usuários com roles que podem ser escalados: admin, financeiro, lider, voluntario
      // NÃO incluir membro e visitante
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'financeiro', 'lider', 'voluntario']);

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, user_id, telefone')
          .in('user_id', userIds)
          .order('nome');

        if (error) throw error;
        setVoluntarios(data || []);
      } else {
        setVoluntarios([]);
      }
    } catch (error) {
      console.error('Error fetching voluntarios:', error);
    }
  };

  const fetchVoluntariosByMinisterio = async (ministerioId: string) => {
    if (!ministerioId) {
      setVoluntarios([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          user_id,
          ativo,
          funcao_principal_id,
          profile:profiles!ministerio_voluntarios_user_id_fkey(id, nome, email, user_id, telefone)
        `)
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true);

      if (error) throw error;
      
      // Map to Profile format with funcao_principal_id
      const profiles = (data || [])
        .filter(item => item.profile)
        .map(item => ({
          id: item.profile!.id,
          nome: item.profile!.nome,
          email: item.profile!.email,
          user_id: item.profile!.user_id,
          telefone: item.profile!.telefone,
          funcao_principal_id: item.funcao_principal_id,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      setVoluntarios(profiles);
    } catch (error) {
      console.error('Error fetching voluntarios by ministerio:', error);
      // Fallback to all profiles
      fetchVoluntarios();
    }
  };

  const fetchFuncoesByMinisterio = async (ministerioId: string) => {
    if (!ministerioId) {
      setFuncoes([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('ministerio_funcoes')
        .select('id, ministerio_id, nome, ativo')
        .eq('ministerio_id', ministerioId)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Error fetching funcoes:', error);
      setFuncoes([]);
    }
  };

  const fetchLideres = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'lider']);

      if (error) throw error;

      const userIds = data?.map((r) => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome, user_id')
          .in('user_id', userIds)
          .order('nome');

        if (profilesError) throw profilesError;
        setLideres(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching lideres:', error);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData(initialFormData);
    setVoluntarios([]); // Clear volunteers until ministry is selected
    setFuncoes([]); // Clear functions until ministry is selected
    setIsDialogOpen(true);
  };

  const handleEdit = (group: EscalaGroup) => {
    setEditingGroup(group);
    // Get lembrete_automatico_dias_antes from first escala in group
    const firstEscala = escalas.find(e => group.voluntarios.some(v => v.id === e.id));
    setFormData({
      ministerio_id: group.ministerio_id || '',
      data: parseLocalDate(group.data),
      horario: group.horario || '',
      funcao: group.funcao,
      turno: group.turno || '',
      responsavel_id: group.responsavel_id || '',
      voluntarios_ids: group.voluntarios.map((v) => v.voluntario_id),
      status_geral: group.status_geral || 'planejada',
      lembrete_automatico_dias_antes: (firstEscala as any)?.lembrete_automatico_dias_antes || null,
    });
    // Load volunteers and functions for the ministry
    if (group.ministerio_id) {
      fetchVoluntariosByMinisterio(group.ministerio_id);
      fetchFuncoesByMinisterio(group.ministerio_id);
    }
    setIsDialogOpen(true);
  };

  const handleView = (group: EscalaGroup) => {
    setViewingGroup(group);
    setIsViewDialogOpen(true);
  };

  const handleViewHistory = async () => {
    if (!viewingGroup) return;
    
    setLoadingHistory(true);
    setIsHistoryDialogOpen(true);
    
    try {
      // Get all escala IDs from the group
      const escalaIds = viewingGroup.voluntarios.map(v => v.id);
      
      const { data, error } = await supabase
        .from('historico_comunicacoes')
        .select(`
          id,
          voluntario_id,
          tipo,
          status,
          mensagem_preview,
          detalhes_erro,
          created_at
        `)
        .in('escala_id', escalaIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map voluntario names
      const historyWithNames = (data || []).map(h => {
        const vol = viewingGroup.voluntarios.find(v => v.voluntario_id === h.voluntario_id);
        return {
          ...h,
          voluntario_nome: vol?.nome || 'Desconhecido',
        };
      });

      setCommunicationHistory(historyWithNames);
    } catch (error) {
      console.error('Error fetching communication history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenWhatsAppDialog = async (voluntarioId: string, voluntarioNome: string) => {
    // Fetch the volunteer's phone number
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('telefone')
        .eq('id', voluntarioId)
        .single();

      if (error) throw error;

      setSelectedVoluntarioForWhatsApp({
        id: voluntarioId,
        nome: voluntarioNome,
        telefone: data?.telefone || null,
      });
      setIsWhatsAppDialogOpen(true);
    } catch (error) {
      console.error('Error fetching volunteer phone:', error);
      toast.error('Erro ao buscar telefone do voluntário');
    }
  };

  const handleSendWhatsAppReminder = async () => {
    if (!selectedVoluntarioForWhatsApp || !viewingGroup) return;
    
    // Find the escala_id for this volunteer
    const escalaVoluntario = viewingGroup.voluntarios.find(
      v => v.voluntario_id === selectedVoluntarioForWhatsApp.id
    );
    
    if (!selectedVoluntarioForWhatsApp.telefone) {
      // Log the attempt with 'sem_telefone' status
      await supabase.from('historico_comunicacoes').insert({
        escala_id: escalaVoluntario?.id || null,
        voluntario_id: selectedVoluntarioForWhatsApp.id,
        tipo: 'whatsapp',
        status: 'sem_telefone',
        mensagem_preview: null,
        detalhes_erro: 'Voluntário não possui telefone cadastrado',
      });
      toast.error('Este voluntário não possui telefone cadastrado');
      return;
    }

    setSendingWhatsApp(true);

    try {
      // Format the reminder message
      const dataFormatada = format(parseLocalDate(viewingGroup.data), "dd/MM/yyyy", { locale: ptBR });
      const horario = viewingGroup.horario || 'horário a confirmar';
      const ministerio = viewingGroup.ministerio_nome || 'ministério';
      const funcao = viewingGroup.funcao;

      const mensagem = `Olá ${selectedVoluntarioForWhatsApp.nome}, você está escalado(a) para ${funcao} no ${ministerio} no dia ${dataFormatada} às ${horario}. Acesse o sistema para confirmar sua presença.`;
      const mensagemPreview = mensagem.substring(0, 255);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone_number: selectedVoluntarioForWhatsApp.telefone,
          message_body: mensagem,
          template_id: 'escala_reminder',
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Log success
        await supabase.from('historico_comunicacoes').insert({
          escala_id: escalaVoluntario?.id || null,
          voluntario_id: selectedVoluntarioForWhatsApp.id,
          tipo: 'whatsapp',
          status: 'sucesso',
          mensagem_preview: mensagemPreview,
          detalhes_erro: null,
        });
        toast.success(`Lembrete enviado para ${selectedVoluntarioForWhatsApp.nome}`);
        setIsWhatsAppDialogOpen(false);
        setSelectedVoluntarioForWhatsApp(null);
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error);
      // Log error
      await supabase.from('historico_comunicacoes').insert({
        escala_id: escalaVoluntario?.id || null,
        voluntario_id: selectedVoluntarioForWhatsApp.id,
        tipo: 'whatsapp',
        status: 'erro_api',
        mensagem_preview: null,
        detalhes_erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast.error('Erro ao enviar lembrete via WhatsApp');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSendBatchWhatsAppReminders = async () => {
    if (!viewingGroup) return;

    const pendingVolunteers = viewingGroup.voluntarios.filter(v => v.status === 'pendente');
    
    if (pendingVolunteers.length === 0) {
      toast.info('Não há voluntários pendentes para enviar lembretes');
      return;
    }

    setSendingBatchWhatsApp(true);
    
    let successCount = 0;
    let failedNoPhone = 0;
    let failedError = 0;

    try {
      // Fetch all volunteer phones in one query
      const voluntarioIds = pendingVolunteers.map(v => v.voluntario_id);
      const { data: phonesData, error: phonesError } = await supabase
        .from('profiles')
        .select('id, telefone')
        .in('id', voluntarioIds);

      if (phonesError) throw phonesError;

      const phoneMap = new Map(phonesData?.map(p => [p.id, p.telefone]) || []);

      // Format common message parts
      const dataFormatada = format(parseLocalDate(viewingGroup.data), "dd/MM/yyyy", { locale: ptBR });
      const horario = viewingGroup.horario || 'horário a confirmar';
      const ministerio = viewingGroup.ministerio_nome || 'ministério';
      const funcao = viewingGroup.funcao;

      // Send messages to each volunteer
      for (const vol of pendingVolunteers) {
        const telefone = phoneMap.get(vol.voluntario_id);
        
        if (!telefone) {
          failedNoPhone++;
          // Log sem_telefone status
          await supabase.from('historico_comunicacoes').insert({
            escala_id: vol.id,
            voluntario_id: vol.voluntario_id,
            tipo: 'whatsapp',
            status: 'sem_telefone',
            mensagem_preview: null,
            detalhes_erro: 'Voluntário não possui telefone cadastrado',
          });
          continue;
        }

        try {
          const mensagem = `Olá ${vol.nome}, você está escalado(a) para ${funcao} no ${ministerio} no dia ${dataFormatada} às ${horario}. Acesse o sistema para confirmar sua presença.`;
          const mensagemPreview = mensagem.substring(0, 255);

          const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              phone_number: telefone,
              message_body: mensagem,
              template_id: 'escala_reminder',
            },
          });

          if (error || !data?.success) {
            failedError++;
            // Log error
            await supabase.from('historico_comunicacoes').insert({
              escala_id: vol.id,
              voluntario_id: vol.voluntario_id,
              tipo: 'whatsapp',
              status: 'erro_api',
              mensagem_preview: mensagemPreview,
              detalhes_erro: error?.message || data?.error || 'Erro na API de WhatsApp',
            });
          } else {
            successCount++;
            // Log success
            await supabase.from('historico_comunicacoes').insert({
              escala_id: vol.id,
              voluntario_id: vol.voluntario_id,
              tipo: 'whatsapp',
              status: 'sucesso',
              mensagem_preview: mensagemPreview,
              detalhes_erro: null,
            });
          }
        } catch (err) {
          failedError++;
          // Log error
          await supabase.from('historico_comunicacoes').insert({
            escala_id: vol.id,
            voluntario_id: vol.voluntario_id,
            tipo: 'whatsapp',
            status: 'erro_api',
            mensagem_preview: null,
            detalhes_erro: err instanceof Error ? err.message : 'Erro desconhecido',
          });
        }
      }

      // Show summary toast
      if (successCount > 0 && failedNoPhone === 0 && failedError === 0) {
        toast.success(`Lembretes enviados para ${successCount} voluntário(s)`);
      } else if (successCount > 0) {
        toast.success(
          `Lembretes enviados: ${successCount} sucesso, ${failedNoPhone} sem telefone, ${failedError} com erro`
        );
      } else if (failedNoPhone > 0 && failedError === 0) {
        toast.error(`Nenhum lembrete enviado: ${failedNoPhone} voluntário(s) sem telefone cadastrado`);
      } else {
        toast.error(`Erro ao enviar lembretes: ${failedError} falha(s)`);
      }

      setIsBatchWhatsAppDialogOpen(false);
    } catch (error) {
      console.error('Error sending batch WhatsApp reminders:', error);
      toast.error('Erro ao enviar lembretes em lote');
    } finally {
      setSendingBatchWhatsApp(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;

    try {
      // Delete all escalas in this group
      const ids = deletingGroup.voluntarios.map((v) => v.id);
      
      const { error } = await supabase
        .from('escalas')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success('Escala excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setDeletingGroup(null);
      fetchEscalas();
    } catch (error) {
      console.error('Error deleting escala:', error);
      toast.error('Erro ao excluir escala');
    }
  };

  const handleSubmit = async () => {
    if (!formData.ministerio_id) {
      toast.error('Selecione um ministério');
      return;
    }
    if (!formData.funcao) {
      toast.error('Selecione uma função');
      return;
    }
    if (formData.voluntarios_ids.length === 0) {
      toast.error('Selecione pelo menos um voluntário');
      return;
    }

    try {
      if (editingGroup) {
        // When editing, delete old entries and create new ones with updated volunteers
        const oldIds = editingGroup.voluntarios.map((v) => v.id);
        
        // Delete old entries
        if (oldIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('escalas')
            .delete()
            .in('id', oldIds);

          if (deleteError) throw deleteError;
        }

        // Create new entries for selected volunteers
        const escalasToInsert = formData.voluntarios_ids.map((voluntarioId) => ({
          ministerio_id: formData.ministerio_id,
          data: formatDateForDB(formData.data),
          horario: formData.horario || null,
          funcao: formData.funcao,
          turno: formData.turno || null,
          responsavel_id: formData.responsavel_id || null,
          voluntario_id: voluntarioId,
          status_geral: formData.status_geral as 'planejada' | 'ativa' | 'concluida',
          status: 'pendente' as const,
          lembrete_automatico_dias_antes: formData.lembrete_automatico_dias_antes,
        }));

        const { error } = await supabase
          .from('escalas')
          .insert(escalasToInsert);

        if (error) throw error;
        toast.success('Escala atualizada com sucesso');
      } else {
        // Create new escalas for each volunteer
        const escalasToInsert = formData.voluntarios_ids.map((voluntarioId) => ({
          ministerio_id: formData.ministerio_id,
          data: formatDateForDB(formData.data),
          horario: formData.horario || null,
          funcao: formData.funcao,
          turno: formData.turno || null,
          responsavel_id: formData.responsavel_id || null,
          voluntario_id: voluntarioId,
          status_geral: formData.status_geral as 'planejada' | 'ativa' | 'concluida',
          status: 'pendente' as const,
          lembrete_automatico_dias_antes: formData.lembrete_automatico_dias_antes,
        }));

        const { error } = await supabase
          .from('escalas')
          .insert(escalasToInsert);

        if (error) throw error;
        toast.success(`${escalasToInsert.length} escala(s) criada(s) com sucesso`);
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingGroup(null);
      fetchEscalas();
    } catch (error) {
      console.error('Error saving escala:', error);
      toast.error('Erro ao salvar escala');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case 'ausente':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getStatusGeralBadge = (status: string | null) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-blue-100 text-blue-700">Ativa</Badge>;
      case 'concluida':
        return <Badge className="bg-gray-100 text-gray-700">Concluída</Badge>;
      default:
        return <Badge className="bg-purple-100 text-purple-700">Planejada</Badge>;
    }
  };

  const getVoluntariosStatusSummary = (voluntarios: EscalaGroup['voluntarios']) => {
    const confirmados = voluntarios.filter((v) => v.status === 'confirmado').length;
    const pendentes = voluntarios.filter((v) => v.status === 'pendente').length;
    const ausentes = voluntarios.filter((v) => v.status === 'ausente').length;
    
    return { confirmados, pendentes, ausentes, total: voluntarios.length };
  };

  const toggleVoluntario = (voluntarioId: string) => {
    setFormData((prev) => ({
      ...prev,
      voluntarios_ids: prev.voluntarios_ids.includes(voluntarioId)
        ? prev.voluntarios_ids.filter((id) => id !== voluntarioId)
        : [...prev.voluntarios_ids, voluntarioId],
    }));
  };

  // Filtered groups
  const filteredGroups = escalaGroups.filter((group) => {
    if (filterMinisterio !== 'all' && group.ministerio_id !== filterMinisterio) return false;
    if (filterVoluntario !== 'all' && !group.voluntarios.some((v) => v.voluntario_id === filterVoluntario)) return false;
    if (filterData && formatDateForDB(parseLocalDate(group.data)) !== formatDateForDB(filterData)) return false;
    if (searchTerm && !group.funcao.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Group escalas by date for calendar view
  const groupsByDate = filteredGroups.reduce((acc, group) => {
    const date = group.data;
    if (!acc[date]) acc[date] = [];
    acc[date].push(group);
    return acc;
  }, {} as Record<string, EscalaGroup[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Escalas</h1>
          <p className="text-muted-foreground">Gerencie as escalas de ministérios e voluntários</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterMinisterio} onValueChange={setFilterMinisterio}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ministério" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ministérios</SelectItem>
                {ministerios.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVoluntario} onValueChange={setFilterVoluntario}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Voluntário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Voluntários</SelectItem>
                {voluntarios.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !filterData && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterData ? format(filterData, 'dd/MM/yyyy') : 'Filtrar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterData}
                  onSelect={setFilterData}
                  locale={ptBR}
                />
                {filterData && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setFilterData(undefined)}>
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Ministério</TableHead>
                    <TableHead>Voluntários</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma escala encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group) => {
                      const summary = getVoluntariosStatusSummary(group.voluntarios);
                      return (
                        <TableRow key={group.key}>
                          <TableCell>
                            <div className="font-medium">
                              {format(parseLocalDate(group.data), 'dd/MM/yyyy')}
                            </div>
                            {group.horario && (
                              <div className="text-sm text-muted-foreground">{group.horario}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{group.funcao}</div>
                            {group.turno && (
                              <div className="text-sm text-muted-foreground capitalize">{group.turno}</div>
                            )}
                          </TableCell>
                          <TableCell>{group.ministerio_nome || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{summary.total}</span>
                              <div className="flex gap-1">
                                {summary.confirmados > 0 && (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">
                                    {summary.confirmados} ✓
                                  </Badge>
                                )}
                                {summary.pendentes > 0 && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
                                    {summary.pendentes} ⏳
                                  </Badge>
                                )}
                                {summary.ausentes > 0 && (
                                  <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                                    {summary.ausentes} ✗
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusGeralBadge(group.status_geral)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleView(group)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingGroup(group);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Calendar
                  mode="single"
                  selected={filterData}
                  onSelect={setFilterData}
                  locale={ptBR}
                  className="rounded-md border"
                  modifiers={{
                    hasEscala: Object.keys(groupsByDate).map((d) => parseLocalDate(d)),
                  }}
                  modifiersStyles={{
                    hasEscala: { backgroundColor: 'hsl(var(--primary) / 0.1)', fontWeight: 'bold' },
                  }}
                />
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {filterData
                      ? `Escalas em ${format(filterData, "dd 'de' MMMM", { locale: ptBR })}`
                      : 'Selecione uma data'}
                  </h3>
                  {filterData && groupsByDate[format(filterData, 'yyyy-MM-dd')] ? (
                    <div className="space-y-2">
                      {groupsByDate[format(filterData, 'yyyy-MM-dd')].map((group) => {
                        const summary = getVoluntariosStatusSummary(group.voluntarios);
                        return (
                          <div 
                            key={group.key} 
                            className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleView(group)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{group.funcao}</p>
                                <p className="text-sm text-muted-foreground">
                                  {group.ministerio_nome} • {summary.total} voluntário(s)
                                </p>
                              </div>
                              {getStatusGeralBadge(group.status_geral)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : filterData ? (
                    <p className="text-muted-foreground">Nenhuma escala nesta data</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog - Show all volunteers and their status */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Escala</DialogTitle>
            <DialogDescription>
              Status de cada voluntário nesta escala
            </DialogDescription>
          </DialogHeader>
          
          {viewingGroup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="font-medium">{format(parseLocalDate(viewingGroup.data), 'dd/MM/yyyy')}</span>
                </div>
                {viewingGroup.horario && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Horário:</span>
                    <span className="font-medium">{viewingGroup.horario}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <span className="font-medium">{viewingGroup.funcao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ministério:</span>
                  <span className="font-medium">{viewingGroup.ministerio_nome || '-'}</span>
                </div>
                {viewingGroup.responsavel_nome && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Responsável:</span>
                    <span className="font-medium">{viewingGroup.responsavel_nome}</span>
                  </div>
                )}
              </div>

              {/* Status Counters */}
              {(() => {
                const summary = getVoluntariosStatusSummary(viewingGroup.voluntarios);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{summary.confirmados}</p>
                      <p className="text-xs text-emerald-600 font-medium">Confirmados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{summary.pendentes}</p>
                      <p className="text-xs text-yellow-600 font-medium">Pendentes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-center">
                      <p className="text-2xl font-bold text-red-600">{summary.ausentes}</p>
                      <p className="text-xs text-red-600 font-medium">Recusados</p>
                    </div>
                  </div>
                );
              })()}

              {/* Grouped Volunteers by Status */}
              <div className="space-y-4">
                {/* Confirmados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'confirmado').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <p className="font-medium">{vol.nome}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(vol.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pendentes */}
                {viewingGroup.voluntarios.filter(v => v.status === 'pendente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pendentes
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'pendente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                          <p className="font-medium">{vol.nome}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(vol.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recusados */}
                {viewingGroup.voluntarios.filter(v => v.status === 'ausente').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-700 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Recusados
                    </h4>
                    <div className="space-y-2">
                      {viewingGroup.voluntarios.filter(v => v.status === 'ausente').map((vol) => (
                        <div key={vol.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                          <div>
                            <p className="font-medium">{vol.nome}</p>
                            {vol.justificativa && (
                              <p className="text-sm text-red-600/80 mt-1">
                                Justificativa: {vol.justificativa}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(vol.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {viewingGroup && (
                <Button
                  variant="outline"
                  onClick={handleViewHistory}
                  className="w-full sm:w-auto"
                >
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              )}
              {/* WhatsApp buttons disabled - API not configured */}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Fechar
              </Button>
              {viewingGroup && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(viewingGroup);
                }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Reminder Dialog */}
      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Enviar Lembrete WhatsApp
            </DialogTitle>
            <DialogDescription>
              Enviar lembrete da escala via WhatsApp
            </DialogDescription>
          </DialogHeader>

          {selectedVoluntarioForWhatsApp && viewingGroup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Voluntário:</span>
                  <span className="font-medium">{selectedVoluntarioForWhatsApp.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <span className="font-medium">
                    {selectedVoluntarioForWhatsApp.telefone || (
                      <span className="text-destructive">Não cadastrado</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">Prévia da mensagem:</p>
                <p className="text-sm text-green-700">
                  Olá {selectedVoluntarioForWhatsApp.nome}, você está escalado(a) para {viewingGroup.funcao} no {viewingGroup.ministerio_nome || 'ministério'} no dia {format(parseLocalDate(viewingGroup.data), "dd/MM/yyyy", { locale: ptBR })} às {viewingGroup.horario || 'horário a confirmar'}. Acesse o sistema para confirmar sua presença.
                </p>
              </div>

              {!selectedVoluntarioForWhatsApp.telefone && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">
                    Este voluntário não possui telefone cadastrado. Por favor, atualize o cadastro antes de enviar o lembrete.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsWhatsAppDialogOpen(false);
                setSelectedVoluntarioForWhatsApp(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendWhatsAppReminder}
              disabled={sendingWhatsApp || !selectedVoluntarioForWhatsApp?.telefone}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Lembrete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch WhatsApp Reminder Dialog */}
      <Dialog open={isBatchWhatsAppDialogOpen} onOpenChange={setIsBatchWhatsAppDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Lembrar Pendentes via WhatsApp
            </DialogTitle>
            <DialogDescription>
              Enviar lembretes para todos os voluntários pendentes desta escala
            </DialogDescription>
          </DialogHeader>

          {viewingGroup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="font-medium">{format(parseLocalDate(viewingGroup.data), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <span className="font-medium">{viewingGroup.funcao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ministério:</span>
                  <span className="font-medium">{viewingGroup.ministerio_nome || '-'}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Voluntários pendentes: {viewingGroup.voluntarios.filter(v => v.status === 'pendente').length}
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {viewingGroup.voluntarios.filter(v => v.status === 'pendente').map(vol => (
                    <li key={vol.id} className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {vol.nome}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">
                  Será enviada uma mensagem de lembrete para cada voluntário pendente que tenha telefone cadastrado.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBatchWhatsAppDialogOpen(false)}
              disabled={sendingBatchWhatsApp}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendBatchWhatsAppReminders}
              disabled={sendingBatchWhatsApp}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingBatchWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Todos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Communication History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Comunicações
            </DialogTitle>
            <DialogDescription>
              Registro de mensagens enviadas para esta escala
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : communicationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma comunicação registrada para esta escala</p>
            </div>
          ) : (
            <div className="space-y-3">
              {communicationHistory.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-3 rounded-lg border",
                    item.status === 'sucesso' && "bg-emerald-50 border-emerald-200",
                    item.status === 'sem_telefone' && "bg-yellow-50 border-yellow-200",
                    item.status === 'erro_api' && "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.voluntario_nome}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          item.tipo === 'whatsapp_auto' && "bg-blue-100 text-blue-700 border-blue-200"
                        )}
                      >
                        {item.tipo === 'whatsapp_auto' ? 'Automático' : 'Manual'}
                      </Badge>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        item.status === 'sucesso' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                        item.status === 'sem_telefone' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                        item.status === 'erro_api' && "bg-red-100 text-red-700 border-red-200"
                      )}
                    >
                      {item.status === 'sucesso' && 'Enviado'}
                      {item.status === 'sem_telefone' && 'Sem telefone'}
                      {item.status === 'erro_api' && 'Erro'}
                    </Badge>
                  </div>
                  {item.mensagem_preview && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {item.mensagem_preview}
                    </p>
                  )}
                  {item.detalhes_erro && item.status !== 'sucesso' && (
                    <p className="text-xs text-red-600 mb-2">
                      {item.detalhes_erro}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Escala' : 'Nova Escala'}</DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Atualize os dados da escala. Ao alterar voluntários, o status de confirmação será resetado.'
                : 'Crie uma nova escala para o ministério'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ministério *</Label>
                <Select
                  value={formData.ministerio_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, ministerio_id: value, voluntarios_ids: [], funcao: '' });
                    fetchVoluntariosByMinisterio(value);
                    fetchFuncoesByMinisterio(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerios.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={formData.responsavel_id}
                  onValueChange={(value) => setFormData({ ...formData, responsavel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lideres.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.data, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => date && setFormData({ ...formData, data: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  placeholder="Ex: 09:00 - 12:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função *</Label>
                {formData.ministerio_id && funcoes.length === 0 ? (
                  <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-700">
                    <p className="text-sm font-medium">Nenhuma função ativa</p>
                    <p className="text-xs mt-0.5">Cadastre funções em "Funções de Ministério"</p>
                  </div>
                ) : (
                  <Select
                    value={formData.funcao}
                    onValueChange={(value) => setFormData({ ...formData, funcao: value })}
                    disabled={!formData.ministerio_id || funcoes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.ministerio_id ? "Selecione uma função..." : "Selecione um ministério primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) => setFormData({ ...formData, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status Geral</Label>
                <Select
                  value={formData.status_geral}
                  onValueChange={(value) => setFormData({ ...formData, status_geral: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejada">Planejada</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Lembrete Automático
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    placeholder="Dias"
                    value={formData.lembrete_automatico_dias_antes ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      lembrete_automatico_dias_antes: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">dias antes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para desativar
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voluntários * {editingGroup && <span className="text-muted-foreground font-normal">(alterar irá resetar confirmações)</span>}</Label>
              <Card>
                <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
                  {!formData.ministerio_id ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Selecione um ministério primeiro
                      </p>
                    </div>
                  ) : voluntarios.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-amber-600 font-medium">
                        Nenhum voluntário ativo neste ministério
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastre voluntários primeiro em "Voluntários por Ministério"
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {voluntarios.map((v) => {
                        const selectedFuncao = funcoes.find(f => f.nome === formData.funcao);
                        const isMainFunction = selectedFuncao && v.funcao_principal_id === selectedFuncao.id;
                        return (
                          <div 
                            key={v.id} 
                            className={cn(
                              "flex items-center space-x-2 p-1.5 rounded-md transition-colors",
                              isMainFunction && "bg-primary/10 border border-primary/20"
                            )}
                          >
                            <Checkbox
                              id={v.id}
                              checked={formData.voluntarios_ids.includes(v.id)}
                              onCheckedChange={() => toggleVoluntario(v.id)}
                            />
                            <label
                              htmlFor={v.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              <span>{v.nome}</span>
                              {isMainFunction && (
                                <Badge variant="outline" className="ml-2 text-xs py-0 px-1.5 bg-primary/5">
                                  Função Principal
                                </Badge>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              {formData.voluntarios_ids.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.voluntarios_ids.length} voluntário(s) selecionado(s)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingGroup ? 'Salvar' : 'Criar Escala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Escala</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta escala? Isso removerá todos os {deletingGroup?.voluntarios.length || 0} voluntários atribuídos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
