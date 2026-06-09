import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { AtendimentoPanel } from "@/components/atendimento/atendimento-panel";
import { roleHasPermission } from "@/lib/permissions";

export default async function AtendimentoPage() {
  const session = await requirePermission("painel.atendimento");
  const canRegisterSale = roleHasPermission(session.user.role, "painel.vendas");

  return (
    <div>
      <PainelPageHeader
        title="Atendimento"
        subtitle="Recepção e administração enviam o paciente à fila (Aguardando). Somente o médico pode iniciar e finalizar a consulta clínica."
      />
      <AtendimentoPanel
        role={session.user.role}
        userId={session.user.id}
        canRegisterSale={canRegisterSale}
      />
    </div>
  );
}
