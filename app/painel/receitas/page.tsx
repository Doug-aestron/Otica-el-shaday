import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { ReceitasPanel } from "@/components/receitas/receitas-panel";

export default async function ReceitasPage() {
  const session = await requirePermission("painel.receitas");

  return (
    <div>
      <PainelPageHeader
        title="Receitas"
        subtitle="Prescrição oftalmológica com exportação em PDF para o paciente."
      />
      <ReceitasPanel role={session.user.role} />
    </div>
  );
}
