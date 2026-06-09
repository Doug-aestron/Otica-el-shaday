import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { ConfiguracoesPanel } from "@/components/configuracoes/configuracoes-panel";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const session = await requirePermission("painel.configuracoes");

  if (session.user.role !== Role.ADMIN) {
    redirect("/painel");
  }

  return (
    <div>
      <PainelPageHeader
        title="Configurações"
        subtitle="Dados da clínica, gestão de usuários e segurança da conta administrativa."
      />
      <ConfiguracoesPanel currentUserId={session.user.id} />
    </div>
  );
}
