import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { FinancePanel } from "@/components/finance/finance-panel";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function FinanceiroPage() {
  const session = await requirePermission("painel.financeiro");

  if (session.user.role !== Role.ADMIN) {
    redirect("/painel");
  }

  return (
    <div>
      <PainelPageHeader
        title="Financeiro"
        subtitle="Receitas, custos fixos e variáveis, dashboard e demonstrativo por período — somente administração."
      />
      <FinancePanel />
    </div>
  );
}
