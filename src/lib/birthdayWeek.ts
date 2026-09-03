import { addDays, startOfWeek } from 'date-fns';

/**
 * Retorna os 7 pares {mes, dia} (1-indexado) da semana atual (domingo a
 * sábado). Comparar por mês/dia (não pela data completa) porque
 * data_nascimento tem o ano de nascimento, não o ano corrente — e usar uma
 * lista de dias em vez de aritmética de dia-do-ano evita bugs de virada de
 * ano/mês quando a semana atravessa dezembro/janeiro.
 */
export function getCurrentWeekMonthDayPairs(reference: Date = new Date()): { mes: number; dia: number }[] {
  const start = startOfWeek(reference, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { mes: d.getMonth() + 1, dia: d.getDate() };
  });
}

/** Extrai {mes, dia} de uma data 'YYYY-MM-DD' sem problema de fuso horário. */
export function monthDayFromDateString(dateStr: string): { mes: number; dia: number } {
  const d = new Date(`${dateStr}T12:00:00`);
  return { mes: d.getMonth() + 1, dia: d.getDate() };
}

/** True se a data de nascimento (YYYY-MM-DD) cai na semana atual (mês/dia, ignorando o ano). */
export function isBirthdayInCurrentWeek(dataNascimento: string, reference: Date = new Date()): boolean {
  const pairs = getCurrentWeekMonthDayPairs(reference);
  const { mes, dia } = monthDayFromDateString(dataNascimento);
  return pairs.some((p) => p.mes === mes && p.dia === dia);
}
