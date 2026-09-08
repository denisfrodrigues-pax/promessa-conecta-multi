import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, Droplets, HeartHandshake, MessageCircle, PartyPopper } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getCurrentWeekMonthDayPairs, monthDayFromDateString } from '@/lib/birthdayWeek';
import { getWhatsAppUrl, hasValidPhone } from '@/lib/formatters';

interface MembroRaw {
  id: string;
  nome: string;
  telefone: string | null;
  data_nascimento: string | null;
  data_batismo_agua: string | null;
  data_casamento: string | null;
  conjuge_id: string | null;
  nome_conjuge: string | null;
}

interface Pessoa {
  nome: string;
  telefone: string | null;
}

interface Item {
  key: string;
  data: string;
  mes: number;
  dia: number;
  pessoas: Pessoa[];
  caption: string;
  mensagem: string;
}

const anosCompletos = (dataStr: string) => new Date().getFullYear() - Number(dataStr.slice(0, 4));

function sortByWeekOrder<T extends { mes: number; dia: number }>(items: T[], pairs: { mes: number; dia: number }[]) {
  return [...items].sort((a, b) => {
    const idxA = pairs.findIndex((p) => p.mes === a.mes && p.dia === a.dia);
    const idxB = pairs.findIndex((p) => p.mes === b.mes && p.dia === b.dia);
    return idxA - idxB;
  });
}

/** Painel pastoral de aniversariantes da semana — acessível pelo admin e pelo
 * líder. Complementa AniversariantesDoMes (mensal, individual, na home do
 * membro) com uma visão semanal orientada a ação (WhatsApp direto).
 *
 * Três categorias, todas construídas a partir de membros: natalício
 * (data_nascimento), batismo nas águas (data_batismo_agua — não data_batismo,
 * campo legado em descontinuação, nem data_batismo_espirito) e casamento
 * (data_casamento). Casamento tenta parear com o cônjuge via conjuge_id
 * (quando ele também é membro cadastrado) pra mostrar o casal numa única
 * linha, sem duplicar — ver montarCasamento().
 */
export default function Aniversariantes() {
  const { churchId: authChurchId } = useAuth();
  const { churchId: slugChurchId } = useIgrejaSlug();
  const churchId = authChurchId ?? slugChurchId ?? null;
  const [nascimento, setNascimento] = useState<Item[]>([]);
  const [batismo, setBatismo] = useState<Item[]>([]);
  const [casamento, setCasamento] = useState<Item[]>([]);
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
        .select('id, nome, telefone, data_nascimento, data_batismo_agua, data_casamento, conjuge_id, nome_conjuge')
        .eq('church_id', churchId as string)
        .in('status', ['ativo', 'frequentador']);

      if (error) throw error;

      const todos = (data || []) as MembroRaw[];
      const pairs = getCurrentWeekMonthDayPairs();
      const naSemana = (dataStr: string) => {
        const { mes, dia } = monthDayFromDateString(dataStr);
        return pairs.some((p) => p.mes === mes && p.dia === dia);
      };

      setNascimento(montarNascimento(todos, pairs, naSemana));
      setBatismo(montarBatismo(todos, pairs, naSemana));
      setCasamento(montarCasamento(todos, pairs, naSemana));
    } catch (error) {
      console.error('Erro ao buscar aniversariantes da semana:', error);
    } finally {
      setLoading(false);
    }
  };

  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 0 });
  const fimSemana = endOfWeek(new Date(), { weekStartsOn: 0 });
  const periodo = `${format(inicioSemana, 'dd/MM')} a ${format(fimSemana, 'dd/MM')}`;
  const totalGeral = nascimento.length + batismo.length + casamento.length;

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
      ) : totalGeral === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum aniversariante esta semana.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Secao titulo="Natalício" icon={<Cake className="w-5 h-5 text-primary" />} itens={nascimento} />
          <Secao titulo="Batismo nas Águas" icon={<Droplets className="w-5 h-5 text-blue-600" />} itens={batismo} />
          <Secao titulo="Casamento" icon={<HeartHandshake className="w-5 h-5 text-pink-600" />} itens={casamento} />
        </>
      )}
    </div>
  );
}

function montarNascimento(
  todos: MembroRaw[],
  pairs: { mes: number; dia: number }[],
  naSemana: (dataStr: string) => boolean,
): Item[] {
  const semana = todos
    .filter((m) => m.data_nascimento && naSemana(m.data_nascimento))
    .map((m) => {
      const { mes, dia } = monthDayFromDateString(m.data_nascimento as string);
      const primeiroNome = m.nome.split(' ')[0];
      return {
        key: m.id,
        data: m.data_nascimento as string,
        mes,
        dia,
        pessoas: [{ nome: m.nome, telefone: m.telefone }],
        caption: '',
        mensagem: `Feliz aniversário, ${primeiroNome}! 🎉 Que Deus te abençoe muito!`,
      };
    });
  return sortByWeekOrder(semana, pairs);
}

function montarBatismo(
  todos: MembroRaw[],
  pairs: { mes: number; dia: number }[],
  naSemana: (dataStr: string) => boolean,
): Item[] {
  const semana = todos
    .filter((m) => m.data_batismo_agua && naSemana(m.data_batismo_agua))
    .map((m) => {
      const { mes, dia } = monthDayFromDateString(m.data_batismo_agua as string);
      const anos = anosCompletos(m.data_batismo_agua as string);
      const primeiroNome = m.nome.split(' ')[0];
      return {
        key: m.id,
        data: m.data_batismo_agua as string,
        mes,
        dia,
        pessoas: [{ nome: m.nome, telefone: m.telefone }],
        caption: `completa ${anos} ${anos === 1 ? 'ano' : 'anos'} de batismo`,
        mensagem: `Parabéns pelos ${anos} ${anos === 1 ? 'ano' : 'anos'} de batismo, ${primeiroNome}! 🎉 Que Deus continue te abençoando!`,
      };
    });
  return sortByWeekOrder(semana, pairs);
}

/**
 * Casamento é pareado via conjuge_id: quando o cônjuge também é membro
 * cadastrado (na mesma igreja), busca no mapa completo de membros — não só
 * nos que caem na semana — porque é comum só um dos dois lados ter
 * data_casamento/conjuge_id preenchido. usedIds evita mostrar o mesmo casal
 * duas vezes (uma por registro) e também evita que o cônjuge apareça de novo
 * como card solo se o próprio registro dele também cair na semana.
 */
function montarCasamento(
  todos: MembroRaw[],
  pairs: { mes: number; dia: number }[],
  naSemana: (dataStr: string) => boolean,
): Item[] {
  const membrosById = new Map(todos.map((m) => [m.id, m]));
  const usedIds = new Set<string>();
  const itens: Item[] = [];

  const semana = todos.filter((m) => m.data_casamento && naSemana(m.data_casamento));

  for (const m of semana) {
    if (usedIds.has(m.id)) continue;
    usedIds.add(m.id);

    const dataCasamento = m.data_casamento as string;
    const { mes, dia } = monthDayFromDateString(dataCasamento);
    const anos = anosCompletos(dataCasamento);
    const anosLabel = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    const conjuge = m.conjuge_id ? membrosById.get(m.conjuge_id) : undefined;

    if (conjuge) {
      usedIds.add(conjuge.id);
      const primeiroA = m.nome.split(' ')[0];
      const primeiroB = conjuge.nome.split(' ')[0];
      itens.push({
        key: [m.id, conjuge.id].sort().join('-'),
        data: dataCasamento,
        mes,
        dia,
        pessoas: [
          { nome: m.nome, telefone: m.telefone },
          { nome: conjuge.nome, telefone: conjuge.telefone },
        ],
        caption: `completam ${anosLabel} de casados`,
        mensagem: `Parabéns pelos ${anosLabel} de casados, ${primeiroA} e ${primeiroB}! 🎉 Que Deus abençoe vocês!`,
      });
    } else {
      const primeiroNome = m.nome.split(' ')[0];
      itens.push({
        key: m.id,
        data: dataCasamento,
        mes,
        dia,
        pessoas: [{ nome: m.nome, telefone: m.telefone }],
        caption: `completa ${anosLabel} de casado(a)`,
        mensagem: `Parabéns pelos ${anosLabel} de casado(a), ${primeiroNome}! 🎉 Que Deus abençoe seu casamento!`,
      });
    }
  }

  return sortByWeekOrder(itens, pairs);
}

function Secao({ titulo, icon, itens }: { titulo: string; icon: React.ReactNode; itens: Item[] }) {
  if (itens.length === 0) return null;

  const hoje = new Date();

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        {icon}
        {titulo}
      </h2>
      {itens.map((item) => {
        const isHoje = item.mes === hoje.getMonth() + 1 && item.dia === hoje.getDate();
        const titulos = item.pessoas.map((p) => p.nome.split(' ')[0]);
        const iniciais = item.pessoas[0].nome.charAt(0).toUpperCase();

        return (
          <Card key={item.key} className={isHoje ? 'border-promessa-400 bg-promessa-50' : ''}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">
                  {iniciais}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.pessoas.map((p) => p.nome).join(' e ')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{String(item.dia).padStart(2, '0')}/{String(item.mes).padStart(2, '0')}</span>
                    {item.caption && <span>· {item.caption}</span>}
                    {isHoje && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-promessa-500 text-white">Hoje! 🎉</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.pessoas.map((pessoa, i) =>
                  hasValidPhone(pessoa.telefone) ? (
                    <a
                      key={i}
                      href={getWhatsAppUrl(pessoa.telefone, item.mensagem)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {item.pessoas.length > 1 ? titulos[i] : 'WhatsApp'}
                      </Button>
                    </a>
                  ) : null,
                )}
                {item.pessoas.every((p) => !hasValidPhone(p.telefone)) && (
                  <span className="text-xs text-muted-foreground/60 shrink-0">sem telefone</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
