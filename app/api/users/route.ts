import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { canManageSettings } from "@/lib/settings-access";
import { userCreateSchema } from "@/lib/validation/settings";
import { AuditAction, writeAuditLog } from "@/lib/audit";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function GET() {
  const gate = await requirePermissionApi("painel.configuracoes");
  if (!gate.ok) return gate.response;
  if (!canManageSettings(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: userSelect,
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
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

  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        active: true,
      },
      select: userSelect,
    });

    await writeAuditLog({
      userId: gate.session.user.id,
      action: AuditAction.USER_CREATED,
      entity: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      req,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe usuário com este e-mail." }, { status: 409 });
    }
    throw e;
  }
}
