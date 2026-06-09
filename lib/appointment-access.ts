import { AppointmentStatus, Role } from "@prisma/client";

export function canCreateAppointment(role: Role): boolean {
  return role === Role.RECEPCAO || role === Role.ADMIN;
}

/** Iniciar consulta clínica (status EM_ATENDIMENTO) — exclusivo do médico. */
export function canStartAppointment(role: Role): boolean {
  return role === Role.MEDICO;
}

export function canFinalizeAppointment(role: Role): boolean {
  return role === Role.MEDICO;
}

export function canManageAgendaSchedule(role: Role): boolean {
  return role === Role.RECEPCAO || role === Role.ADMIN;
}

/** Prontuário clínico durante a consulta (status EM_ATENDIMENTO). */
export function canEditClinicalNotes(
  role: Role,
  appt: { status: AppointmentStatus; doctorId: string | null },
  userId: string,
): boolean {
  if (role !== Role.MEDICO) return false;
  if (appt.status !== AppointmentStatus.EM_ATENDIMENTO) return false;
  if (!appt.doctorId) return true;
  return appt.doctorId === userId;
}

export function canActAsAssignedDoctor(
  role: Role,
  appt: { status: AppointmentStatus; doctorId: string | null },
  userId: string,
): boolean {
  return (
    canFinalizeAppointment(role) &&
    appt.status === AppointmentStatus.EM_ATENDIMENTO &&
    canEditClinicalNotes(role, appt, userId)
  );
}
