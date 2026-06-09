"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnamnesisForm } from "@/components/patients/anamnesis-form";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button";
import { formatCpfDisplay, formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/formatting";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

export type PatientDetailModel = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnamnesisRowModel = {
  id: string;
  chiefComplaint: string | null;
  usesGlasses: boolean;
  usesContactLens: boolean;
  headache: boolean;
  blurredVision: boolean;
  difficultyNear: boolean;
  difficultyFar: boolean;
  diabetes: boolean;
  hypertension: boolean;
  allergies: string | null;
  medications: string | null;
  ocularSurgery: string | null;
  familyHistory: string | null;
  observations: string | null;
  lgpdConsent: boolean;
  createdAt: string;
  createdBy: { name: string } | null;
};

type Props = {
  patient: PatientDetailModel;
  anamneses: AnamnesisRowModel[];
  canMutatePatient: boolean;
  canCreateAnamnesis: boolean;
};

function BoolTag({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900"
          : "rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-500"
      }
    >
      {children}
    </span>
  );
}

export function PatientDetailShell({ patient, anamneses, canMutatePatient, canCreateAnamnesis }: Props) {
  const router = useRouter();
  const [showAnamnesis, setShowAnamnesis] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!canMutatePatient) return;
    if (!window.confirm(`Excluir o paciente "${patient.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(typeof j.error === "string" ? j.error : "Erro ao excluir.");
        setDeleting(false);
        return;
      }
      router.push("/painel/pacientes");
      router.refresh();
    } catch {
      alert("Erro de conexão.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-ink-900">Dados do paciente</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nome</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{patient.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">CPF</dt>
              <dd className="mt-0.5 text-ink-800">{formatCpfDisplay(patient.cpf)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Telefone</dt>
              <dd className="mt-0.5 text-ink-800">{patient.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">E-mail</dt>
              <dd className="mt-0.5 text-ink-800">{patient.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nascimento</dt>
              <dd className="mt-0.5 text-ink-800">{formatDateOnlyPtBR(patient.birthDate)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Endereço</dt>
              <dd className="mt-0.5 text-ink-800">{patient.address || "—"}</dd>
            </div>
            {patient.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Observações</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-ink-800">{patient.notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {canMutatePatient ? (
            <>
              <Link href={`/painel/pacientes/${patient.id}/edit`} className={buttonClassName({ variant: "outline" })}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                {deleting ? "Excluindo…" : "Excluir paciente"}
              </Button>
            </>
          ) : null}
          {canCreateAnamnesis ? (
            <Button type="button" onClick={() => setShowAnamnesis((s) => !s)}>
              <Plus className="h-4 w-4" />
              {showAnamnesis ? "Fechar formulário" : "Nova anamnese"}
            </Button>
          ) : null}
        </div>
      </div>

      {canCreateAnamnesis && showAnamnesis ? (
        <AnamnesisForm patientId={patient.id} onSuccess={() => setShowAnamnesis(false)} onCancel={() => setShowAnamnesis(false)} />
      ) : null}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">Anamneses anteriores</h3>
        </div>

        {anamneses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center text-sm text-ink-600">
            Nenhuma anamnese registrada ainda.
            {canCreateAnamnesis ? <p className="mt-2">Use o botão &quot;Nova anamnese&quot; para adicionar.</p> : null}
          </div>
        ) : (
          <ul className="space-y-4">
            {anamneses.map((a) => (
              <li key={a.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {formatDateTimePtBR(a.createdAt)}
                    {a.createdBy ? ` · ${a.createdBy.name}` : ""}
                  </p>
                  {a.lgpdConsent ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      LGPD ok
                    </span>
                  ) : null}
                </div>
                {a.chiefComplaint ? (
                  <p className="mt-3 text-sm text-ink-800">
                    <span className="font-semibold text-ink-900">Queixa: </span>
                    {a.chiefComplaint}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <BoolTag active={a.usesGlasses}>Óculos</BoolTag>
                  <BoolTag active={a.usesContactLens}>Lentes</BoolTag>
                  <BoolTag active={a.headache}>Cefaleia</BoolTag>
                  <BoolTag active={a.blurredVision}>Embaçada</BoolTag>
                  <BoolTag active={a.difficultyNear}>Perto</BoolTag>
                  <BoolTag active={a.difficultyFar}>Longe</BoolTag>
                  <BoolTag active={a.diabetes}>Diabetes</BoolTag>
                  <BoolTag active={a.hypertension}>HAS</BoolTag>
                </div>
                <div className="mt-3 space-y-2 text-sm text-ink-700">
                  {a.allergies ? (
                    <p>
                      <span className="font-semibold text-ink-900">Alergias: </span>
                      {a.allergies}
                    </p>
                  ) : null}
                  {a.medications ? (
                    <p>
                      <span className="font-semibold text-ink-900">Medicamentos: </span>
                      {a.medications}
                    </p>
                  ) : null}
                  {a.ocularSurgery ? (
                    <p>
                      <span className="font-semibold text-ink-900">Cirurgia ocular: </span>
                      {a.ocularSurgery}
                    </p>
                  ) : null}
                  {a.familyHistory ? (
                    <p>
                      <span className="font-semibold text-ink-900">Familiar: </span>
                      {a.familyHistory}
                    </p>
                  ) : null}
                  {a.observations ? (
                    <p>
                      <span className="font-semibold text-ink-900">Obs.: </span>
                      {a.observations}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
