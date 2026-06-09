import { NextResponse } from "next/server";
import { AppointmentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { appointmentUpdateSchema } from "@/lib/validation/appointment";
import {
  canEditClinicalNotes,
  canFinalizeAppointment,
  canManageAgendaSchedule,
  canStartAppointment,
} from "@/lib/appointment-access";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.atendimento");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const payload = parsed.data;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { medicalRecord: true },
  });

  if (!appt) {
    return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 });
  }

  const role = gate.session.user.role;
  const userId = gate.session.user.id;
  const nextStatus = payload.status;
  const scheduleStaff = canManageAgendaSchedule(role);

  const includeReply = {
    patient: { select: { id: true, name: true, phone: true, cpf: true } },
    doctor: { select: { id: true, name: true } },
    medicalRecord: {
      select: {
        id: true,
        diagnosis: true,
        clinicalNotes: true,
        conduct: true,
        followUpAt: true,
      },
    },
  } as const;

  if (nextStatus === AppointmentStatus.CONFIRMADO) {
    if (!scheduleStaff) {
      return NextResponse.json({ error: "Apenas recepção ou administração podem confirmar." }, { status: 403 });
    }
    if (appt.status !== AppointmentStatus.PENDENTE) {
      return NextResponse.json({ error: "Só é possível confirmar um pedido pendente." }, { status: 409 });
    }
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMADO },
      include: includeReply,
    });
    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.REALIZADO) {
    if (!scheduleStaff) {
      return NextResponse.json(
        { error: "Apenas recepção ou administração podem marcar como realizado." },
        { status: 403 },
      );
    }
    if (appt.status !== AppointmentStatus.CONFIRMADO) {
      return NextResponse.json(
        { error: "Só é possível marcar como realizado após confirmação." },
        { status: 409 },
      );
    }
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.REALIZADO },
      include: includeReply,
    });
    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.AGUARDANDO) {
    if (!scheduleStaff) {
      return NextResponse.json(
        { error: "Apenas recepção ou administração podem enviar à fila." },
        { status: 403 },
      );
    }
    if (appt.status !== AppointmentStatus.CONFIRMADO) {
      return NextResponse.json(
        { error: "Converta em atendimento apenas a partir de um agendamento confirmado." },
        { status: 409 },
      );
    }
    const now = new Date();
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.AGUARDANDO,
        startsAt: now,
        endsAt: null,
      },
      include: includeReply,
    });
    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.EM_ATENDIMENTO && appt.status === AppointmentStatus.EM_ATENDIMENTO) {
    if (!canEditClinicalNotes(role, appt, userId)) {
      return NextResponse.json(
        { error: "Apenas o médico responsável pelo atendimento pode preencher o prontuário." },
        { status: 403 },
      );
    }

    const doctorForRecord = appt.doctorId ?? userId;

    const appointment = await prisma.$transaction(async (tx) => {
      if (!appt.doctorId) {
        await tx.appointment.update({
          where: { id },
          data: { doctorId: userId },
        });
      }

      await tx.medicalRecord.upsert({
        where: { appointmentId: id },
        create: {
          patientId: appt.patientId,
          appointmentId: id,
          doctorId: doctorForRecord,
          clinicalNotes: payload.clinicalNotes?.trim() || null,
          diagnosis: payload.diagnosis?.trim() || null,
          conduct: payload.conduct?.trim() || null,
          followUpAt: payload.followUpAt ?? null,
        },
        update: {
          clinicalNotes: payload.clinicalNotes?.trim() ?? null,
          diagnosis: payload.diagnosis?.trim() ?? null,
          conduct: payload.conduct?.trim() ?? null,
          followUpAt: payload.followUpAt ?? null,
          doctorId: doctorForRecord,
        },
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id },
        include: {
          patient: { select: { id: true, name: true, phone: true, cpf: true } },
          doctor: { select: { id: true, name: true } },
          medicalRecord: {
            select: {
              id: true,
              diagnosis: true,
              clinicalNotes: true,
              conduct: true,
              followUpAt: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.EM_ATENDIMENTO) {
    if (!canStartAppointment(role)) {
      return NextResponse.json(
        {
          error:
            "Somente o perfil médico pode iniciar o atendimento clínico do paciente. Recepção e administração devem apenas enviar à fila (aguardando).",
        },
        { status: 403 },
      );
    }
    if (appt.status !== AppointmentStatus.AGUARDANDO) {
      return NextResponse.json(
        { error: "Só é possível iniciar quando o paciente está aguardando." },
        { status: 409 },
      );
    }
    if (appt.doctorId && appt.doctorId !== userId) {
      return NextResponse.json({ error: "Este atendimento já foi assumido por outro médico." }, { status: 409 });
    }

    const consultationStartedAt = new Date();
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.EM_ATENDIMENTO,
        doctorId: userId,
        consultationStartedAt,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true, cpf: true } },
        doctor: { select: { id: true, name: true } },
        medicalRecord: true,
      },
    });

    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.FINALIZADO) {
    if (!canFinalizeAppointment(role)) {
      return NextResponse.json({ error: "Sem permissão para finalizar." }, { status: 403 });
    }
    if (appt.status !== AppointmentStatus.EM_ATENDIMENTO) {
      return NextResponse.json(
        { error: "Só é possível finalizar um atendimento em andamento." },
        { status: 409 },
      );
    }
    if (role === Role.MEDICO && appt.doctorId && appt.doctorId !== userId) {
      return NextResponse.json({ error: "Apenas o médico responsável pode finalizar este atendimento." }, { status: 403 });
    }

    const doctorForRecord = appt.doctorId ?? userId;
    const consultationEndedAt = new Date();

    const appointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.FINALIZADO,
          consultationEndedAt,
          endsAt: consultationEndedAt,
        },
      });

      await tx.medicalRecord.upsert({
        where: { appointmentId: id },
        create: {
          patientId: appt.patientId,
          appointmentId: id,
          doctorId: doctorForRecord,
          clinicalNotes: payload.clinicalNotes?.trim() || null,
          diagnosis: payload.diagnosis?.trim() || null,
          conduct: payload.conduct?.trim() || null,
          followUpAt: payload.followUpAt ?? null,
        },
        update: {
          clinicalNotes: payload.clinicalNotes?.trim() ?? null,
          diagnosis: payload.diagnosis?.trim() ?? null,
          conduct: payload.conduct?.trim() ?? null,
          followUpAt: payload.followUpAt ?? null,
          doctorId: doctorForRecord,
        },
      });

      return tx.appointment.findUniqueOrThrow({
        where: { id },
        include: {
          patient: { select: { id: true, name: true, phone: true, cpf: true } },
          doctor: { select: { id: true, name: true } },
          medicalRecord: {
            select: {
              id: true,
              diagnosis: true,
              clinicalNotes: true,
              conduct: true,
              followUpAt: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ appointment });
  }

  if (nextStatus === AppointmentStatus.CANCELADO) {
    if (role === Role.MEDICO) {
      return NextResponse.json({ error: "Médicos não podem cancelar agendamentos ou fila." }, { status: 403 });
    }
    if (appt.status === AppointmentStatus.CANCELADO) {
      return NextResponse.json({ error: "Já cancelado." }, { status: 409 });
    }
    if (appt.status === AppointmentStatus.FINALIZADO) {
      return NextResponse.json({ error: "Atendimento já finalizado." }, { status: 409 });
    }
    if (role === Role.RECEPCAO) {
      const recepCan =
        appt.status === AppointmentStatus.PENDENTE ||
        appt.status === AppointmentStatus.CONFIRMADO ||
        appt.status === AppointmentStatus.AGUARDANDO;
      if (!recepCan) {
        return NextResponse.json(
          { error: "Recepção não pode cancelar neste status. Peça apoio da administração." },
          { status: 403 },
        );
      }
    } else if (role !== Role.ADMIN) {
      return NextResponse.json({ error: "Sem permissão para cancelar." }, { status: 403 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELADO },
      include: {
        patient: { select: { id: true, name: true, phone: true, cpf: true } },
        doctor: { select: { id: true, name: true } },
        medicalRecord: true,
      },
    });

    return NextResponse.json({ appointment });
  }

  return NextResponse.json({ error: "Status não suportado." }, { status: 400 });
}
