import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { patientUpdateSchema } from "@/lib/validation/patient";
import { canMutatePatient } from "@/lib/patient-access";
import { Prisma } from "@prisma/client";
import { AuditAction, writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      _count: { select: { anamneses: true } },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  if (!canMutatePatient(gate.session.user.role)) {
    return NextResponse.json({ error: "Apenas recepção ou administração podem editar pacientes." }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = patientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 422 });
  }

  const exists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email ?? null }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate ?? null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        email: true,
        birthDate: true,
        address: true,
        notes: true,
        updatedAt: true,
      },
    });

    await writeAuditLog({
      userId: gate.session.user.id,
      action: AuditAction.PATIENT_UPDATED,
      entity: "Patient",
      entityId: patient.id,
      metadata: {
        patientName: patient.name,
        fields: Object.keys(data).join(", "),
      },
      req,
    });

    return NextResponse.json({ patient });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe paciente com este CPF." }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  if (!canMutatePatient(gate.session.user.role)) {
    return NextResponse.json({ error: "Apenas recepção ou administração podem excluir pacientes." }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.patient.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
