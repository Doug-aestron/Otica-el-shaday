import { Role } from "@prisma/client";

/** Admin e recepção: criar, editar e excluir pacientes. */
export function canMutatePatient(role: Role): boolean {
  return role === Role.ADMIN || role === Role.RECEPCAO;
}

/** Recepção e administração registram anamnese. */
export function canCreateAnamnesis(role: Role): boolean {
  return role === Role.RECEPCAO || role === Role.ADMIN;
}
