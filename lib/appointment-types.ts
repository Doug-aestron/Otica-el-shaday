import type { AppointmentStatus } from "@prisma/client";

type PatientMini = { id: string; name: string; phone: string | null; cpf: string | null };

type MedicalSnapshot = {
  id: string;
  diagnosis: string | null;
  clinicalNotes: string | null;
  conduct: string | null;
  followUpAt: Date | string | null;
} | null;

export type AppointmentRow = {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  doctorId: string | null;
  consultationStartedAt: string | null;
  consultationEndedAt: string | null;
  reason: string | null;
  notes: string | null;
  patient: PatientMini;
  doctor: { id: string; name: string } | null;
  medicalRecord?: MedicalSnapshot | null;
};
