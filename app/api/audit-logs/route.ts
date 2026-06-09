import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermissionApi } from "@/lib/api-auth";

export async function GET(req: Request) {
  const gate = await requirePermissionApi("painel.auditoria");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? 100), 200);

  const logs = await prisma.auditLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ logs });
}
