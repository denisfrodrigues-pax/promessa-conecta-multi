import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Bell, Calendar, AlertCircle, CheckCircle, Clock, Check, Users, Megaphone, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MemberNotificacoes() {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  const handleOpenNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    if (!notification.lido) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeletingId(notificationId);
    const success = await deleteNotification(notificationId);
    if (success) {
      toast.success('Notificação excluída');
    } else {
      toast.error('Erro ao excluir notificação');
    }
    setDeletingId(null);
  };

  const getNotificationIcon = (tipo: NotificationType) => {
    switch (tipo) {
      case 'nova_escala':
      case 'escala':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'lembrete':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'status_alterado':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'ministerio':
        return <Users className="w-5 h-5 text-promessa-600" />;
      case 'sistema':
      case 'aviso_admin':
        return <Megaphone className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getNotificationTypeBadge = (tipo: NotificationType) => {
    switch (tipo) {
      case 'nova_escala':
      case 'escala':
        return <Badge variant="info">Escala</Badge>;
      case 'lembrete':
        return <Badge variant="warning">Lembrete</Badge>;
      case 'status_alterado':
        return <Badge variant="promessa">Atualização</Badge>;
      case 'ministerio':
        return <Badge variant="success">Ministério</Badge>;
      case 'sistema':
        return <Badge variant="secondary">Sistema</Badge>;
      case 'aviso_admin':
        return <Badge variant="admin">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Notificação</Badge>;
    }
  };

  const filterByType = (tipos: NotificationType[] | null) => {
    if (!tipos) return notifications;
    return notifications.filter((n) => tipos.includes(n.tipo));
  };

  const escalas = filterByType(['nova_escala', 'escala', 'lembrete']);
  const atualizacoes = filterByType(['status_alterado']);
  const ministerio = filterByType(['ministerio']);
  const sistema = filterByType(['sistema', 'aviso_admin']);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const NotificationList = ({ items }: { items: Notification[] }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhuma notificação nesta categoria</p>
        </div>
      ) : (
        items.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-all hover:shadow-md border-neutral-200 ${
              !notification.lido ? 'border-promessa-300 bg-promessa-50/50' : 'bg-white'
            }`}
            onClick={() => handleOpenNotification(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getNotificationTypeBadge(notification.tipo)}
                    {!notification.lido && (
                      <Badge variant="promessa" className="text-xs">Novo</Badge>
                    )}
                  </div>
                  {notification.titulo && (
                    <p className="font-medium text-neutral-800 mb-1">{notification.titulo}</p>
                  )}
                  <p className="text-sm text-neutral-600 line-clamp-2">
                    {notification.mensagem}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {notification.created_at &&
                      format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {notification.lido && (
                    <CheckCircle className="w-4 h-4 text-neutral-400" />
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-neutral-800">Notificações</h1>
          <p className="text-neutral-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="border-neutral-200 text-neutral-700 hover:bg-neutral-50">
            <Check className="w-4 h-4 mr-2" />
            Marcar tudo como lido
          </Button>
        )}
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-neutral-100">
          <TabsTrigger value="todas" className="text-neutral-700 data-[state=active]:bg-white data-[state=active]:text-promessa-700">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="escalas" className="text-neutral-700 data-[state=active]:bg-white data-[state=active]:text-promessa-700">
            Escalas
            {escalas.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {escalas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="atualizacoes" className="text-neutral-700 data-[state=active]:bg-white data-[state=active]:text-promessa-700">
            Atualizações
            {atualizacoes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {atualizacoes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ministerio" className="text-neutral-700 data-[state=active]:bg-white data-[state=active]:text-promessa-700">
            Ministério
            {ministerio.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {ministerio.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sistema" className="text-neutral-700 data-[state=active]:bg-white data-[state=active]:text-promessa-700">
            Sistema
            {sistema.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {sistema.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-6">
          <NotificationList items={notifications} />
        </TabsContent>
        <TabsContent value="escalas" className="mt-6">
          <NotificationList items={escalas} />
        </TabsContent>
        <TabsContent value="atualizacoes" className="mt-6">
          <NotificationList items={atualizacoes} />
        </TabsContent>
        <TabsContent value="ministerio" className="mt-6">
          <NotificationList items={ministerio} />
        </TabsContent>
        <TabsContent value="sistema" className="mt-6">
          <NotificationList items={sistema} />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-neutral-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-neutral-800">
              {selectedNotification && getNotificationIcon(selectedNotification.tipo)}
              {selectedNotification?.titulo || 'Detalhes da Notificação'}
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getNotificationTypeBadge(selectedNotification.tipo)}
              </div>
              <p className="text-neutral-700">{selectedNotification.mensagem}</p>
              <p className="text-sm text-neutral-500">
                Recebida em:{' '}
                {selectedNotification.created_at &&
                  format(new Date(selectedNotification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}