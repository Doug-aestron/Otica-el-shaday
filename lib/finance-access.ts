import { Role } from "@prisma/client";

/** Módulo financeiro exclusivo da administração. */
export function canAccessFinance(role: Role): boolean {
  return role === Role.ADMIN;
}
