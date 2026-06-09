import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { AuditoriaPanel } from "@/components/auditoria/auditoria-panel";

export default async function AuditoriaPage() {
  await requirePermission("painel.auditoria");

  return (
    <div>
      <PainelPageHeader
        title="Auditoria"
        subtitle="Trilha de eventos: pacientes, atendimentos e receitas registrados automaticamente."
      />
      <AuditoriaPanel />
    </div>
  );
}
