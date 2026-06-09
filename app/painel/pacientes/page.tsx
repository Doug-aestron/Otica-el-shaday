import { auth } from "@/auth";
import { canMutatePatient } from "@/lib/patient-access";
import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { PatientList } from "@/components/patients/patient-list";

export default async function PacientesPage() {
  await requirePermission("painel.pacientes");
  const session = await auth();
  const canCreate = session?.user ? canMutatePatient(session.user.role) : false;

  return (
    <div>
      <PainelPageHeader
        title="Pacientes"
        subtitle="Busque por nome, CPF ou telefone. Cadastro disponível para recepção e administração."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8">
        <PatientList canCreate={canCreate} />
      </div>
    </div>
  );
}
