import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { COST_TYPE, isCostTypeValue } from "@/lib/cost-type";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { canAccessFinance } from "@/lib/finance-access";
import { financeCostCreateSchema, financePeriodQuerySchema } from "@/lib/validation/finance";
import { reaisToCents } from "@/lib/formatting-money";
import { parsePeriodFromQuery } from "@/lib/finance-service";
import { brazilDayStart } from "@/lib/brazil-time";

export async function GET(req: Request) {
  const gate = await requirePermissionApi("painel.financeiro");
  if (!gate.ok) return gate.response;
  if (!canAccessFinance(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsedPeriod = financePeriodQuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  const where: Prisma.FinancialCostWhereInput = {};
  if (parsedPeriod.success) {
    try {
      const period = parsePeriodFromQuery(parsedPeriod.data.from, parsedPeriod.data.to);
      where.referenceAt = { gte: period.fromDate, lt: period.toDate };
    } catch {
      return NextResponse.json({ error: "Período inválido." }, { status: 400 });
    }
  }

  const typeRaw = searchParams.get("type");
  if (typeRaw && isCostTypeValue(typeRaw)) {
    where.type = typeRaw;
  }

  const costs = await prisma.financialCost.findMany({
    where,
    orderBy: { referenceAt: "desc" },
    take: 500,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ costs });
}

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.financeiro");
  if (!gate.ok) return gate.response;
  if (!canAccessFinance(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = financeCostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { description, valor, type, category, referenceAt, notes } = parsed.data;
  const [y, m, d] = referenceAt.split("-").map(Number);
  const refDate = brazilDayStart({ year: y, month: m, day: d });

  const cost = await prisma.financialCost.create({
    data: {
      description: description.trim(),
      amountCents: reaisToCents(valor),
      type,
      category: category?.trim() || null,
      referenceAt: refDate,
      notes: notes?.trim() || null,
      createdById: gate.session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ cost }, { status: 201 });
}
