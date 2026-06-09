import type { AppointmentRow } from "@/lib/appointment-types";
import { AppointmentStatus } from "@prisma/client";

const STATUS_ORDER: Record<AppointmentStatus, number> = {
  [AppointmentStatus.PENDENTE]: 99,
  [AppointmentStatus.CONFIRMADO]: 99,
  [AppointmentStatus.REALIZADO]: 99,
  [AppointmentStatus.AGUARDANDO]: 0,
  [AppointmentStatus.EM_ATENDIMENTO]: 1,
  [AppointmentStatus.FINALIZADO]: 2,
  [AppointmentStatus.CANCELADO]: 3,
};

export function sortAppointmentRows(rows: AppointmentRow[]): AppointmentRow[] {
  return [...rows].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export function upsertAppointmentRow(list: AppointmentRow[] | null, updated: AppointmentRow): AppointmentRow[] {
  const base = list ?? [];
  const idx = base.findIndex((a) => a.id === updated.id);
  const next = idx >= 0 ? base.map((a, i) => (i === idx ? { ...a, ...updated } : a)) : [...base, updated];
  return sortAppointmentRows(next);
}
