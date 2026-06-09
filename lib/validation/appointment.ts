import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Paciente inválido."),
  reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const publicAppointmentSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(200),
  telefone: z.string().trim().min(8, "Informe um telefone válido.").max(40),
  data: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  horario: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido (use HH:MM).")
    .transform((s) => s.slice(0, 5)),
  motivo: z.string().max(1000).optional().nullable(),
});

const statusEnum = z.nativeEnum(AppointmentStatus);

const followUpPreprocess = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T12:00:00.000Z`);
  }
  return v;
}, z.date().nullable().optional());

export const appointmentUpdateSchema = z.object({
  status: statusEnum,
  clinicalNotes: z.string().max(4000).optional().nullable(),
  diagnosis: z.string().max(4000).optional().nullable(),
  conduct: z.string().max(4000).optional().nullable(),
  followUpAt: followUpPreprocess,
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
