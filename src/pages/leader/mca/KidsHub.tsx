import { useOutletContext } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Users, ClipboardCheck, BookOpenCheck, MessageCircle } from 'lucide-react';
import Criancas from './Criancas';
import Salas from './Salas';
import Checkin from './Checkin';
import Planos from './Planos';
import Comunicacao from './Comunicacao';

export default function KidsHub() {
  const { ministerioId } = useOutletContext<{ ministerioId: string; ministerioNome: string }>();

  return (
    <Tabs defaultValue="criancas" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        <TabsTrigger value="criancas" className="flex items-center gap-1.5 data-[state=active]:bg-white">
          <Baby className="w-4 h-4" />Crianças
        </TabsTrigger>
        <TabsTrigger value="salas" className="flex items-center gap-1.5 data-[state=active]:bg-white">
          <Users className="w-4 h-4" />Salas
        </TabsTrigger>
        <TabsTrigger value="checkin" className="flex items-center gap-1.5 data-[state=active]:bg-white">
          <ClipboardCheck className="w-4 h-4" />Check-in
        </TabsTrigger>
        <TabsTrigger value="planos" className="flex items-center gap-1.5 data-[state=active]:bg-white">
          <BookOpenCheck className="w-4 h-4" />Planos de Aula
        </TabsTrigger>
        <TabsTrigger value="comunicacao" className="flex items-center gap-1.5 data-[state=active]:bg-white">
          <MessageCircle className="w-4 h-4" />Comunicação
        </TabsTrigger>
      </TabsList>

      <TabsContent value="criancas">
        <Criancas ministerioId={ministerioId} />
      </TabsContent>
      <TabsContent value="salas">
        <Salas ministerioId={ministerioId} />
      </TabsContent>
      <TabsContent value="checkin">
        <Checkin ministerioId={ministerioId} />
      </TabsContent>
      <TabsContent value="planos">
        <Planos ministerioId={ministerioId} />
      </TabsContent>
      <TabsContent value="comunicacao">
        <Comunicacao ministerioId={ministerioId} />
      </TabsContent>
    </Tabs>
  );
}
