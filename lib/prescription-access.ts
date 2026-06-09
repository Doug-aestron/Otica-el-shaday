import { Role } from "@prisma/client";

export function canCreatePrescription(role: Role): boolean {
  return role === Role.MEDICO;
}
