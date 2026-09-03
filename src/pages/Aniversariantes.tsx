import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, MessageCircle, PartyPopper } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getCurrentWeekMonthDayPairs, monthDayFromDateString } from '@/lib/birthdayWeek';
import { getWhatsAppUrl, hasValidPhone } from '@/lib/formatters';

interface MembroAniversario {
  id: string;
  nome: string;
  data_nascimento: string;
  telefone: string | null;
}

/** Painel pastoral de aniversariantes da semana — acessível pelo admin e pelo
 * líder. Complementa AniversariantesDoMes (mensal, individual, na home do
 * membro) com uma visão semanal orientada a ação (WhatsApp direto). */
export default function Aniversariantes() {
  const { churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const [membros, setMembros] = useState<MembroAniversario[]>([]);
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
        .select('id, nome, data_nascimento, telefone')
        .eq('church_id', churchId as string)
        .in('status', ['ativo', 'frequentador'])
        .not('data_nascimento', 'is', null);

      if (error) throw error;

      const pairs = getCurrentWeekMonthDayPairs();
      const semana = ((data || []) as MembroAniversario[])
        .filter((m) => {
          const { mes, dia } = monthDayFromDateString(m.data_nascimento);
          return pairs.some((p) => p.mes === mes && p.dia === dia);
        })
        .sort((a, b) => {
          const da = monthDayFromDateString(a.data_nascimento);
          const db = monthDayFromDateString(b.data_nascimento);
          const idxA = pairs.findIndex((p) => p.mes === da.mes && p.dia === da.dia);
          const idxB = pairs.findIndex((p) => p.mes === db.mes && p.dia === db.dia);
          return idxA - idxB;
        });

      setMembros(semana);
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

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Cake className="w-6 h-6 text-primary" />
          Aniversariantes da Semana
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{periodo}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : membros.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum aniversariante esta semana.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {membros.map((m) => {
            const { mes, dia } = monthDayFromDateString(m.data_nascimento);
            const isHoje = mes === hoje.getMonth() + 1 && dia === hoje.getDate();
            const primeiroNome = m.nome.split(' ')[0];
            const msg = `Feliz aniversário, ${primeiroNome}! 🎉 Que Deus te abençoe muito!`;

            return (
              <Card key={m.id} className={isHoje ? 'border-promessa-400 bg-promessa-50' : ''}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">
                      {primeiroNome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{m.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{String(dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}</span>
                        {isHoje && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-promessa-500 text-white">Hoje! 🎉</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {hasValidPhone(m.telefone) ? (
                    <a href={getWhatsAppUrl(m.telefone, msg)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 shrink-0">sem telefone</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
