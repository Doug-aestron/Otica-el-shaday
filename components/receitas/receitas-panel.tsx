"use client";

import { useCallback, useEffect, useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCpfDisplay } from "@/lib/formatting";
import { Loader2, FileDown, UserSearch } from "lucide-react";
import type { PrescriptionPdfPayload } from "@/components/receitas/prescription-pdf-document";
import { canCreatePrescription } from "@/lib/prescription-access";

type PatientHit = { id: string; name: string; cpf: string | null; phone: string | null };

type Props = {
  role: Role;
};

function toPdfPayload(p: {
  id: string;
  createdAt: string;
  patient: { name: string; cpf: string | null; phone: string | null };
  doctor: { name: string };
  odSphere: string | null;
  odCylinder: string | null;
  odAxis: number | null;
  odAddition: string | null;
  odDnp: string | null;
  osSphere: string | null;
  osCylinder: string | null;
  osAxis: number | null;
  osAddition: string | null;
  osDnp: string | null;
  lensType: string | null;
  notes: string | null;
}): PrescriptionPdfPayload {
  return {
    prescriptionId: p.id,
    issuedAt: p.createdAt,
    patientName: p.patient.name,
    patientCpf: p.patient.cpf ? formatCpfDisplay(p.patient.cpf) : null,
    patientPhone: p.patient.phone,
    doctorName: p.doctor.name,
    odSphere: p.odSphere,
    odCylinder: p.odCylinder,
    odAxis: p.odAxis,
    odAddition: p.odAddition,
    odDnp: p.odDnp,
    osSphere: p.osSphere,
    osCylinder: p.osCylinder,
    osAxis: p.osAxis,
    osAddition: p.osAddition,
    osDnp: p.osDnp,
    lensType: p.lensType,
    notes: p.notes,
  };
}

export function ReceitasPanel({ role }: Props) {
  const canPrescribe = canCreatePrescription(role);
  const [patientQuery, setPatientQuery] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [picked, setPicked] = useState<PatientHit | null>(null);

  const [odSphere, setOdSphere] = useState("");
  const [odCylinder, setOdCylinder] = useState("");
  const [odAxis, setOdAxis] = useState("");
  const [odAddition, setOdAddition] = useState("");
  const [odDnp, setOdDnp] = useState("");

  const [osSphere, setOsSphere] = useState("");
  const [osCylinder, setOsCylinder] = useState("");
  const [osAxis, setOsAxis] = useState("");
  const [osAddition, setOsAddition] = useState("");
  const [osDnp, setOsDnp] = useState("");

  const [lensType, setLensType] = useState("");
  const [notes, setNotes] = useState("");

  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const q = patientQuery.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const url = new URL("/api/patients", window.location.origin);
        url.searchParams.set("q", q);
        const res = await fetch(url.toString(), { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.patients)) {
          setHits(
            data.patients.map((p: PatientHit) => ({
              id: p.id,
              name: p.name,
              cpf: p.cpf,
              phone: p.phone,
            })),
          );
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  const resetForm = useCallback(() => {
    setOdSphere("");
    setOdCylinder("");
    setOdAxis("");
    setOdAddition("");
    setOdDnp("");
    setOsSphere("");
    setOsCylinder("");
    setOsAxis("");
    setOsAddition("");
    setOsDnp("");
    setLensType("");
    setNotes("");
  }, []);

  async function handleSave() {
    if (!picked) {
      setSubmitMsg("Selecione um paciente.");
      return;
    }
    setSubmitMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: picked.id,
          odSphere: odSphere || null,
          odCylinder: odCylinder || null,
          odAxis: odAxis === "" ? undefined : odAxis,
          odAddition: odAddition || null,
          odDnp: odDnp || null,
          osSphere: osSphere || null,
          osCylinder: osCylinder || null,
          osAxis: osAxis === "" ? undefined : osAxis,
          osAddition: osAddition || null,
          osDnp: osDnp || null,
          lensType: lensType || null,
          notes: notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = typeof data.error === "string" ? data.error : "Não foi possível salvar a receita.";
        if (data.details && typeof data.details === "object") {
          const entries = Object.entries(data.details as Record<string, unknown>)
            .map(([k, v]) => {
              const arr = Array.isArray(v) ? v : [String(v)];
              return `${k}: ${arr.join(", ")}`;
            })
            .filter(Boolean);
          if (entries.length) msg += ` (${entries.join("; ")})`;
        }
        setSubmitMsg(msg);
        setSubmitting(false);
        return;
      }
      setLastId(data.prescription.id as string);
      setSubmitMsg("Receita salva com sucesso. Você pode gerar o PDF.");
      resetForm();
      setSubmitting(false);
    } catch {
      setSubmitMsg("Erro de conexão.");
      setSubmitting(false);
    }
  }

  async function handlePdf(id: string) {
    setPdfLoading(true);
    setSubmitMsg(null);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitMsg(typeof data.error === "string" ? data.error : "Não foi possível carregar a receita.");
        setPdfLoading(false);
        return;
      }
      const p = data.prescription;
      const payload = toPdfPayload({
        id: p.id,
        createdAt: p.createdAt,
        patient: p.patient,
        doctor: p.doctor,
        odSphere: p.odSphere,
        odCylinder: p.odCylinder,
        odAxis: p.odAxis,
        odAddition: p.odAddition,
        odDnp: p.odDnp,
        osSphere: p.osSphere,
        osCylinder: p.osCylinder,
        osAxis: p.osAxis,
        osAddition: p.osAddition,
        osDnp: p.osDnp,
        lensType: p.lensType,
        notes: p.notes,
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { PrescriptionPdfDocument } = await import("@/components/receitas/prescription-pdf-document");
      const blob = await pdf(<PrescriptionPdfDocument data={payload} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = payload.patientName.replace(/[^\w\-àáâãéêíóôõúç\s]/gi, "").trim().replace(/\s+/g, "-");
      a.download = `receita-${safeName || "paciente"}-${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSubmitMsg("Falha ao gerar o PDF. Verifique se o pacote @react-pdf/renderer está instalado.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (!canPrescribe) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-900">
        Seu perfil não pode emitir receitas neste módulo.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <UserSearch className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">Paciente</h2>
        </div>
        <p className="mt-1 text-sm text-ink-600">Busque e selecione o paciente antes de preencher a receita.</p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="pq">Busca</Label>
          <Input
            id="pq"
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value);
              if (picked && e.target.value !== picked.name) setPicked(null);
            }}
            placeholder="Nome, CPF ou telefone…"
          />
          {picked ? (
            <p className="text-xs font-semibold text-emerald-800">
              Selecionado: {picked.name} · {formatCpfDisplay(picked.cpf)}
            </p>
          ) : null}
          {hits.length > 0 && !picked ? (
            <ul className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 text-sm">
              {hits.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white"
                    onClick={() => {
                      setPicked(p);
                      setPatientQuery(p.name);
                      setHits([]);
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-ink-500">
                      {formatCpfDisplay(p.cpf)} · {p.phone || "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink-900">Olho direito (OD)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="odS">Esférico</Label>
            <Input id="odS" value={odSphere} onChange={(e) => setOdSphere(e.target.value)} placeholder="ex.: -2.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odCyl">Cilíndrico</Label>
            <Input id="odCyl" value={odCylinder} onChange={(e) => setOdCylinder(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odAx">Eixo (°)</Label>
            <Input id="odAx" inputMode="numeric" value={odAxis} onChange={(e) => setOdAxis(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odAd">Adição</Label>
            <Input id="odAd" value={odAddition} onChange={(e) => setOdAddition(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odDnp">DNP (mm)</Label>
            <Input id="odDnp" value={odDnp} onChange={(e) => setOdDnp(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink-900">Olho esquerdo (OE)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="osS">Esférico</Label>
            <Input id="osS" value={osSphere} onChange={(e) => setOsSphere(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="osCyl">Cilíndrico</Label>
            <Input id="osCyl" value={osCylinder} onChange={(e) => setOsCylinder(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="osAx">Eixo (°)</Label>
            <Input id="osAx" inputMode="numeric" value={osAxis} onChange={(e) => setOsAxis(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="osAd">Adição</Label>
            <Input id="osAd" value={osAddition} onChange={(e) => setOsAddition(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="osDnp">DNP (mm)</Label>
            <Input id="osDnp" value={osDnp} onChange={(e) => setOsDnp(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink-900">Outros</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lens">Tipo de lente</Label>
            <Input id="lens" value={lensType} onChange={(e) => setLensType(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n">Observações</Label>
            <Textarea id="n" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </section>

      {submitMsg ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-ink-800">
          {submitMsg}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => handleSave()} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            "Salvar receita"
          )}
        </Button>
        {lastId ? (
          <Button type="button" variant="secondary" disabled={pdfLoading} onClick={() => handlePdf(lastId)}>
            {pdfLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" /> Gerar PDF
              </>
            )}
          </Button>
        ) : null}
      </div>

      {lastId ? (
        <p className="text-xs text-ink-500">
          Última receita salva: <span className="font-mono">{lastId}</span>. Gere o PDF ou salve uma nova receita.
        </p>
      ) : null}
    </div>
  );
}
