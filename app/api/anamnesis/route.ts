import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { anamnesisCreateSchema } from "@/lib/validation/anamnesis";
import { canCreateAnamnesis } from "@/lib/patient-access";

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  if (!canCreateAnamnesis(gate.session.user.role)) {
    return NextResponse.json({ error: "Apenas recepção ou administração podem registrar anamnese." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = anamnesisCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const patient = await prisma.patient.findUnique({ where: { id: d.patientId }, select: { id: true } });
  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const anamnesis = await prisma.anamnesis.create({
    data: {
      patientId: d.patientId,
      chiefComplaint: d.chiefComplaint?.trim() || null,
      usesGlasses: d.usesGlasses ?? false,
      usesContactLens: d.usesContactLens ?? false,
      headache: d.headache ?? false,
      blurredVision: d.blurredVision ?? false,
      difficultyNear: d.difficultyNear ?? false,
      difficultyFar: d.difficultyFar ?? false,
      diabetes: d.diabetes ?? false,
      hypertension: d.hypertension ?? false,
      allergies: d.allergies?.trim() || null,
      medications: d.medications?.trim() || null,
      ocularSurgery: d.ocularSurgery?.trim() || null,
      familyHistory: d.familyHistory?.trim() || null,
      observations: d.observations?.trim() || null,
      lgpdConsent: d.lgpdConsent,
      createdById: gate.session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ anamnesis }, { status: 201 });
}
