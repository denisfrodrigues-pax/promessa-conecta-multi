import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Bell, Calendar, AlertCircle, CheckCircle, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

export default function MemberNotificacoes() {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'nova_escala':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'lembrete':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'status_alterado':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
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
      default:
        return <Badge variant="secondary">Notificação</Badge>;
    }
  };

  const filterByType = (tipo: string | null) => {
    if (!tipo) return notifications;
    return notifications.filter((n) => n.tipo === tipo);
  };

  const novasEscalas = filterByType('nova_escala');
  const lembretes = filterByType('lembrete');
  const atualizacoes = filterByType('status_alterado');

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
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhuma notificação nesta categoria</p>
        </div>
      ) : (
        items.map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              !notification.lido ? 'border-primary/50 bg-primary/5' : ''
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
                      <Badge variant="default" className="text-xs">Novo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {notification.mensagem}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.created_at &&
                      format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
                {notification.lido && (
                  <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Marcar tudo como lido
          </Button>
        )}
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">
            Todas
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="novas">
            Novas
            {novasEscalas.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {novasEscalas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lembretes">
            Lembretes
            {lembretes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {lembretes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="atualizacoes">
            Atualizações
            {atualizacoes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {atualizacoes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-6">
          <NotificationList items={notifications} />
        </TabsContent>
        <TabsContent value="novas" className="mt-6">
          <NotificationList items={novasEscalas} />
        </TabsContent>
        <TabsContent value="lembretes" className="mt-6">
          <NotificationList items={lembretes} />
        </TabsContent>
        <TabsContent value="atualizacoes" className="mt-6">
          <NotificationList items={atualizacoes} />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.tipo)}
              Detalhes da Notificação
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getNotificationTypeBadge(selectedNotification.tipo)}
              </div>
              <p className="text-foreground">{selectedNotification.mensagem}</p>
              <p className="text-sm text-muted-foreground">
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
