import { Role } from "@prisma/client";

export type AppPermission =
  | "painel.dashboard"
  | "painel.pacientes"
  | "painel.agenda"
  | "painel.atendimento"
  | "painel.receitas"
  | "painel.vendas"
  | "painel.auditoria"
  | "painel.financeiro"
  | "painel.configuracoes";

const rolePermissions: Record<Role, AppPermission[]> = {
  ADMIN: [
    "painel.dashboard",
    "painel.pacientes",
    "painel.agenda",
    "painel.atendimento",
    "painel.vendas",
    "painel.auditoria",
    "painel.financeiro",
    "painel.configuracoes",
  ],
  RECEPCAO: [
    "painel.dashboard",
    "painel.pacientes",
    "painel.agenda",
    "painel.atendimento",
    "painel.vendas",
  ],
  MEDICO: [
    "painel.dashboard",
    "painel.pacientes",
    "painel.agenda",
    "painel.atendimento",
    "painel.receitas",
  ],
  VENDEDOR: ["painel.dashboard", "painel.vendas"],
};

export function permissionsForRole(role: Role): AppPermission[] {
  return rolePermissions[role] ?? [];
}

export function roleHasPermission(role: Role, permission: AppPermission): boolean {
  return permissionsForRole(role).includes(permission);
}
