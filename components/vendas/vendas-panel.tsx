"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SaleStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCpfDisplay, formatDateTimePtBR } from "@/lib/formatting";
import { formatCentsBRL } from "@/lib/formatting-money";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/validation/sale";
import { Loader2, RefreshCw, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";

type PatientHit = { id: string; name: string; cpf: string | null; phone: string | null };

export type SaleRow = {
  id: string;
  totalCents: number;
  product: string | null;
  paymentMethod: string | null;
  status: SaleStatus;
  notes: string | null;
  createdAt: string;
  patient: PatientHit | null;
  seller: { id: string; name: string };
  appointment: { id: string; status: string; startsAt: string } | null;
};

function statusLabel(s: SaleStatus): string {
  const map: Record<SaleStatus, string> = {
    [SaleStatus.ORCAMENTO]: "Orçamento",
    [SaleStatus.VENDIDO]: "Vendido",
    [SaleStatus.PERDIDO]: "Perdido",
  };
  return map[s];
}

function statusBadgeClass(s: SaleStatus): string {
  switch (s) {
    case SaleStatus.VENDIDO:
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case SaleStatus.PERDIDO:
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-amber-100 text-amber-900 ring-amber-200";
  }
}

function paymentLabel(value: string | null): string {
  if (!value) return "—";
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function VendasPanel() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId");
  const initialAppointmentId = searchParams.get("appointmentId");

  const [list, setList] = useState<SaleRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [patientQuery, setPatientQuery] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [picked, setPicked] = useState<PatientHit | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(initialAppointmentId);

  const [valor, setValor] = useState("");
  const [produto, setProduto] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [status, setStatus] = useState<SaleStatus>(SaleStatus.ORCAMENTO);
  const [notes, setNotes] = useState("");

  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/sales", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(typeof data.error === "string" ? data.error : "Erro ao carregar vendas.");
        setList([]);
        return;
      }
      setList(data.sales as SaleRow[]);
    } catch {
      setLoadError("Falha de conexão.");
      setList([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!initialPatientId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/patients/${initialPatientId}`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.patient) {
          const p = data.patient as PatientHit;
          setPicked(p);
          setPatientQuery(p.name);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPatientId]);

  useEffect(() => {
    const q = patientQuery.trim();
    if (q.length < 2 || picked?.name === q) {
      if (q.length < 2) setHits([]);
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
  }, [patientQuery, picked?.name]);

  async function submitSale(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setSubmitMsg("Selecione um paciente.");
      return;
    }
    setSubmitMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: picked.id,
          appointmentId: appointmentId || null,
          valor,
          produto,
          formaPagamento,
          status,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data.details && typeof data.details === "object"
            ? Object.values(data.details as Record<string, string[]>)
                .flat()
                .join(" ")
            : null;
        setSubmitMsg(
          detail || (typeof data.error === "string" ? data.error : "Não foi possível registrar a venda."),
        );
        setSubmitting(false);
        return;
      }
      setValor("");
      setProduto("");
      setFormaPagamento("pix");
      setStatus(SaleStatus.ORCAMENTO);
      setNotes("");
      setAppointmentId(null);
      setSubmitMsg("Venda registrada com sucesso.");
      await refresh();
      setSubmitting(false);
    } catch {
      setSubmitMsg("Erro de conexão.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      {initialPatientId ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Paciente vinculado ao atendimento. Complete os dados da venda abaixo.
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">Nova venda / orçamento</h2>
        </div>

        <form onSubmit={submitSale} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="salePatient">Paciente</Label>
            <Input
              id="salePatient"
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                if (picked && e.target.value !== picked.name) setPicked(null);
              }}
              placeholder="Buscar por nome, CPF ou telefone…"
              autoComplete="off"
            />
            {picked ? (
              <p className="text-xs font-semibold text-emerald-800">
                Selecionado: {picked.name} · {formatCpfDisplay(picked.cpf)}
              </p>
            ) : null}
            {hits.length > 0 && !picked ? (
              <ul className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 text-sm shadow-sm">
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
                      <span className="font-medium text-ink-900">{p.name}</span>
                      <span className="text-xs text-ink-500">
                        {formatCpfDisplay(p.cpf)} · {p.phone || "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <Input
              id="produto"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Ex.: armação + lentes multifocais"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pagamento">Forma de pagamento</Label>
            <select
              id="pagamento"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SaleStatus)}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value={SaleStatus.ORCAMENTO}>Orçamento</option>
              <option value={SaleStatus.VENDIDO}>Vendido</option>
              <option value={SaleStatus.PERDIDO}>Perdido</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="saleNotes">Observações (opcional)</Label>
            <Textarea id="saleNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {submitMsg ? (
            <p
              className={cn(
                "md:col-span-2 text-sm font-medium",
                submitMsg.includes("sucesso") ? "text-emerald-800" : "text-red-700",
              )}
            >
              {submitMsg}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink-900">Histórico</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {loadError ? <p className="mt-4 text-sm font-medium text-red-700">{loadError}</p> : null}

        {list === null ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : list.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-600">Nenhuma venda registrada.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="py-3 pr-3">Data</th>
                  <th className="py-3 pr-3">Paciente</th>
                  <th className="py-3 pr-3">Produto</th>
                  <th className="py-3 pr-3">Valor</th>
                  <th className="py-3 pr-3">Pagamento</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3">Vendedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap py-3 pr-3 text-ink-600">
                      {formatDateTimePtBR(s.createdAt)}
                    </td>
                    <td className="py-3 pr-3 font-medium text-ink-900">{s.patient?.name ?? "—"}</td>
                    <td className="max-w-[200px] truncate py-3 pr-3 text-ink-700" title={s.product ?? ""}>
                      {s.product ?? "—"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 font-semibold text-ink-900">
                      {formatCentsBRL(s.totalCents)}
                    </td>
                    <td className="py-3 pr-3 text-ink-600">{paymentLabel(s.paymentMethod)}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          statusBadgeClass(s.status),
                        )}
                      >
                        {statusLabel(s.status)}
                      </span>
                    </td>
                    <td className="py-3 text-ink-600">{s.seller.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
