import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { prescriptionCreateSchema } from "@/lib/validation/prescription";
import { canCreatePrescription } from "@/lib/prescription-access";
import { AuditAction, writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.receitas");
  if (!gate.ok) return gate.response;

  if (!canCreatePrescription(gate.session.user.role)) {
    return NextResponse.json({ error: "Apenas médicos podem emitir receita." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = prescriptionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;

  const patient = await prisma.patient.findUnique({
    where: { id: d.patientId },
    select: { id: true, name: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  if (d.medicalRecordId) {
    const mr = await prisma.medicalRecord.findFirst({
      where: { id: d.medicalRecordId, patientId: d.patientId },
      select: { id: true },
    });
    if (!mr) {
      return NextResponse.json({ error: "Prontuário não encontrado para este paciente." }, { status: 404 });
    }
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId: d.patientId,
      doctorId: gate.session.user.id,
      medicalRecordId: d.medicalRecordId ?? null,
      odSphere: d.odSphere ?? null,
      odCylinder: d.odCylinder ?? null,
      odAxis: d.odAxis ?? null,
      odAddition: d.odAddition ?? null,
      odDnp: d.odDnp ?? null,
      osSphere: d.osSphere ?? null,
      osCylinder: d.osCylinder ?? null,
      osAxis: d.osAxis ?? null,
      osAddition: d.osAddition ?? null,
      osDnp: d.osDnp ?? null,
      lensType: d.lensType ?? null,
      notes: d.notes ?? null,
    },
    include: {
      patient: { select: { id: true, name: true, cpf: true, phone: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  await writeAuditLog({
    userId: gate.session.user.id,
    action: AuditAction.PRESCRIPTION_CREATED,
    entity: "Prescription",
    entityId: prescription.id,
    metadata: { patientName: patient.name },
    req,
  });

  return NextResponse.json({ prescription }, { status: 201 });
}
