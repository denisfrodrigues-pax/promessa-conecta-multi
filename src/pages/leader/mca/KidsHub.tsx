import { useOutletContext } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Baby, Users, ClipboardCheck, BookOpenCheck, MessageCircle } from 'lucide-react';
import Criancas from './Criancas';
import Salas from './Salas';
import Checkin from './Checkin';
import Planos from './Planos';
import Comunicacao from './Comunicacao';

export default function KidsHub() {
  const { ministerioId, minhasPermissoes = [], isFuncaoOnly = false } = useOutletContext<{
    ministerioId: string; ministerioNome: string; minhasPermissoes?: string[]; isFuncaoOnly?: boolean;
  }>();

  // Salas e Comunicação continuam líder/admin-only — nenhuma permissão do
  // catálogo desta rodada cobre elas. Crianças/Check-in/Planos são
  // função-scoped conforme a permissão que a pessoa tem. Importante: Professor
  // (mca.professor.gerenciar_sala) NÃO cobre check-in — diferente do Ensino,
  // aqui o catálogo separa completamente "gerencia plano de aula" de "faz
  // check-in", confirmado via RLS (mca_checkins não aceita
  // professor.gerenciar_sala em nenhuma condição). Misturar os dois aqui
  // mostraria uma aba que a RLS sempre recusaria.
  const podeCriancas = !isFuncaoOnly || minhasPermissoes.includes('mca.secretaria.gerenciar');
  const podeSalas = !isFuncaoOnly;
  const podeCheckin = !isFuncaoOnly || minhasPermissoes.includes('mca.checkin.qualquer_sala');
  const podePlanos = !isFuncaoOnly || minhasPermissoes.includes('mca.professor.gerenciar_sala');
  const podeComunicacao = !isFuncaoOnly;

  const defaultTab = podeCriancas ? 'criancas' : podeCheckin ? 'checkin' : podePlanos ? 'planos' : 'criancas';

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList className="flex flex-wrap h-auto gap-1.5 bg-stone-100 p-1.5">
        {podeCriancas && (
          <TabsTrigger value="criancas" className="flex items-center gap-1.5 data-[state=active]:bg-white">
            <Baby className="w-4 h-4" />Crianças
          </TabsTrigger>
        )}
        {podeSalas && (
          <TabsTrigger value="salas" className="flex items-center gap-1.5 data-[state=active]:bg-white">
            <Users className="w-4 h-4" />Salas
          </TabsTrigger>
        )}
        {podeCheckin && (
          <TabsTrigger value="checkin" className="flex items-center gap-1.5 data-[state=active]:bg-white">
            <ClipboardCheck className="w-4 h-4" />Check-in
          </TabsTrigger>
        )}
        {podePlanos && (
          <TabsTrigger value="planos" className="flex items-center gap-1.5 data-[state=active]:bg-white">
            <BookOpenCheck className="w-4 h-4" />Planos de Aula
          </TabsTrigger>
        )}
        {podeComunicacao && (
          <TabsTrigger value="comunicacao" className="flex items-center gap-1.5 data-[state=active]:bg-white">
            <MessageCircle className="w-4 h-4" />Comunicação
          </TabsTrigger>
        )}
      </TabsList>

      {podeCriancas && (
        <TabsContent value="criancas">
          <Criancas ministerioId={ministerioId} />
        </TabsContent>
      )}
      {podeSalas && (
        <TabsContent value="salas">
          <Salas ministerioId={ministerioId} />
        </TabsContent>
      )}
      {podeCheckin && (
        <TabsContent value="checkin">
          <Checkin ministerioId={ministerioId} />
        </TabsContent>
      )}
      {podePlanos && (
        <TabsContent value="planos">
          <Planos ministerioId={ministerioId} />
        </TabsContent>
      )}
      {podeComunicacao && (
        <TabsContent value="comunicacao">
          <Comunicacao ministerioId={ministerioId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
