import { z } from "zod";
import { COST_TYPE } from "@/lib/cost-type";

function parseMoneyToReais(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const normalized = v.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

const moneyReaisSchema = z.preprocess(
  parseMoneyToReais,
  z.number({ invalid_type_error: "Informe um valor válido." }).positive("Valor deve ser maior que zero.").max(99_999_999.99),
);

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const financeCostFields = {
  description: z.string().trim().min(2, "Informe a descrição.").max(300),
  valor: moneyReaisSchema,
  type: z.enum([COST_TYPE.FIXO, COST_TYPE.VARIAVEL]),
  category: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
  referenceAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de referência inválida."),
  notes: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
};

export const financeCostCreateSchema = z.object(financeCostFields);

export const financeCostUpdateSchema = z.object(financeCostFields);

export const financePeriodQuerySchema = z.object({
  from: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inicial inválida."),
  to: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida."),
});

export const COST_CATEGORIES = [
  "Infraestrutura",
  "Pessoal",
  "Marketing",
  "Impostos",
  "Materiais",
  "Tecnologia",
  "Outros",
] as const;
