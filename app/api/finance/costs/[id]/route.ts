import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { canAccessFinance } from "@/lib/finance-access";
import { financeCostUpdateSchema } from "@/lib/validation/finance";
import { reaisToCents } from "@/lib/formatting-money";
import { brazilDayStart } from "@/lib/brazil-time";

type Ctx = { params: Promise<{ id: string }> };

async function financeGate() {
  const gate = await requirePermissionApi("painel.financeiro");
  if (!gate.ok) return { ok: false as const, response: gate.response };
  if (!canAccessFinance(gate.session.user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 }),
    };
  }
  return { ok: true as const, session: gate.session };
}

export async function PUT(req: Request, ctx: Ctx) {
  const gate = await financeGate();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = financeCostUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const exists = await prisma.financialCost.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Custo não encontrado." }, { status: 404 });
  }

  const { description, valor, type, category, referenceAt, notes } = parsed.data;
  const [y, m, d] = referenceAt.split("-").map(Number);
  const refDate = brazilDayStart({ year: y, month: m, day: d });

  const cost = await prisma.financialCost.update({
    where: { id },
    data: {
      description: description.trim(),
      amountCents: reaisToCents(valor),
      type,
      category: category?.trim() || null,
      referenceAt: refDate,
      notes: notes?.trim() || null,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ cost });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await financeGate();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  try {
    await prisma.financialCost.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Custo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
