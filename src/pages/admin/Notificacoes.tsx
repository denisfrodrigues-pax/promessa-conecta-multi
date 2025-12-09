import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Calendar, AlertCircle, Clock, Search, Plus, Send, Users, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

type NotificationType = 'nova_escala' | 'lembrete' | 'status_alterado' | 'sistema' | 'ministerio' | 'aviso_admin';

interface Notification {
  id: string;
  voluntario_id: string | null;
  escala_id: string | null;
  ministerio_id: string | null;
  tipo: NotificationType;
  titulo: string | null;
  mensagem: string;
  enviado_em: string | null;
  lido: boolean | null;
  created_at: string | null;
  voluntario?: { nome: string } | null;
  escala?: {
    ministerio_id: string | null;
    ministerios: { nome: string } | null;
  } | null;
  ministerio?: { nome: string } | null;
}

interface Ministerio {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  nome: string;
}

export default function AdminNotificacoes() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMinisterio, setFilterMinisterio] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'aviso_admin' as NotificationType,
    destinatario: 'all' as 'all' | 'ministerio' | 'usuario',
    ministerio_id: '',
    usuario_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchMinisterios(), fetchUsuarios()]);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select(`
          *,
          voluntario:profiles!notificacoes_voluntario_id_fkey(nome),
          escala:escalas(ministerio_id, ministerios(nome)),
          ministerio:ministerios!notificacoes_ministerio_id_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as NotificationType
      }));
      
      setNotifications(typedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    }
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

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!formData.titulo.trim() || !formData.mensagem.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }

    if (formData.destinatario === 'ministerio' && !formData.ministerio_id) {
      toast.error('Selecione um ministério');
      return;
    }

    if (formData.destinatario === 'usuario' && !formData.usuario_id) {
      toast.error('Selecione um usuário');
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const body: Record<string, unknown> = {
        titulo: formData.titulo,
        mensagem: formData.mensagem,
        tipo: formData.tipo,
      };

      if (formData.destinatario === 'all') {
        body.send_to_all = true;
      } else if (formData.destinatario === 'ministerio') {
        body.send_to_ministerio = formData.ministerio_id;
      } else {
        body.user_id = formData.usuario_id;
      }

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body,
      });

      if (error) throw error;

      toast.success(data.message || 'Notificação enviada com sucesso');
      setIsCreateDialogOpen(false);
      setFormData({
        titulo: '',
        mensagem: '',
        tipo: 'aviso_admin',
        destinatario: 'all',
        ministerio_id: '',
        usuario_id: '',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  const getNotificationIcon = (tipo: NotificationType) => {
    switch (tipo) {
      case 'nova_escala':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'lembrete':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'status_alterado':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'ministerio':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'sistema':
      case 'aviso_admin':
        return <Megaphone className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationTypeBadge = (tipo: NotificationType) => {
    switch (tipo) {
      case 'nova_escala':
        return <Badge className="bg-blue-100 text-blue-700">Escala</Badge>;
      case 'lembrete':
        return <Badge className="bg-amber-100 text-amber-700">Lembrete</Badge>;
      case 'status_alterado':
        return <Badge className="bg-purple-100 text-purple-700">Atualização</Badge>;
      case 'ministerio':
        return <Badge className="bg-green-100 text-green-700">Ministério</Badge>;
      case 'sistema':
        return <Badge className="bg-gray-100 text-gray-700">Sistema</Badge>;
      case 'aviso_admin':
        return <Badge className="bg-red-100 text-red-700">Aviso</Badge>;
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

    const matchesMinisterio =
      filterMinisterio === 'all' || 
      n.ministerio_id === filterMinisterio ||
      n.escala?.ministerio_id === filterMinisterio;

    const matchesTipo = filterTipo === 'all' || n.tipo === filterTipo;

    return matchesSearch && matchesMinisterio && matchesTipo;
  });

  const stats = {
    total: notifications.length,
    escalas: notifications.filter((n) => ['nova_escala', 'lembrete'].includes(n.tipo)).length,
    atualizacoes: notifications.filter((n) => n.tipo === 'status_alterado').length,
    avisos: notifications.filter((n) => ['sistema', 'aviso_admin', 'ministerio'].includes(n.tipo)).length,
    naoLidas: notifications.filter((n) => !n.lido).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Notificações</h1>
          <p className="text-muted-foreground">Gerencie e envie notificações</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Notificação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.escalas}</div>
            <div className="text-sm text-muted-foreground">Escalas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.atualizacoes}</div>
            <div className="text-sm text-muted-foreground">Atualizações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.avisos}</div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.naoLidas}</div>
            <div className="text-sm text-muted-foreground">Não Lidas</div>
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
                placeholder="Buscar por título, mensagem ou voluntário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMinisterio} onValueChange={setFilterMinisterio}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por ministério" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ministérios</SelectItem>
                {ministerios.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="nova_escala">Escala</SelectItem>
                <SelectItem value="lembrete">Lembrete</SelectItem>
                <SelectItem value="status_alterado">Atualização</SelectItem>
                <SelectItem value="ministerio">Ministério</SelectItem>
                <SelectItem value="aviso_admin">Aviso Admin</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
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
                <TableHead>Título</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead className="max-w-[300px]">Mensagem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="font-medium">
                      {notification.titulo || '-'}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
            <DialogDescription>
              Envie uma notificação para usuários do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Título da notificação"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite a mensagem..."
                rows={4}
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v) => setFormData({ ...formData, tipo: v as NotificationType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aviso_admin">Aviso Admin</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enviar para</Label>
              <Tabs 
                value={formData.destinatario} 
                onValueChange={(v) => setFormData({ ...formData, destinatario: v as 'all' | 'ministerio' | 'usuario' })}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="ministerio">Ministério</TabsTrigger>
                  <TabsTrigger value="usuario">Usuário</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {formData.destinatario === 'ministerio' && (
              <div className="space-y-2">
                <Label>Ministério</Label>
                <Select 
                  value={formData.ministerio_id} 
                  onValueChange={(v) => setFormData({ ...formData, ministerio_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ministério" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerios.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.destinatario === 'usuario' && (
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Select 
                  value={formData.usuario_id} 
                  onValueChange={(v) => setFormData({ ...formData, usuario_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
