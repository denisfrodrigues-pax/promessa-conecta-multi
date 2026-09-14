import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, MessageCircle, PartyPopper } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getCurrentWeekMonthDayPairs, monthDayFromDateString } from '@/lib/birthdayWeek';
import { getWhatsAppUrl, hasValidPhone } from '@/lib/formatters';

interface MembroRaw {
  id: string;
  nome: string;
  telefone: string | null;
  data_nascimento: string | null;
  profiles: { foto_url: string | null; data_nascimento: string | null; telefone: string | null } | null;
}

interface Aniversariante {
  key: string;
  nome: string;
  telefone: string | null;
  fotoUrl: string | null;
  mes: number;
  dia: number;
}

function getInitials(nome: string) {
  return nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

/** Card "Aniversariantes da Semana" reutilizável — mesma janela semanal do
 * painel pastoral (pages/Aniversariantes.tsx), mas em formato compacto pra
 * caber na home de qualquer papel (membro, líder, admin, voluntário), com
 * foto + nome + data + botão de WhatsApp por pessoa. Complementa
 * AniversariantesDoMes (mensal, sem ação direta) e o painel pastoral
 * (semanal + batismo/casamento, telas de admin/líder).
 */
export function AniversariantesDaSemanaCard() {
  const { churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) return;
    fetchAniversariantes();
  }, [churchId]);

  const fetchAniversariantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome, telefone, data_nascimento, profiles!membros_user_id_fkey(foto_url, data_nascimento, telefone)')
        .eq('church_id', churchId as string)
        .in('status', ['ativo', 'frequentador']);

      if (error) throw error;

      const pairs = getCurrentWeekMonthDayPairs();
      const semana = ((data || []) as MembroRaw[])
        .map((m) => ({
          ...m,
          data_nascimento: m.profiles?.data_nascimento || m.data_nascimento,
          telefone: m.profiles?.telefone || m.telefone,
        }))
        .filter((m) => {
          if (!m.data_nascimento) return false;
          const { mes, dia } = monthDayFromDateString(m.data_nascimento);
          return pairs.some((p) => p.mes === mes && p.dia === dia);
        })
        .map((m) => {
          const { mes, dia } = monthDayFromDateString(m.data_nascimento as string);
          return {
            key: m.id,
            nome: m.nome,
            telefone: m.telefone,
            fotoUrl: m.profiles?.foto_url || null,
            mes,
            dia,
          };
        })
        .sort((a, b) => {
          const idxA = pairs.findIndex((p) => p.mes === a.mes && p.dia === a.dia);
          const idxB = pairs.findIndex((p) => p.mes === b.mes && p.dia === b.dia);
          return idxA - idxB;
        });

      setAniversariantes(semana);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes da semana:', error);
    } finally {
      setLoading(false);
    }
  };

  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 0 });
  const fimSemana = endOfWeek(new Date(), { weekStartsOn: 0 });
  const periodo = `${format(inicioSemana, 'dd/MM')} a ${format(fimSemana, 'dd/MM')}`;
  const hoje = new Date();

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-card">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cake className="w-5 h-5 text-primary" />
          Aniversariantes da Semana
        </CardTitle>
        <p className="text-sm text-stone-500">{periodo}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {aniversariantes.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title="Nenhum aniversariante esta semana"
            description="Volte na próxima semana para conferir quem está de aniversário."
          />
        ) : (
          aniversariantes.map((pessoa) => {
            const isHoje = pessoa.mes === hoje.getMonth() + 1 && pessoa.dia === hoje.getDate();
            const primeiroNome = pessoa.nome.split(' ')[0];
            const mensagem = `Feliz aniversário, ${primeiroNome}! 🎉 Que Deus te abençoe muito!`;

            return (
              <div
                key={pessoa.key}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  isHoje ? 'border-promessa-400 bg-promessa-50' : 'border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={pessoa.fotoUrl ?? undefined} alt={pessoa.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(pessoa.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900 truncate">{pessoa.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{String(pessoa.dia).padStart(2, '0')}/{String(pessoa.mes).padStart(2, '0')}</span>
                      {isHoje && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-promessa-500 text-white">Hoje! 🎉</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {hasValidPhone(pessoa.telefone) ? (
                  <a href={getWhatsAppUrl(pessoa.telefone, mensagem)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-0 text-green-600 border-green-300 hover:bg-green-50">
                      <MessageCircle className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Mensagem</span>
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-stone-400 shrink-0">sem telefone</span>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default AniversariantesDaSemanaCard;
