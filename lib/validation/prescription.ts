import { z } from "zod";

/** Aceita undefined, null, "" e normaliza para undefined antes de validar string. */
function optStr(max: number) {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "string" && v.trim() === "") return undefined;
    return v;
  }, z.string().max(max).optional());
}

const optAxis = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n;
}, z.number().int().min(0).max(180).optional());

/** ID do paciente no banco (ex.: cuid do Prisma). */
const patientIdSchema = z.string().min(1, "Paciente obrigatório.");

export const prescriptionCreateSchema = z.object({
  patientId: patientIdSchema,
  medicalRecordId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().cuid().optional(),
  ),
  odSphere: optStr(30),
  odCylinder: optStr(30),
  odAxis: optAxis,
  odAddition: optStr(20),
  odDnp: optStr(20),
  osSphere: optStr(30),
  osCylinder: optStr(30),
  osAxis: optAxis,
  osAddition: optStr(20),
  osDnp: optStr(20),
  lensType: optStr(200),
  notes: optStr(4000),
});

export type PrescriptionCreateInput = z.infer<typeof prescriptionCreateSchema>;
