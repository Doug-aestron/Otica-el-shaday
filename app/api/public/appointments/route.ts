import { NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSiteUnderDevelopment } from "@/lib/site-mode";
import { publicAppointmentSchema } from "@/lib/validation/appointment";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function parseStartEnds(data: string, horario: string): { startsAt: Date; endsAt: Date } {
  const [y, m, d] = data.split("-").map(Number);
  const [hh, mm] = horario.split(":").map(Number);
  if (
    [y, m, d, hh, mm].some((n) => Number.isNaN(n)) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59
  ) {
    throw new Error("invalid");
  }
  const startsAt = new Date(y, m - 1, d, hh, mm, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
  return { startsAt, endsAt };
}

export async function POST(req: Request) {
  if (isSiteUnderDevelopment()) {
    return NextResponse.json({ error: "Site em desenvolvimento." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = publicAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { nome, telefone, data, horario, motivo } = parsed.data;
  let startsAt: Date;
  let endsAt: Date;
  try {
    const t = parseStartEnds(data, horario);
    startsAt = t.startsAt;
    endsAt = t.endsAt;
  } catch {
    return NextResponse.json({ error: "Data ou horário inválidos." }, { status: 422 });
  }

  const digits = digitsOnly(telefone);
  const phoneTrim = telefone.trim();

  let patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { phone: phoneTrim },
        ...(digits.length >= 9 ? [{ phone: { contains: digits.slice(-9) } }] : []),
      ],
    },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        name: nome.trim(),
        phone: phoneTrim || digits || null,
      },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      status: AppointmentStatus.PENDENTE,
      startsAt,
      endsAt,
      reason: motivo?.trim() || null,
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
    },
  });

  return NextResponse.json(
    {
      message: "Pedido registrado. A recepção entrará em contato para confirmar.",
      appointment,
    },
    { status: 201 },
  );
}
