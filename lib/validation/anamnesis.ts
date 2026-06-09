import { z } from "zod";

export const anamnesisCreateSchema = z.object({
  patientId: z.string().cuid("Paciente inválido."),
  chiefComplaint: z.string().max(2000).optional().nullable(),
  usesGlasses: z.boolean().optional().default(false),
  usesContactLens: z.boolean().optional().default(false),
  headache: z.boolean().optional().default(false),
  blurredVision: z.boolean().optional().default(false),
  difficultyNear: z.boolean().optional().default(false),
  difficultyFar: z.boolean().optional().default(false),
  diabetes: z.boolean().optional().default(false),
  hypertension: z.boolean().optional().default(false),
  allergies: z.string().max(2000).optional().nullable(),
  medications: z.string().max(2000).optional().nullable(),
  ocularSurgery: z.string().max(2000).optional().nullable(),
  familyHistory: z.string().max(2000).optional().nullable(),
  observations: z.string().max(4000).optional().nullable(),
  lgpdConsent: z.boolean().refine((v) => v === true, {
    message: "É necessário aceitar o consentimento LGPD.",
  }),
});

export type AnamnesisCreateInput = z.infer<typeof anamnesisCreateSchema>;

export const anamnesisFormSchema = anamnesisCreateSchema.omit({ patientId: true });
export type AnamnesisFormInput = z.infer<typeof anamnesisFormSchema>;

