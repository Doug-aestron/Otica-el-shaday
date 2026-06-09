import { Suspense } from "react";
import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { VendasPanel } from "@/components/vendas/vendas-panel";
import { Loader2 } from "lucide-react";

export default async function VendasPage() {
  await requirePermission("painel.vendas");

  return (
    <div>
      <PainelPageHeader
        title="Vendas"
        subtitle="Registre orçamentos e vendas vinculadas ao paciente — inclusive após a consulta."
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        }
      >
        <VendasPanel />
      </Suspense>
    </div>
  );
}
