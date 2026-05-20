import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MembroAniversario {
  id: string;
  nome: string;
  data_nascimento: string;
  foto_perfil: string | null;
  telefone: string | null;
}

export default function AniversariantesDoMes() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const today = now.getDate();

  const { data: aniversariantes = [] } = useQuery({
    queryKey: ['aniversariantes-mes', currentMonth],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('membros')
        .select('id, nome, data_nascimento, foto_perfil, telefone')
        .in('status', ['ativo', 'frequentador'])
        .not('data_nascimento', 'is', null);
      if (!data) return [];
      return (data as MembroAniversario[])
        .filter(m => new Date(m.data_nascimento + 'T12:00:00').getMonth() + 1 === currentMonth)
        .sort((a, b) =>
          new Date(a.data_nascimento + 'T12:00:00').getDate() -
          new Date(b.data_nascimento + 'T12:00:00').getDate()
        );
    },
    staleTime: 1000 * 60 * 60,
  });

  if (aniversariantes.length === 0) return null;

  const monthName = format(new Date(now.getFullYear(), currentMonth - 1, 1), 'MMMM', { locale: ptBR });
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          🎂 Aniversariantes de {monthLabel}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {aniversariantes.map(m => {
            const dia = new Date(m.data_nascimento + 'T12:00:00').getDate();
            const isHoje = dia === today;
            const primeiroNome = m.nome.split(' ')[0];
            const inicial = primeiroNome.charAt(0).toUpperCase();
            const tel = m.telefone?.replace(/\D/g, '') ?? '';
            const msgWpp = encodeURIComponent(`Feliz aniversário, ${primeiroNome}! 🎉 Que Deus te abençoe muito!`);
            const wppUrl = tel.length >= 10 ? `https://wa.me/55${tel}?text=${msgWpp}` : null;

            return (
              <div
                key={m.id}
                className={`flex-shrink-0 w-28 flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  isHoje
                    ? 'border-promessa-400 bg-promessa-50 shadow-md'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 ${
                  isHoje ? 'border-promessa-400' : 'border-border'
                }`}>
                  {m.foto_perfil ? (
                    <img src={m.foto_perfil} alt={primeiroNome} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${
                      isHoje ? 'bg-promessa-100 text-promessa-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {inicial}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground truncate w-full">{primeiroNome}</p>
                {isHoje ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-promessa-500 text-white">Hoje! 🎉</Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Dia {dia}</span>
                )}
                {wppUrl ? (
                  <a
                    href={wppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40" title="Telefone não cadastrado">
                    sem tel.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
