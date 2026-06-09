import Link from "next/link";
import { redirect } from "next/navigation";
import { canMutatePatient } from "@/lib/patient-access";
import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { PatientForm } from "@/components/patients/patient-form";
import { buttonClassName } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NovoPacientePage() {
  const session = await requirePermission("painel.pacientes");
  if (!canMutatePatient(session.user.role)) {
    redirect("/painel/pacientes");
  }

  return (
    <div>
      <PainelPageHeader
        title="Novo paciente"
        subtitle="Preencha os dados cadastrais. Campos com * são obrigatórios."
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
        <Link
          href="/painel/pacientes"
          className={buttonClassName({ variant: "ghost", size: "sm", className: "mb-6 -ml-2" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à lista
        </Link>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <PatientForm mode="create" />
        </div>
      </div>
    </div>
  );
}
