/** Valores do enum Prisma `CostType` — use no cliente sem depender de `@prisma/client`. */
export const COST_TYPE = {
  FIXO: "FIXO",
  VARIAVEL: "VARIAVEL",
} as const;

export type CostTypeValue = (typeof COST_TYPE)[keyof typeof COST_TYPE];

export function isCostTypeValue(v: string): v is CostTypeValue {
  return v === COST_TYPE.FIXO || v === COST_TYPE.VARIAVEL;
}

export function costTypeLabel(type: CostTypeValue): string {
  return type === COST_TYPE.FIXO ? "Fixo" : "Variável";
}
