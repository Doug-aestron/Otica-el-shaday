import { AppointmentStatus } from "@prisma/client";

/** Fila de atendimento (painel atendimento). */
export const QUEUE_STATUS_FILTER = [
  AppointmentStatus.AGUARDANDO,
  AppointmentStatus.EM_ATENDIMENTO,
  AppointmentStatus.FINALIZADO,
  AppointmentStatus.CANCELADO,
].join(",");

/** Agenda operacional (painel agenda). */
export const AGENDA_STATUS_FILTER = [
  AppointmentStatus.PENDENTE,
  AppointmentStatus.CONFIRMADO,
  AppointmentStatus.REALIZADO,
  AppointmentStatus.AGUARDANDO,
  AppointmentStatus.EM_ATENDIMENTO,
  AppointmentStatus.FINALIZADO,
  AppointmentStatus.CANCELADO,
].join(",");

export function appointmentsListUrl(statusFilter: string, view?: "agenda" | "queue") {
  const url = new URL("/api/appointments", window.location.origin);
  url.searchParams.set("status", statusFilter);
  if (view) url.searchParams.set("view", view);
  return url.toString();
}
