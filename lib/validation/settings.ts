import { z } from "zod";
import { Role } from "@prisma/client";
import { parseOpeningHours, validateOpeningHoursData } from "@/lib/opening-hours";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

function validateOpeningHoursField(v: unknown): string | null | undefined {
  if (v === "" || v === undefined) return null;
  if (typeof v !== "string") return v as null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("{")) {
    return trimmed.length <= 500 ? trimmed : null;
  }
  const { data } = parseOpeningHours(trimmed);
  const err = validateOpeningHoursData(data);
  if (err) return undefined;
  return trimmed.length <= 500 ? trimmed : undefined;
}

export const systemSettingsUpdateSchema = z.object({
  clinicName: z.string().trim().min(2, "Informe o nome da clínica.").max(200),
  clinicPhone: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  clinicEmail: z.preprocess(
    emptyToNull,
    z.string().trim().email("E-mail inválido.").max(200).nullable().optional(),
  ),
  clinicAddress: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
  openingHours: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .superRefine((val, ctx) => {
        if (val == null || val === "") return;
        const checked = validateOpeningHoursField(val);
        if (checked === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Horário de funcionamento inválido." });
        }
      }),
  ),
  appointmentMinutes: z.coerce.number().int().min(15).max(180),
  siteWelcomeMessage: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable().optional()),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(200),
  password: z.string().min(6, "Senha com no mínimo 6 caracteres.").max(128),
  role: z.nativeEnum(Role),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(128).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z.string().min(6, "Nova senha com no mínimo 6 caracteres.").max(128),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
