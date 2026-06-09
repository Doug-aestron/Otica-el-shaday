"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCpfDisplay, formatDateOnlyPtBR, toDateInputValue } from "@/lib/formatting";
import { Loader2, RefreshCw, ShoppingBag, Stethoscope, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  canActAsAssignedDoctor,
  canEditClinicalNotes,
  canFinalizeAppointment,
  canStartAppointment,
} from "@/lib/appointment-access";
import {
  consultationDurationSeconds,
  formatConsultationDuration,
} from "@/lib/consultation-duration";
import { appointmentsListUrl, QUEUE_STATUS_FILTER } from "@/lib/appointments-query";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { usePatientSearch } from "@/lib/hooks/use-patient-search";
import { sortAppointmentRows, upsertAppointmentRow } from "@/lib/merge-appointment-rows";

type PatientMini = { id: string; name: string; phone: string | null; cpf: string | null };

type MedicalSnapshot = {
  id: string;
  diagnosis: string | null;
  clinicalNotes: string | null;
  conduct: string | null;
  followUpAt: Date | string | null;
} | null;

import type { AppointmentRow } from "@/lib/appointment-types";

export type { AppointmentRow } from "@/lib/appointment-types";

const QUEUE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.AGUARDANDO,
  AppointmentStatus.EM_ATENDIMENTO,
  AppointmentStatus.FINALIZADO,
  AppointmentStatus.CANCELADO,
];

const STATUS_ORDER: Record<AppointmentStatus, number> = {
  [AppointmentStatus.PENDENTE]: 99,
  [AppointmentStatus.CONFIRMADO]: 99,
  [AppointmentStatus.REALIZADO]: 99,
  [AppointmentStatus.AGUARDANDO]: 0,
  [AppointmentStatus.EM_ATENDIMENTO]: 1,
  [AppointmentStatus.FINALIZADO]: 2,
  [AppointmentStatus.CANCELADO]: 3,
};

function statusLabel(s: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDENTE]: "Pendente",
    [AppointmentStatus.CONFIRMADO]: "Confirmado",
    [AppointmentStatus.REALIZADO]: "Realizado",
    [AppointmentStatus.AGUARDANDO]: "Aguardando",
    [AppointmentStatus.EM_ATENDIMENTO]: "Em atendimento",
    [AppointmentStatus.FINALIZADO]: "Finalizado",
    [AppointmentStatus.CANCELADO]: "Cancelado",
  };
  return map[s];
}

function statusBadgeClass(s: AppointmentStatus): string {
  switch (s) {
    case AppointmentStatus.PENDENTE:
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case AppointmentStatus.CONFIRMADO:
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case AppointmentStatus.REALIZADO:
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case AppointmentStatus.AGUARDANDO:
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case AppointmentStatus.EM_ATENDIMENTO:
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case AppointmentStatus.FINALIZADO:
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

type Props = {
  role: Role;
  userId: string;
  canRegisterSale?: boolean;
};

const POLL_MS = 30_000;
const POLL_BACKGROUND_MS = 120_000;
const CLOCK_MS = 5_000;

export function AtendimentoPanel({ role, userId, canRegisterSale = false }: Props) {
  const canOpen = role === Role.RECEPCAO || role === Role.ADMIN;
  const canStart = canStartAppointment(role);
  const canFinalize = canFinalizeAppointment(role);
  const isMedico = role === Role.MEDICO;
  const [clockTick, setClockTick] = useState(0);

  const [list, setList] = useState<AppointmentRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [patientQuery, setPatientQuery] = useState("");
  const { hits: searchHits } = usePatientSearch(patientQuery);
  const [pickedPatient, setPickedPatient] = useState<{
    id: string;
    name: string;
    cpf: string | null;
    phone: string | null;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [openSubmitting, setOpenSubmitting] = useState(false);
  const [openMsg, setOpenMsg] = useState<string | null>(null);

  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [conduct, setConduct] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [consultMsg, setConsultMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    setRefreshing(true);
    try {
      const res = await fetch(appointmentsListUrl(QUEUE_STATUS_FILTER, "queue"), {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(typeof data.error === "string" ? data.error : "Erro ao carregar fila.");
        return;
      }
      const raw = data.appointments as AppointmentRow[];
      const rows = raw.filter((a) => QUEUE_STATUSES.includes(a.status));
      setList(sortAppointmentRows(rows));
    } catch {
      setLoadError("Falha de conexão.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useVisiblePolling(() => refresh(), {
    intervalMs: POLL_MS,
    backgroundIntervalMs: POLL_BACKGROUND_MS,
  });

  const selected = useMemo(
    () => (selectedId ? list?.find((a) => a.id === selectedId) ?? null : null),
    [list, selectedId],
  );

  useEffect(() => {
    const hasActive = list?.some((a) => a.status === AppointmentStatus.EM_ATENDIMENTO);
    if (!hasActive && selected?.status !== AppointmentStatus.EM_ATENDIMENTO) return;
    const t = setInterval(() => setClockTick((n) => n + 1), CLOCK_MS);
    return () => clearInterval(t);
  }, [list, selected?.status]);

  useEffect(() => {
    if (!selected) {
      setClinicalNotes("");
      setDiagnosis("");
      setConduct("");
      setFollowUpAt("");
      setConsultMsg(null);
      return;
    }
    const mr = selected.medicalRecord ?? null;
    setClinicalNotes(mr?.clinicalNotes ?? "");
    setDiagnosis(mr?.diagnosis ?? "");
    setConduct(mr?.conduct ?? "");
    setFollowUpAt(mr?.followUpAt ? toDateInputValue(mr.followUpAt) : "");
  }, [selected]);

  async function openAppointment() {
    if (!pickedPatient) {
      setOpenMsg("Selecione um paciente na lista.");
      return;
    }
    setOpenMsg(null);
    setOpenSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: pickedPatient.id,
          reason: reason.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOpenMsg(typeof data.error === "string" ? data.error : "Não foi possível abrir atendimento.");
        setOpenSubmitting(false);
        return;
      }
      setPickedPatient(null);
      setPatientQuery("");
      setReason("");
      await refresh();
      const created = data.appointment as AppointmentRow;
      if (created?.id) setSelectedId(created.id);
      setOpenSubmitting(false);
    } catch {
      setOpenMsg("Erro de conexão.");
      setOpenSubmitting(false);
    }
  }

  function buildClinicalBody() {
    return {
      status: AppointmentStatus.EM_ATENDIMENTO,
      clinicalNotes: clinicalNotes.trim() || null,
      diagnosis: diagnosis.trim() || null,
      conduct: conduct.trim() || null,
      followUpAt: followUpAt || null,
    };
  }

  function buildFinalizeBody() {
    return {
      status: AppointmentStatus.FINALIZADO,
      clinicalNotes: clinicalNotes.trim() || null,
      diagnosis: diagnosis.trim() || null,
      conduct: conduct.trim() || null,
      followUpAt: followUpAt || null,
    };
  }

  function canEditRow(a: AppointmentRow): boolean {
    return canEditClinicalNotes(role, { status: a.status, doctorId: a.doctorId ?? a.doctor?.id ?? null }, userId);
  }

  function canFinalizeRow(a: AppointmentRow): boolean {
    return canFinalize && canActAsAssignedDoctor(role, { status: a.status, doctorId: a.doctorId ?? a.doctor?.id ?? null }, userId);
  }

  function apiErrorMessage(data: Record<string, unknown>, fallback: string): string {
    if (typeof data.error === "string") return data.error;
    const details = data.details as Record<string, string[] | undefined> | undefined;
    if (details && typeof details === "object") {
      const first = Object.values(details).flat().find((m) => typeof m === "string");
      if (first) return first;
    }
    return fallback;
  }

  function elapsedLabel(a: AppointmentRow): string | null {
    void clockTick;
    if (a.status === AppointmentStatus.EM_ATENDIMENTO && a.consultationStartedAt) {
      const sec = consultationDurationSeconds(a.consultationStartedAt, new Date());
      return sec != null ? formatConsultationDuration(sec) : null;
    }
    if (a.status === AppointmentStatus.FINALIZADO) {
      const sec = consultationDurationSeconds(a.consultationStartedAt, a.consultationEndedAt);
      return sec != null ? formatConsultationDuration(sec) : null;
    }
    return null;
  }

  async function putStatus(
    id: string,
    body: Record<string, unknown>,
    actionKey: string,
  ) {
    setConsultMsg(null);
    setActionLoading(actionKey);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setConsultMsg(apiErrorMessage(data, "Ação não permitida."));
        setActionLoading(null);
        return;
      }
      const updated = data.appointment as AppointmentRow | undefined;
      if (updated?.id) {
        setList((prev) => upsertAppointmentRow(prev, updated));
        setSelectedId(updated.id);
      } else {
        await refresh();
        if (body.status === AppointmentStatus.EM_ATENDIMENTO) {
          setSelectedId(id);
        }
      }
      if (body.status === AppointmentStatus.FINALIZADO) {
        setSelectedId(null);
      }
      setActionLoading(null);
    } catch {
      setConsultMsg("Erro de conexão.");
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          A fila atualiza automaticamente a cada {POLL_MS / 1000}s.{" "}
          <button
            type="button"
            className="font-semibold text-brand-700 hover:underline"
            onClick={() => refresh()}
          >
            Atualizar agora
          </button>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => refresh()} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Atualizando…" : "Sincronizar"}
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {loadError}
        </div>
      ) : null}

      {!canStart ? (
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
          <strong>Iniciar consulta:</strong> somente o perfil <strong>médico</strong> pode mudar o paciente para{" "}
          <em>Em atendimento</em>. Recepção e administração apenas colocam o paciente na fila (
          <em>Aguardando</em>).
        </div>
      ) : null}

      {canOpen ? (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">Recepção — enviar paciente à fila</h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">Busque o paciente e abra um atendimento com status Aguardando.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="patientSearch">Paciente</Label>
              <Input
                id="patientSearch"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  if (pickedPatient && e.target.value !== pickedPatient.name) setPickedPatient(null);
                }}
                placeholder="Digite nome, CPF ou telefone…"
                autoComplete="off"
              />
              {pickedPatient ? (
                <p className="text-xs font-semibold text-emerald-800">
                  Selecionado: {pickedPatient.name} · {formatCpfDisplay(pickedPatient.cpf)}
                </p>
              ) : null}
              {searchHits.length > 0 && !pickedPatient ? (
                <ul className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 text-sm shadow-sm">
                  {searchHits.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white"
                        onClick={() => {
                          setPickedPatient(p);
                          setPatientQuery(p.name);
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Motivo / observação (opcional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: consulta de rotina, retorno…"
              />
            </div>
          </div>
          {openMsg ? (
            <p className="mt-3 text-sm font-medium text-red-700">{openMsg}</p>
          ) : null}
          <div className="mt-4">
            <Button type="button" onClick={() => openAppointment()} disabled={openSubmitting}>
              {openSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                "Colocar na fila (Aguardando)"
              )}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">Fila de atendimento</h2>
        </div>

        {list === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : list.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-600">Nenhum registro na fila.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="py-3 pr-3">Paciente</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Médico</th>
                  <th className="py-3 pr-3">Horário</th>
                  <th className="py-3 pr-3">Duração</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((a) => (
                  <tr
                    key={a.id}
                    className={cn("hover:bg-slate-50/80", selectedId === a.id && "bg-brand-50/60")}
                  >
                    <td className="py-3 pr-3 font-medium text-ink-900">
                      <button
                        type="button"
                        className="text-left hover:text-brand-800"
                        onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
                      >
                        {a.patient.name}
                      </button>
                      <div className="text-xs font-normal text-ink-500">
                        {formatCpfDisplay(a.patient.cpf)} · {a.patient.phone || "—"}
                      </div>
                      <Link
                        href={`/painel/pacientes/${a.patient.id}`}
                        className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Ver ficha
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          statusBadgeClass(a.status),
                        )}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-ink-700">{a.doctor?.name ?? "—"}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-ink-600">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(a.startsAt))}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-ink-600">
                      {elapsedLabel(a) ?? "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canStart && a.status === AppointmentStatus.AGUARDANDO ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={actionLoading === `start-${a.id}`}
                            onClick={() =>
                              putStatus(a.id, { status: AppointmentStatus.EM_ATENDIMENTO }, `start-${a.id}`)
                            }
                          >
                            Iniciar atendimento
                          </Button>
                        ) : null}
                        {canFinalizeRow(a) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={actionLoading === `fin-row-${a.id}`}
                            onClick={() => {
                              if (selectedId !== a.id) setSelectedId(a.id);
                              void putStatus(a.id, buildFinalizeBody(), `fin-row-${a.id}`);
                            }}
                          >
                            Finalizar atendimento
                          </Button>
                        ) : null}
                        {(() => {
                          const showCancel =
                            (role === Role.RECEPCAO && a.status === AppointmentStatus.AGUARDANDO) ||
                            (role === Role.ADMIN &&
                              a.status !== AppointmentStatus.FINALIZADO &&
                              a.status !== AppointmentStatus.CANCELADO);
                          if (!showCancel) return null;
                          return (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === `cancel-${a.id}`}
                              onClick={() =>
                                putStatus(a.id, { status: AppointmentStatus.CANCELADO }, `cancel-${a.id}`)
                              }
                            >
                              Cancelar
                            </Button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (selected.status === AppointmentStatus.EM_ATENDIMENTO || selected.status === AppointmentStatus.FINALIZADO) ? (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Consulta — {selected.patient.name}
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            {selected.status === AppointmentStatus.FINALIZADO
              ? `Atendimento finalizado${
                  elapsedLabel(selected) ? ` · duração: ${elapsedLabel(selected)}` : ""
                }. Registro abaixo é somente leitura.`
              : canEditRow(selected)
                ? `Preencha os campos clínicos e finalize quando concluir.${
                    elapsedLabel(selected) ? ` Tempo em consulta: ${elapsedLabel(selected)}.` : ""
                  }`
                : isMedico
                  ? "Inicie o atendimento deste paciente ou selecione a consulta que você assumiu para preencher o prontuário."
                  : "A consulta clínica é registrada pelo médico responsável pelo atendimento."}
          </p>

          {consultMsg ? (
            <p className="mt-3 text-sm font-medium text-red-700">{consultMsg}</p>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clinicalNotes">Observações clínicas</Label>
              <Textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                readOnly={selected.status === AppointmentStatus.FINALIZADO || !canEditRow(selected)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
                readOnly={selected.status === AppointmentStatus.FINALIZADO || !canEditRow(selected)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="conduct">Conduta</Label>
              <Textarea
                id="conduct"
                value={conduct}
                onChange={(e) => setConduct(e.target.value)}
                rows={2}
                readOnly={selected.status === AppointmentStatus.FINALIZADO || !canEditRow(selected)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpAt">Retorno recomendado</Label>
              <Input
                id="followUpAt"
                type="date"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                readOnly={selected.status === AppointmentStatus.FINALIZADO || !canEditRow(selected)}
              />
            </div>
          </div>

          {selected.status === AppointmentStatus.EM_ATENDIMENTO && canEditRow(selected) ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!!actionLoading}
                onClick={() => putStatus(selected.id, buildClinicalBody(), `save-${selected.id}`)}
              >
                {actionLoading === `save-${selected.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar anotações"
                )}
              </Button>
              <Button
                type="button"
                disabled={!!actionLoading}
                onClick={() => putStatus(selected.id, buildFinalizeBody(), `fin-${selected.id}`)}
              >
                {actionLoading === `fin-${selected.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizando…
                  </>
                ) : (
                  "Finalizar atendimento"
                )}
              </Button>
            </div>
          ) : null}

          {selected.status === AppointmentStatus.FINALIZADO && selected.medicalRecord ? (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-ink-700">
              <p className="font-semibold text-ink-900">Registro gravado</p>
              {selected.medicalRecord.followUpAt ? (
                <p className="mt-1">Retorno sugerido: {formatDateOnlyPtBR(selected.medicalRecord.followUpAt)}</p>
              ) : null}
            </div>
          ) : null}

          {selected.status === AppointmentStatus.FINALIZADO && canRegisterSale ? (
            <div className="mt-4">
              <Link
                href={`/painel/vendas?patientId=${selected.patient.id}&appointmentId=${selected.id}`}
                className={buttonClassName({ variant: "outline", className: "inline-flex" })}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Registrar venda
              </Link>
            </div>
          ) : null}

          {selected.status === AppointmentStatus.EM_ATENDIMENTO && isMedico && !canEditRow(selected) ? (
            <p className="mt-4 text-sm font-medium text-amber-800">
              Este atendimento está com outro médico. Clique em <strong>Iniciar atendimento</strong> em um paciente
              aguardando na fila para assumir a consulta.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
