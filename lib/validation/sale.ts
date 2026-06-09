import { z } from "zod";
import { SaleStatus } from "@prisma/client";

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
  z.number({ invalid_type_error: "Informe um valor válido." }).positive("Valor deve ser maior que zero.").max(9_999_999.99),
);

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const saleCreateSchema = z.object({
  patientId: z.string().min(1, "Selecione o paciente."),
  appointmentId: z.preprocess(emptyToNull, z.string().min(1).nullable().optional()),
  valor: moneyReaisSchema,
  produto: z.string().trim().min(1, "Informe o produto.").max(500),
  formaPagamento: z.string().trim().min(1, "Informe a forma de pagamento.").max(100),
  status: z.nativeEnum(SaleStatus).default(SaleStatus.ORCAMENTO),
  notes: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
});

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "boleto", label: "Boleto" },
  { value: "crediario", label: "Crediário" },
] as const;
