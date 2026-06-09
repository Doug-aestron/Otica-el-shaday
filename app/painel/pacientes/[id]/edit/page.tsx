import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canMutatePatient } from "@/lib/patient-access";
import { requirePermission } from "@/lib/guards";
import { PainelPageHeader } from "@/components/layout/painel-page-header";
import { PatientForm } from "@/components/patients/patient-form";
import { buttonClassName } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function EditarPacientePage({ params }: Props) {
  const session = await requirePermission("painel.pacientes");
  if (!canMutatePatient(session.user.role)) {
    const { id } = await params;
    redirect(`/painel/pacientes/${id}`);
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div>
      <PainelPageHeader title="Editar paciente" subtitle="Atualize os dados e salve." />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-8">
        <Link
          href={`/painel/pacientes/${id}`}
          className={buttonClassName({ variant: "ghost", size: "sm", className: "mb-6 -ml-2" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao paciente
        </Link>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <PatientForm
            mode="edit"
            patientId={id}
            initial={{
              id: patient.id,
              name: patient.name,
              cpf: patient.cpf,
              phone: patient.phone,
              email: patient.email,
              birthDate: patient.birthDate,
              address: patient.address,
              notes: patient.notes,
            }}
          />
        </div>
      </div>
    </div>
  );
}
