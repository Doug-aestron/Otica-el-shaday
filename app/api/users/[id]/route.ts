import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { canManageSettings } from "@/lib/settings-access";
import { userUpdateSchema } from "@/lib/validation/settings";
import { AuditAction, writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.configuracoes");
  if (!gate.ok) return gate.response;
  if (!canManageSettings(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const data = parsed.data;

  if (id === gate.session.user.id) {
    if (data.active === false) {
      return NextResponse.json({ error: "Você não pode desativar sua própria conta." }, { status: 409 });
    }
    if (data.role !== undefined && data.role !== target.role) {
      return NextResponse.json({ error: "Você não pode alterar seu próprio perfil de acesso." }, { status: 409 });
    }
  }

  if (data.active === false) {
    const adminsAtivos = await prisma.user.count({
      where: { role: Role.ADMIN, active: true, id: { not: id } },
    });
    if (target.role === Role.ADMIN && adminsAtivos === 0) {
      return NextResponse.json({ error: "Deve existir pelo menos um administrador ativo." }, { status: 409 });
    }
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.role !== undefined) updateData.role = data.role;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 422 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });

  await writeAuditLog({
    userId: gate.session.user.id,
    action: AuditAction.USER_UPDATED,
    entity: "User",
    entityId: user.id,
    metadata: {
      email: user.email,
      fields: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined).join(", "),
    },
    req,
  });

  return NextResponse.json({ user });
}
