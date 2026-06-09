import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOr401 } from "@/lib/api-auth";
import { profileUpdateSchema } from "@/lib/validation/settings";

export async function GET() {
  const gate = await getSessionOr401();
  if (!gate.ok) return gate.response;

  const user = await prisma.user.findUnique({
    where: { id: gate.session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const gate = await getSessionOr401();
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const user = await prisma.user.update({
    where: { id: gate.session.user.id },
    data: { name: parsed.data.name.trim() },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user });
}
