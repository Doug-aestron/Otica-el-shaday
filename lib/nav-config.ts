import type { AppPermission } from "@/lib/permissions";

export type PainelNavItem = {
  href: string;
  label: string;
  permission: AppPermission;
};

export const painelNavItems: PainelNavItem[] = [
  { href: "/painel", label: "Início", permission: "painel.dashboard" },
  { href: "/painel/pacientes", label: "Pacientes", permission: "painel.pacientes" },
  { href: "/painel/agenda", label: "Agenda", permission: "painel.agenda" },
  { href: "/painel/atendimento", label: "Atendimento", permission: "painel.atendimento" },
  { href: "/painel/receitas", label: "Receitas", permission: "painel.receitas" },
  { href: "/painel/vendas", label: "Vendas", permission: "painel.vendas" },
  { href: "/painel/auditoria", label: "Auditoria", permission: "painel.auditoria" },
  { href: "/painel/financeiro", label: "Financeiro", permission: "painel.financeiro" },
  { href: "/painel/configuracoes", label: "Configurações", permission: "painel.configuracoes" },
];
