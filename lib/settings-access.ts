import { Role } from "@prisma/client";

export function canManageSettings(role: Role): boolean {
  return role === Role.ADMIN;
}
