import type { Role } from "@prisma/client";

export function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Administração",
    RECEPCAO: "Recepção",
    MEDICO: "Médico",
    VENDEDOR: "Vendedor",
  };
  return labels[role];
}
