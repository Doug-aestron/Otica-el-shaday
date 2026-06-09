import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { patientCreateSchema, patientSearchQuerySchema } from "@/lib/validation/patient";
import { canMutatePatient } from "@/lib/patient-access";
import { digitsOnly } from "@/lib/strings";
import { Prisma } from "@prisma/client";
import { AuditAction, writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const parsed = patientSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const q = parsed.data.q?.trim() ?? "";
  const where: Prisma.PatientWhereInput =
    q.length > 0
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { cpf: { contains: digitsOnly(q) } },
            { phone: { contains: q } },
            ...(digitsOnly(q).length > 0 ? [{ phone: { contains: digitsOnly(q) } }] : []),
          ],
        }
      : {};

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { name: "asc" },
    take: q.length > 0 ? 50 : 0,
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      email: true,
      birthDate: true,
      createdAt: true,
      _count: { select: { anamneses: true } },
    },
  });

  return NextResponse.json({ patients });
}

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  if (!canMutatePatient(gate.session.user.role)) {
    return NextResponse.json({ error: "Apenas recepção ou administração podem cadastrar pacientes." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = patientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        name: data.name.trim(),
        cpf: data.cpf,
        phone: data.phone ?? null,
        email: data.email ?? null,
        birthDate: data.birthDate ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
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
        createdAt: true,
      },
    });

    await writeAuditLog({
      userId: gate.session.user.id,
      action: AuditAction.PATIENT_CREATED,
      entity: "Patient",
      entityId: patient.id,
      metadata: { patientName: patient.name },
      req,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe paciente com este CPF." }, { status: 409 });
    }
    throw e;
  }
}
