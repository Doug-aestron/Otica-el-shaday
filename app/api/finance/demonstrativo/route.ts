import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/api-auth";
import { canAccessFinance } from "@/lib/finance-access";
import { financePeriodQuerySchema } from "@/lib/validation/finance";
import { currentMonthPeriod, getDemonstrativo, parsePeriodFromQuery } from "@/lib/finance-service";

export async function GET(req: Request) {
  const gate = await requirePermissionApi("painel.financeiro");
  if (!gate.ok) return gate.response;
  if (!canAccessFinance(gate.session.user.role)) {
    return NextResponse.json({ error: "Acesso restrito à administração." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let period;
  if (!from || !to) {
    period = currentMonthPeriod();
  } else {
    const parsed = financePeriodQuerySchema.safeParse({ from, to });
    if (!parsed.success) {
      return NextResponse.json({ error: "Período inválido." }, { status: 400 });
    }
    try {
      period = parsePeriodFromQuery(parsed.data.from, parsed.data.to);
    } catch {
      return NextResponse.json({ error: "Data final deve ser posterior à inicial." }, { status: 400 });
    }
  }

  const demonstrativo = await getDemonstrativo(period);
  return NextResponse.json({ demonstrativo });
}
