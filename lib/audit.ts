import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Ações registradas na trilha de auditoria. */
export const AuditAction = {
  PATIENT_CREATED: "patient.created",
  PATIENT_UPDATED: "patient.updated",
  APPOINTMENT_CREATED: "appointment.created",
  PRESCRIPTION_CREATED: "prescription.created",
  SETTINGS_UPDATED: "settings.updated",
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

export function getRequestAuditContext(req: Request): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
    req.headers.get("x-real-ip")?.trim() ||
    null;
  const userAgent = req.headers.get("user-agent");
  return { ip, userAgent };
}

export async function writeAuditLog(params: {
  userId?: string | null;
  action: AuditActionValue | string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}): Promise<void> {
  const { ip, userAgent } = params.req ? getRequestAuditContext(params.req) : { ip: null, userAgent: null };

  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? undefined,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[audit] Falha ao registrar log:", err);
  }
}

export function auditActionLabel(action: string): string {
  const map: Record<string, string> = {
    [AuditAction.PATIENT_CREATED]: "Criação de paciente",
    [AuditAction.PATIENT_UPDATED]: "Edição de paciente",
    [AuditAction.APPOINTMENT_CREATED]: "Criação de atendimento",
    [AuditAction.PRESCRIPTION_CREATED]: "Geração de receita",
    [AuditAction.SETTINGS_UPDATED]: "Configurações da clínica",
    [AuditAction.USER_CREATED]: "Usuário criado",
    [AuditAction.USER_UPDATED]: "Usuário atualizado",
  };
  return map[action] ?? action;
}
