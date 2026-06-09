import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";

type Ctx = { params: Promise<{ patientId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requirePermissionApi("painel.pacientes");
  if (!gate.ok) return gate.response;

  const { patientId } = await ctx.params;

  const patientExists = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patientExists) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const items = await prisma.anamnesis.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ anamneses: items });
}
