import { Role } from "@prisma/client";

export function canCreateSale(role: Role): boolean {
  return role === Role.VENDEDOR || role === Role.ADMIN || role === Role.RECEPCAO;
}
