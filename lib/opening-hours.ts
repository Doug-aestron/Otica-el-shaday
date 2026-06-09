/** 0 = domingo … 6 = sábado (convenção JavaScript). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DayHours = {
  day: Weekday;
  open: string;
  close: string;
};

export type OpeningHoursData = {
  v: 1;
  days: DayHours[];
};

export const WEEKDAY_TILES: { day: Weekday; short: string; label: string }[] = [
  { day: 1, short: "SEG", label: "Segunda-feira" },
  { day: 2, short: "TER", label: "Terça-feira" },
  { day: 3, short: "QUA", label: "Quarta-feira" },
  { day: 4, short: "QUI", label: "Quinta-feira" },
  { day: 5, short: "SEX", label: "Sexta-feira" },
  { day: 6, short: "SÁB", label: "Sábado" },
  { day: 0, short: "DOM", label: "Domingo" },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DEFAULT_OPEN = "08:00";
export const DEFAULT_CLOSE = "18:00";

export function emptyOpeningHours(): OpeningHoursData {
  return { v: 1, days: [] };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function isValidDayHours(d: DayHours): boolean {
  return TIME_RE.test(d.open) && TIME_RE.test(d.close) && timeToMinutes(d.close) > timeToMinutes(d.open);
}

function normalizeDays(raw: unknown): DayHours[] {
  if (!Array.isArray(raw)) return [];
  const out: DayHours[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const day = Number((item as DayHours).day);
    const open = String((item as DayHours).open ?? "");
    const close = String((item as DayHours).close ?? "");
    if (day < 0 || day > 6 || !TIME_RE.test(open) || !TIME_RE.test(close)) continue;
    const entry: DayHours = { day: day as Weekday, open, close };
    if (!isValidDayHours(entry)) continue;
    if (out.some((x) => x.day === entry.day)) continue;
    out.push(entry);
  }
  return out.sort((a, b) => {
    const order = (d: Weekday) => (d === 0 ? 7 : d);
    return order(a.day) - order(b.day);
  });
}

/** Converte texto antigo (seed) em grade semanal quando possível. */
function migrateLegacyText(text: string): OpeningHoursData | null {
  const lower = text.toLowerCase();
  const timeMatch = text.match(/(\d{1,2})\s*h?\s*(?:às|as|–|-|a)\s*(\d{1,2})\s*h?/i);
  const open = timeMatch ? `${timeMatch[1].padStart(2, "0")}:00` : DEFAULT_OPEN;
  const close = timeMatch ? `${timeMatch[2].padStart(2, "0")}:00` : DEFAULT_CLOSE;
  if (!isValidDayHours({ day: 1, open, close })) return null;

  const days: Weekday[] = [];
  if (/segunda/.test(lower) && /sexta/.test(lower)) {
    days.push(1, 2, 3, 4, 5);
  }
  if (/s[aá]bado/.test(lower)) days.push(6);
  if (/domingo/.test(lower)) days.push(0);
  if (!days.length) return null;

  return {
    v: 1,
    days: days.map((day) => ({ day, open, close })),
  };
}

export type ParseOpeningHoursResult = {
  data: OpeningHoursData;
  /** Texto livre anterior, quando não era JSON. */
  legacyText: string | null;
};

export function parseOpeningHours(raw: string | null | undefined): ParseOpeningHoursResult {
  if (!raw?.trim()) {
    return { data: emptyOpeningHours(), legacyText: null };
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { v?: number; days?: unknown };
      if (parsed?.v === 1) {
        return { data: { v: 1, days: normalizeDays(parsed.days) }, legacyText: null };
      }
    } catch {
      /* texto legado abaixo */
    }
  }

  const migrated = migrateLegacyText(trimmed);
  if (migrated) {
    return { data: migrated, legacyText: null };
  }

  return { data: emptyOpeningHours(), legacyText: trimmed };
}

export function serializeOpeningHours(data: OpeningHoursData): string | null {
  if (!data.days.length) return null;
  const days = normalizeDays(data.days);
  if (!days.length) return null;
  return JSON.stringify({ v: 1, days } satisfies OpeningHoursData);
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":");
  return m === "00" ? `${Number(h)}h` : `${h}h${m}`;
}

/** Texto legível para preview (site / painel). */
export function formatOpeningHoursDisplay(raw: string | null | undefined): string {
  const { data, legacyText } = parseOpeningHours(raw);
  if (data.days.length) {
    const parts = data.days.map((d) => {
      const label = WEEKDAY_TILES.find((t) => t.day === d.day)?.label ?? String(d.day);
      return `${label}: ${formatTimeLabel(d.open)} – ${formatTimeLabel(d.close)}`;
    });
    return parts.join(" · ");
  }
  return legacyText ?? "";
}

export function toggleDay(data: OpeningHoursData, day: Weekday): OpeningHoursData {
  const exists = data.days.find((d) => d.day === day);
  if (exists) {
    return { v: 1, days: data.days.filter((d) => d.day !== day) };
  }
  const template = data.days[data.days.length - 1];
  return {
    v: 1,
    days: [
      ...data.days,
      {
        day,
        open: template?.open ?? DEFAULT_OPEN,
        close: template?.close ?? DEFAULT_CLOSE,
      },
    ].sort((a, b) => {
      const order = (d: Weekday) => (d === 0 ? 7 : d);
      return order(a.day) - order(b.day);
    }),
  };
}

export function updateDayHours(
  data: OpeningHoursData,
  day: Weekday,
  patch: Partial<Pick<DayHours, "open" | "close">>,
): OpeningHoursData {
  return {
    v: 1,
    days: data.days.map((d) => (d.day === day ? { ...d, ...patch } : d)),
  };
}

export function applyHoursToAll(data: OpeningHoursData, open: string, close: string): OpeningHoursData {
  return {
    v: 1,
    days: data.days.map((d) => ({ ...d, open, close })),
  };
}

export function validateOpeningHoursData(data: OpeningHoursData): string | null {
  if (!data.days.length) return null;
  for (const d of data.days) {
    if (!isValidDayHours(d)) {
      const label = WEEKDAY_TILES.find((t) => t.day === d.day)?.label ?? "Dia";
      return `${label}: o horário de fechamento deve ser depois da abertura.`;
    }
  }
  return null;
}
