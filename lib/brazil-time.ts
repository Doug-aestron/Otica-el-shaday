/** Fuso de Brasília (sem horário de verão desde 2019). */
const TZ = "America/Sao_Paulo";

type DateParts = { year: number; month: number; day: number };

export function brazilDateParts(date = new Date()): DateParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: n("year"), month: n("month"), day: n("day") };
}

/** Início do dia civil em Brasília (00:00), como Date UTC. */
export function brazilDayStart(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 3, 0, 0, 0));
}

/** Início do dia seguinte em Brasília (limite superior exclusivo). */
export function brazilDayEnd(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1, 3, 0, 0, 0));
}

/** Início do mês civil em Brasília. */
export function brazilMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 3, 0, 0, 0));
}

/** Início do mês seguinte em Brasília (limite superior exclusivo). */
export function brazilMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 3, 0, 0, 0));
}

export function brazilMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: TZ }).format(d);
}
