import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { AgendaPanel } from "@/components/agenda/agenda-panel";

export default async function AgendaPage() {
  const session = await requirePermission("painel.agenda");

  return (
    <div>
      <PainelPageHeader
        title="Agenda"
        subtitle="Pedidos do site e confirmações: pendente, confirmado, realizado ou envio à fila de atendimento."
      />
      <AgendaPanel role={session.user.role} />
    </div>
  );
}
