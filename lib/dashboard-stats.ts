import { AppointmentStatus, Role } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  brazilDateParts,
  brazilDayEnd,
  brazilDayStart,
  brazilMonthEnd,
  brazilMonthLabel,
  brazilMonthStart,
} from "@/lib/brazil-time";

export type DashboardStats = {
  atendimentosHoje: number;
  atendimentosMes: number;
  pacientesCadastrados: number;
  agendamentosPendentes: number;
  consultasFinalizadas: number;
  /** Média de duração das consultas finalizadas (somente preenchido para admin). */
  mediaConsultaSegundos: number | null;
  consultasComDuracao: number;
  periodo: {
    diaLabel: string;
    mesLabel: string;
  };
};

const activeStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDENTE,
  AppointmentStatus.CONFIRMADO,
  AppointmentStatus.REALIZADO,
  AppointmentStatus.AGUARDANDO,
  AppointmentStatus.EM_ATENDIMENTO,
  AppointmentStatus.FINALIZADO,
];

function startsAtInRange(start: Date, end: Date) {
  return {
    startsAt: { gte: start, lt: end },
    status: { in: activeStatuses },
  };
}

async function getAverageConsultationSeconds(): Promise<{
  mediaConsultaSegundos: number | null;
  consultasComDuracao: number;
}> {
  const rows = await prisma.$queryRaw<{ avg_seconds: number | null; cnt: bigint }[]>`
    SELECT
      AVG(EXTRACT(EPOCH FROM ("consultationEndedAt" - "consultationStartedAt")))::float AS avg_seconds,
      COUNT(*)::bigint AS cnt
    FROM "Appointment"
    WHERE status = 'FINALIZADO'
      AND "consultationStartedAt" IS NOT NULL
      AND "consultationEndedAt" IS NOT NULL
      AND "consultationEndedAt" > "consultationStartedAt"
  `;

  const row = rows[0];
  const cnt = Number(row?.cnt ?? 0);
  const avg = row?.avg_seconds;

  return {
    mediaConsultaSegundos: avg != null && cnt > 0 ? Math.round(avg) : null,
    consultasComDuracao: cnt,
  };
}

async function computeDashboardStats(role: Role): Promise<DashboardStats> {
  const now = new Date();
  const today = brazilDateParts(now);
  const dayStart = brazilDayStart(today);
  const dayEnd = brazilDayEnd(today);
  const monthStart = brazilMonthStart(today.year, today.month);
  const monthEnd = brazilMonthEnd(today.year, today.month);

  const diaLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Sao_Paulo",
  }).format(now);

  const [
    atendimentosHoje,
    atendimentosMes,
    pacientesCadastrados,
    agendamentosPendentes,
    consultasFinalizadas,
  ] = await Promise.all([
    prisma.appointment.count({ where: startsAtInRange(dayStart, dayEnd) }),
    prisma.appointment.count({ where: startsAtInRange(monthStart, monthEnd) }),
    prisma.patient.count(),
    prisma.appointment.count({ where: { status: AppointmentStatus.PENDENTE } }),
    prisma.appointment.count({ where: { status: AppointmentStatus.FINALIZADO } }),
  ]);

  const consultationAvg =
    role === Role.ADMIN ? await getAverageConsultationSeconds() : { mediaConsultaSegundos: null, consultasComDuracao: 0 };

  return {
    atendimentosHoje,
    atendimentosMes,
    pacientesCadastrados,
    agendamentosPendentes,
    consultasFinalizadas,
    mediaConsultaSegundos: consultationAvg.mediaConsultaSegundos,
    consultasComDuracao: consultationAvg.consultasComDuracao,
    periodo: {
      diaLabel,
      mesLabel: brazilMonthLabel(today.year, today.month),
    },
  };
}

const cachedStatsForRole = (role: Role) =>
  unstable_cache(() => computeDashboardStats(role), ["dashboard-stats", role], {
    revalidate: 60,
  });

export async function getDashboardStats(role: Role): Promise<DashboardStats> {
  return cachedStatsForRole(role)();
}
