import { NextResponse } from "next/server";
import { Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";
import { saleCreateSchema } from "@/lib/validation/sale";
import { canCreateSale } from "@/lib/sale-access";
import { reaisToCents } from "@/lib/formatting-money";

const saleInclude = {
  patient: { select: { id: true, name: true, phone: true, cpf: true } },
  seller: { select: { id: true, name: true } },
  appointment: {
    select: {
      id: true,
      status: true,
      startsAt: true,
    },
  },
} satisfies Prisma.SaleInclude;

export async function GET(req: Request) {
  const gate = await requirePermissionApi("painel.vendas");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const where: Prisma.SaleWhereInput = {};

  if (rawStatus && rawStatus.trim().length > 0) {
    const parts = rawStatus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as string[];
    const valid = parts.filter((p): p is SaleStatus =>
      Object.values(SaleStatus).includes(p as SaleStatus),
    );
    if (valid.length > 0) {
      where.status = { in: valid };
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    take: 200,
    orderBy: { createdAt: "desc" },
    include: saleInclude,
  });

  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const gate = await requirePermissionApi("painel.vendas");
  if (!gate.ok) return gate.response;

  if (!canCreateSale(gate.session.user.role)) {
    return NextResponse.json({ error: "Sem permissão para registrar vendas." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = saleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { patientId, appointmentId, valor, produto, formaPagamento, status, notes } = parsed.data;

  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  if (appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, patientId: true },
    });
    if (!appt) {
      return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 });
    }
    if (appt.patientId !== patientId) {
      return NextResponse.json({ error: "Atendimento não pertence a este paciente." }, { status: 409 });
    }
  }

  const sale = await prisma.sale.create({
    data: {
      patientId,
      appointmentId: appointmentId ?? null,
      sellerId: gate.session.user.id,
      totalCents: reaisToCents(valor),
      product: produto.trim(),
      paymentMethod: formaPagamento.trim(),
      status,
      notes: notes?.trim() || null,
    },
    include: saleInclude,
  });

  return NextResponse.json({ sale }, { status: 201 });
}
