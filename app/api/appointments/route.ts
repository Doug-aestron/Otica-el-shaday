import { NextResponse } from "next/server";
import { Prisma, AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAnyPermissionApi, requirePermissionApi } from "@/lib/api-auth";
import { appointmentCreateSchema } from "@/lib/validation/appointment";
import { canCreateAppointment } from "@/lib/appointment-access";
import { AuditAction, writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const gate = await requireAnyPermissionApi(["painel.agenda", "painel.atendimento"]);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const view = searchParams.get("view");
  const where: Prisma.AppointmentWhereInput = {};
  let statusFilter: AppointmentStatus[] = [];

  if (rawStatus && rawStatus.trim().length > 0) {
    const parts = rawStatus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as string[];
    statusFilter = parts.filter((p): p is AppointmentStatus =>
      Object.values(AppointmentStatus).includes(p as AppointmentStatus),
    );
    if (statusFilter.length > 0) {
      where.status = { in: statusFilter };
    }
  }

  const agendaView = view === "agenda";
  const includeClinical =
    !agendaView &&
    (statusFilter.length === 0 ||
      statusFilter.some(
        (s) => s === AppointmentStatus.EM_ATENDIMENTO || s === AppointmentStatus.FINALIZADO,
      ));

  const appointments = await prisma.appointment.findMany({
    where,
    take: statusFilter.length > 0 ? 80 : 120,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      doctorId: true,
      consultationStartedAt: true,
      consultationEndedAt: true,
      reason: true,
      notes: true,
      patient: { select: { id: true, name: true, phone: true, cpf: true } },
      doctor: { select: { id: true, name: true } },
      ...(includeClinical
        ? {
            medicalRecord: {
              select: {
                id: true,
                diagnosis: true,
                clinicalNotes: true,
                conduct: true,
                followUpAt: true,
              },
            },
          }
        : {}),
    },
  });

  const res = NextResponse.json({ appointments });
  res.headers.set("Cache-Control", "private, no-cache, max-age=0, must-revalidate");
  return res;
}

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.atendimento");
  if (!gate.ok) return gate.response;

  if (!canCreateAppointment(gate.session.user.role)) {
    return NextResponse.json(
      { error: "Apenas recepção ou administração podem colocar o paciente na fila (aguardando)." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = appointmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { patientId, reason, notes } = parsed.data;
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, name: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      status: AppointmentStatus.AGUARDANDO,
      reason: reason?.trim() || null,
      notes: notes?.trim() || null,
    },
    include: {
      patient: { select: { id: true, name: true, phone: true, cpf: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  await writeAuditLog({
    userId: gate.session.user.id,
    action: AuditAction.APPOINTMENT_CREATED,
    entity: "Appointment",
    entityId: appointment.id,
    metadata: {
      patientName: patient.name,
      status: appointment.status,
    },
    req,
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
