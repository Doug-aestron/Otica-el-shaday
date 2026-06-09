import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionOr401 } from "@/lib/api-auth";
import { passwordChangeSchema } from "@/lib/validation/settings";

export async function PUT(req: Request) {
  const gate = await getSessionOr401();
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: gate.session.user.id },
    select: { passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: gate.session.user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}
