import { z } from "zod";
import { digitsOnly, normalizeCpfInput } from "@/lib/strings";

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email("E-mail inválido.").optional(),
);

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export const patientCreateSchema = z.object({
  name: z.string().min(2, "Informe o nome completo.").max(200),
  cpf: z
    .string()
    .optional()
    .transform((v) => normalizeCpfInput(v ?? ""))
    .refine((v) => v === null || v.length === 11, {
      message: "CPF deve ter 11 dígitos (ou deixe em branco).",
    }),
  phone: z.preprocess(emptyToNull, z.string().max(40).nullable().optional()),
  email: optionalEmail,
  birthDate: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return new Date(`${v}T12:00:00.000Z`);
      }
      return undefined;
    },
    z.date().optional(),
  ),
  address: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

export const patientSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
});
