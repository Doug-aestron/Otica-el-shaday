import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { canManageSettings } from "@/lib/settings-access";
import { getSystemSettings } from "@/lib/system-settings";
import { systemSettingsUpdateSchema } from "@/lib/validation/settings";
import { AuditAction, writeAuditLog } from "@/lib/audit";

export async function GET() {
  const gate = await requirePermissionApi("painel.configuracoes");
  if (!gate.ok) return gate.response;
  if (!canManageSettings(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const settings = await getSystemSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const gate = await requirePermissionApi("painel.configuracoes");
  if (!gate.ok) return gate.response;
  if (!canManageSettings(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = systemSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const settings = await getSystemSettings();
  const updated = await prisma.systemSettings.update({
    where: { id: settings.id },
    data: {
      clinicName: d.clinicName.trim(),
      clinicPhone: d.clinicPhone?.trim() || null,
      clinicEmail: d.clinicEmail?.trim() || null,
      clinicAddress: d.clinicAddress?.trim() || null,
      openingHours: d.openingHours?.trim() || null,
      appointmentMinutes: d.appointmentMinutes,
      siteWelcomeMessage: d.siteWelcomeMessage?.trim() || null,
    },
  });

  await writeAuditLog({
    userId: gate.session.user.id,
    action: AuditAction.SETTINGS_UPDATED,
    entity: "SystemSettings",
    entityId: updated.id,
    metadata: { clinicName: updated.clinicName },
    req,
  });

  return NextResponse.json({ settings: updated });
}
