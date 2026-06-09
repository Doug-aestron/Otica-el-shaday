import { SaleStatus } from "@prisma/client";
import { COST_TYPE } from "@/lib/cost-type";
import { prisma } from "@/lib/prisma";
import { brazilDayEnd, brazilDayStart, brazilDateParts } from "@/lib/brazil-time";

export type FinancePeriod = {
  from: string;
  to: string;
  fromDate: Date;
  toDate: Date;
  label: string;
};

export function parsePeriodFromQuery(from: string, to: string): FinancePeriod {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const fromDate = brazilDayStart({ year: fy, month: fm, day: fd });
  const toDate = brazilDayEnd({ year: ty, month: tm, day: td });
  if (fromDate >= toDate) {
    throw new Error("INVALID_PERIOD");
  }
  const label = `${from.split("-").reverse().join("/")} — ${to.split("-").reverse().join("/")}`;
  return { from, to, fromDate, toDate, label };
}

export function currentMonthPeriod(): FinancePeriod {
  const now = brazilDateParts();
  const from = `${now.year}-${String(now.month).padStart(2, "0")}-01`;
  const lastDay = new Date(now.year, now.month, 0).getDate();
  const to = `${now.year}-${String(now.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return parsePeriodFromQuery(from, to);
}

export type FinanceSummary = {
  period: FinancePeriod;
  receitasCents: number;
  vendasCount: number;
  orcamentosCents: number;
  orcamentosCount: number;
  custosCents: number;
  custosFixosCents: number;
  custosVariaveisCents: number;
  custosCount: number;
  lucroCents: number;
  margemPercent: number | null;
};

export async function getFinanceSummary(period: FinancePeriod): Promise<FinanceSummary> {
  const { fromDate, toDate } = period;

  const [vendas, orcamentos, custosAgg, custosFixos, custosVariaveis, custosCount] =
    await Promise.all([
      prisma.sale.aggregate({
        where: {
          status: SaleStatus.VENDIDO,
          createdAt: { gte: fromDate, lt: toDate },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: {
          status: SaleStatus.ORCAMENTO,
          createdAt: { gte: fromDate, lt: toDate },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.financialCost.aggregate({
        where: { referenceAt: { gte: fromDate, lt: toDate } },
        _sum: { amountCents: true },
      }),
      prisma.financialCost.aggregate({
        where: { referenceAt: { gte: fromDate, lt: toDate }, type: COST_TYPE.FIXO },
        _sum: { amountCents: true },
      }),
      prisma.financialCost.aggregate({
        where: { referenceAt: { gte: fromDate, lt: toDate }, type: COST_TYPE.VARIAVEL },
        _sum: { amountCents: true },
      }),
      prisma.financialCost.count({
        where: { referenceAt: { gte: fromDate, lt: toDate } },
      }),
    ]);

  const receitasCents = vendas._sum.totalCents ?? 0;
  const custosCents = custosAgg._sum.amountCents ?? 0;
  const lucroCents = receitasCents - custosCents;
  const margemPercent =
    receitasCents > 0 ? Math.round((lucroCents / receitasCents) * 1000) / 10 : null;

  return {
    period,
    receitasCents,
    vendasCount: vendas._count,
    orcamentosCents: orcamentos._sum.totalCents ?? 0,
    orcamentosCount: orcamentos._count,
    custosCents,
    custosFixosCents: custosFixos._sum.amountCents ?? 0,
    custosVariaveisCents: custosVariaveis._sum.amountCents ?? 0,
    custosCount,
    lucroCents,
    margemPercent,
  };
}

export type Demonstrativo = FinanceSummary & {
  receitas: Array<{
    id: string;
    createdAt: Date;
    totalCents: number;
    product: string | null;
    paymentMethod: string | null;
    patientName: string | null;
  }>;
  custosFixos: Array<{
    id: string;
    referenceAt: Date;
    description: string;
    amountCents: number;
    category: string | null;
  }>;
  custosVariaveis: Array<{
    id: string;
    referenceAt: Date;
    description: string;
    amountCents: number;
    category: string | null;
  }>;
};

export async function getDemonstrativo(period: FinancePeriod): Promise<Demonstrativo> {
  const summary = await getFinanceSummary(period);
  const { fromDate, toDate } = period;

  const [sales, costs] = await Promise.all([
    prisma.sale.findMany({
      where: {
        status: SaleStatus.VENDIDO,
        createdAt: { gte: fromDate, lt: toDate },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        totalCents: true,
        product: true,
        paymentMethod: true,
        patient: { select: { name: true } },
      },
    }),
    prisma.financialCost.findMany({
      where: { referenceAt: { gte: fromDate, lt: toDate } },
      orderBy: [{ type: "asc" }, { referenceAt: "desc" }],
      select: {
        id: true,
        referenceAt: true,
        description: true,
        amountCents: true,
        type: true,
        category: true,
      },
    }),
  ]);

  const custosFixos = costs
    .filter((c) => c.type === COST_TYPE.FIXO)
    .map(({ type: _t, ...rest }) => rest);
  const custosVariaveis = costs
    .filter((c) => c.type === COST_TYPE.VARIAVEL)
    .map(({ type: _t, ...rest }) => rest);

  return {
    ...summary,
    receitas: sales.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      totalCents: s.totalCents,
      product: s.product,
      paymentMethod: s.paymentMethod,
      patientName: s.patient?.name ?? null,
    })),
    custosFixos,
    custosVariaveis,
  };
}
