import { Role } from "@prisma/client";
import { requirePermission } from "@/lib/guards";

export const revalidate = 60;
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { roleLabel } from "@/lib/role-label";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";

export default async function PainelHomePage() {
  const session = await requirePermission("painel.dashboard");
  const stats = await getDashboardStats(session.user.role);

  return (
    <div>
      <PainelPageHeader
        title="Início"
        subtitle="Visão geral com dados em tempo real do sistema."
      />
      <DashboardCards
        stats={stats}
        userName={session.user.name ?? "Usuário"}
        roleLabel={roleLabel(session.user.role)}
        showAdminMetrics={session.user.role === Role.ADMIN}
      />
    </div>
  );
}
