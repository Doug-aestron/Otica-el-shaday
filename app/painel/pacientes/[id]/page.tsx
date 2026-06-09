import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guards";
import { auth } from "@/auth";
import { canCreateAnamnesis, canMutatePatient } from "@/lib/patient-access";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import {
  PatientDetailShell,
  type AnamnesisRowModel,
  type PatientDetailModel,
} from "@/components/patients/patient-detail-shell";

type Props = { params: Promise<{ id: string }> };

export default async function PacienteDetalhePage({ params }: Props) {
  await requirePermission("painel.pacientes");

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      anamneses: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  if (!patient) notFound();

  const session = await auth();
  if (!session?.user) notFound();

  const canMutate = canMutatePatient(session.user.role);
  const canAnam = canCreateAnamnesis(session.user.role);

  const patientModel: PatientDetailModel = {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    phone: patient.phone,
    email: patient.email,
    birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
    address: patient.address,
    notes: patient.notes,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };

  const anamnesesModel: AnamnesisRowModel[] = patient.anamneses.map((a) => ({
    id: a.id,
    chiefComplaint: a.chiefComplaint,
    usesGlasses: a.usesGlasses,
    usesContactLens: a.usesContactLens,
    headache: a.headache,
    blurredVision: a.blurredVision,
    difficultyNear: a.difficultyNear,
    difficultyFar: a.difficultyFar,
    diabetes: a.diabetes,
    hypertension: a.hypertension,
    allergies: a.allergies,
    medications: a.medications,
    ocularSurgery: a.ocularSurgery,
    familyHistory: a.familyHistory,
    observations: a.observations,
    lgpdConsent: a.lgpdConsent,
    createdAt: a.createdAt.toISOString(),
    createdBy: a.createdBy ? { name: a.createdBy.name } : null,
  }));

  return (
    <div>
      <PainelPageHeader title={patient.name} subtitle="Ficha do paciente e histórico de anamneses." />
      <PatientDetailShell
        patient={patientModel}
        anamneses={anamnesesModel}
        canMutatePatient={canMutate}
        canCreateAnamnesis={canAnam}
      />
    </div>
  );
}
