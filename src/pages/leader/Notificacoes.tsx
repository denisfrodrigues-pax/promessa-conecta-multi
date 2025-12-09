import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Calendar, AlertCircle, Clock, Search, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

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

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nova_escala':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'lembrete':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'status_alterado':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'ministerio':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'nova_escala':
        return <Badge className="bg-blue-100 text-blue-700">Nova Escala</Badge>;
      case 'lembrete':
        return <Badge className="bg-amber-100 text-amber-700">Lembrete</Badge>;
      case 'status_alterado':
        return <Badge className="bg-purple-100 text-purple-700">Atualização</Badge>;
      case 'ministerio':
        return <Badge className="bg-green-100 text-green-700">Ministério</Badge>;
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
        <Bell className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum ministério encontrado</h2>
        <p className="text-muted-foreground">
          Você precisa ser líder de um ministério para ver notificações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Notificações</h1>
          <p className="text-muted-foreground">Notificações dos voluntários do seu ministério</p>
        </div>
      </div>

      {/* Send notification form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título da notificação"
            />
          </div>
          <div>
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Será enviada para {members.length} membro(s) do seu ministério
            </p>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.novasEscalas}</div>
            <div className="text-sm text-muted-foreground">Novas Escalas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.lembretes}</div>
            <div className="text-sm text-muted-foreground">Lembretes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.atualizacoes}</div>
            <div className="text-sm text-muted-foreground">Atualizações</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por mensagem ou voluntário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-[200px]">
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
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Voluntário</TableHead>
                <TableHead className="max-w-[300px]">Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma notificação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.tipo)}
                        {getNotificationTypeBadge(notification.tipo)}
                      </div>
                    </TableCell>
                    <TableCell>{notification.voluntario?.nome || '-'}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate">{notification.mensagem}</p>
                    </TableCell>
                    <TableCell>
                      {notification.created_at &&
                        format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                    </TableCell>
                    <TableCell>
                      {notification.lido ? (
                        <Badge variant="secondary">Lida</Badge>
                      ) : (
                        <Badge variant="default">Não lida</Badge>
                      )}
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