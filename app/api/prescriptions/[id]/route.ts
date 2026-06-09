import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.receitas");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, cpf: true, phone: true, email: true } },
      doctor: { select: { id: true, name: true } },
      medicalRecord: { select: { id: true, diagnosis: true } },
    },
  });

  if (!prescription) {
    return NextResponse.json({ error: "Receita não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ prescription });
}
