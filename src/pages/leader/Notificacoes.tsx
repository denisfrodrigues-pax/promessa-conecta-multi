import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Calendar, AlertCircle, Clock, Search, Send, Users, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  voluntario_id: string | null;
  escala_id: string | null;
  tipo: 'nova_escala' | 'lembrete' | 'status_alterado' | 'ministerio';
  mensagem: string;
  titulo: string | null;
  enviado_em: string | null;
  lido: boolean | null;
  created_at: string | null;
  voluntario?: { nome: string } | null;
  escala?: {
    ministerio_id: string | null;
    ministerios: { nome: string } | null;
  } | null;
}

interface MinistryMember {
  id: string;
  user_id: string;
  profile: { id: string; nome: string } | null;
}

export default function LeaderNotificacoes() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [myMinisterioId, setMyMinisterioId] = useState<string | null>(null);
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchMyMinisterio();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (myMinisterioId) {
      fetchNotifications();
      fetchMembers();
    }
  }, [myMinisterioId]);

  const fetchMyMinisterio = async () => {
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('id')
        .eq('lider_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMyMinisterioId(data?.id || null);
      
      if (!data?.id) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching ministerio:', error);
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!myMinisterioId) return;

    try {
      const { data, error } = await supabase
        .from('ministerio_voluntarios')
        .select(`
          id,
          user_id,
          profile:profiles!ministerio_voluntarios_user_id_fkey(id, nome)
        `)
        .eq('ministerio_id', myMinisterioId)
        .eq('ativo', true);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!myMinisterioId) return;

    setLoading(true);
    try {
      const { data: volunteers } = await supabase
        .from('ministerio_voluntarios')
        .select('user_id')
        .eq('ministerio_id', myMinisterioId);

      if (!volunteers || volunteers.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const userIds = volunteers.map((v) => v.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('user_id', userIds);

      if (!profiles || profiles.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const profileIds = profiles.map((p) => p.id);

      const { data, error } = await supabase
        .from('notificacoes')
        .select(`
          *,
          voluntario:profiles!notificacoes_voluntario_id_fkey(nome),
          escala:escalas(ministerio_id, ministerios(nome))
        `)
        .in('voluntario_id', profileIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'nova_escala' | 'lembrete' | 'status_alterado' | 'ministerio'
      }));
      
      setNotifications(typedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    if (members.length === 0) {
      toast.error('Nenhum membro encontrado no ministério');
      return;
    }

    setSending(true);
    try {
      const profileIds = members
        .filter(m => m.profile?.id)
        .map(m => m.profile!.id);

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          user_ids: profileIds,
          titulo,
          mensagem,
          tipo: 'ministerio',
          ministerio_id: myMinisterioId
        }
      });

      if (error) throw error;

      toast.success('Notificação enviada para todos os membros');
      setTitulo('');
      setMensagem('');
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    } finally {
      setDeletingId(null);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nova_escala':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'lembrete':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'status_alterado':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'ministerio':
        return <Users className="w-4 h-4 text-promessa-600" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getNotificationTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'nova_escala':
        return <Badge variant="info">Nova Escala</Badge>;
      case 'lembrete':
        return <Badge variant="warning">Lembrete</Badge>;
      case 'status_alterado':
        return <Badge variant="promessa">Atualização</Badge>;
      case 'ministerio':
        return <Badge variant="success">Ministério</Badge>;
      default:
        return <Badge variant="secondary">Notificação</Badge>;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      !searchTerm ||
      n.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.voluntario?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === 'all' || n.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const stats = {
    total: notifications.length,
    novasEscalas: notifications.filter((n) => n.tipo === 'nova_escala').length,
    lembretes: notifications.filter((n) => n.tipo === 'lembrete').length,
    atualizacoes: notifications.filter((n) => n.tipo === 'status_alterado').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!myMinisterioId) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-neutral-800">Nenhum ministério encontrado</h2>
        <p className="text-neutral-500">
          Você precisa ser líder de um ministério para ver notificações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-neutral-800">Notificações</h1>
          <p className="text-neutral-500 mt-1">Notificações dos voluntários do seu ministério</p>
        </div>
      </div>

      {/* Send notification form */}
      <Card className="shadow-card border-neutral-200 bg-gradient-to-br from-promessa-50 to-promessa-100/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-promessa-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-promessa-700" />
            </div>
            Enviar Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-neutral-700">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título da notificação"
              className="border-neutral-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensagem" className="text-neutral-700">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem..."
              rows={3}
              className="border-neutral-200"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-neutral-500">
              Será enviada para <span className="font-semibold text-neutral-700">{members.length}</span> membro(s) do seu ministério
            </p>
            <Button onClick={handleSendNotification} disabled={sending} className="bg-promessa-600 hover:bg-promessa-700">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-neutral-200">
          <CardContent className="p-5">
            <div className="text-3xl font-bold font-display text-neutral-800">{stats.total}</div>
            <div className="text-sm text-neutral-500 font-medium">Total</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-5">
            <div className="text-3xl font-bold font-display text-blue-700">{stats.novasEscalas}</div>
            <div className="text-sm text-neutral-500 font-medium">Novas Escalas</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5">
            <div className="text-3xl font-bold font-display text-amber-700">{stats.lembretes}</div>
            <div className="text-sm text-neutral-500 font-medium">Lembretes</div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-5">
            <div className="text-3xl font-bold font-display text-purple-700">{stats.atualizacoes}</div>
            <div className="text-sm text-neutral-500 font-medium">Atualizações</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-neutral-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por mensagem ou voluntário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-[200px] border-neutral-200">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="nova_escala">Nova Escala</SelectItem>
                <SelectItem value="lembrete">Lembrete</SelectItem>
                <SelectItem value="status_alterado">Atualização</SelectItem>
                <SelectItem value="ministerio">Ministério</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-neutral-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50 border-neutral-200">
                <TableHead className="text-neutral-700 font-semibold">Tipo</TableHead>
                <TableHead className="text-neutral-700 font-semibold">Voluntário</TableHead>
                <TableHead className="max-w-[300px] text-neutral-700 font-semibold">Mensagem</TableHead>
                <TableHead className="text-neutral-700 font-semibold">Data</TableHead>
                <TableHead className="text-neutral-700 font-semibold">Status</TableHead>
                <TableHead className="text-right text-neutral-700 font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                    Nenhuma notificação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id} className="border-neutral-200 hover:bg-neutral-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.tipo)}
                        {getNotificationTypeBadge(notification.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-700">{notification.voluntario?.nome || '-'}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-neutral-700">{notification.mensagem}</p>
                    </TableCell>
                    <TableCell className="text-neutral-600">
                      {notification.created_at &&
                        format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                    </TableCell>
                    <TableCell>
                      {notification.lido ? (
                        <Badge variant="secondary">Lida</Badge>
                      ) : (
                        <Badge variant="promessa">Não lida</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                            disabled={deletingId === notification.id}
                          >
                            {deletingId === notification.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}