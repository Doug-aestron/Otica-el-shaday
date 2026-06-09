/** Duração em segundos entre início e fim da consulta clínica. */
export function consultationDurationSeconds(
  startedAt: Date | string | null | undefined,
  endedAt: Date | string | null | undefined,
): number | null {
  if (!startedAt || !endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 1000);
}

/** Ex.: "32 min", "1 h 05 min", "45 s". */
export function formatConsultationDuration(totalSeconds: number | null): string {
  if (totalSeconds == null || totalSeconds < 1) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return m > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${h} h`;
  }
  if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

export function averageConsultationSeconds(durations: number[]): number | null {
  const valid = durations.filter((d) => d > 0);
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, d) => sum + d, 0) / valid.length);
}
