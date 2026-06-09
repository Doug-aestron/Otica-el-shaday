"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppointmentStatus, Role } from "@prisma/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { canManageAgendaSchedule } from "@/lib/appointment-access";
import type { AppointmentRow } from "@/lib/appointment-types";
import { appointmentsListUrl, AGENDA_STATUS_FILTER } from "@/lib/appointments-query";
import { useVisiblePolling } from "@/lib/hooks/use-visible-polling";
import { sortAppointmentRows } from "@/lib/merge-appointment-rows";
import { formatCpfDisplay } from "@/lib/formatting";

const SORT_STATUS: Record<AppointmentStatus, number> = {
  [AppointmentStatus.PENDENTE]: 0,
  [AppointmentStatus.CONFIRMADO]: 1,
  [AppointmentStatus.AGUARDANDO]: 2,
  [AppointmentStatus.EM_ATENDIMENTO]: 3,
  [AppointmentStatus.REALIZADO]: 4,
  [AppointmentStatus.FINALIZADO]: 5,
  [AppointmentStatus.CANCELADO]: 6,
};

function statusLabel(s: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDENTE]: "Pendente",
    [AppointmentStatus.CONFIRMADO]: "Confirmado",
    [AppointmentStatus.REALIZADO]: "Realizado",
    [AppointmentStatus.AGUARDANDO]: "Aguardando (fila)",
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
      return "bg-violet-100 text-violet-900 ring-violet-200";
    case AppointmentStatus.EM_ATENDIMENTO:
      return "bg-sky-100 text-sky-900 ring-sky-200";
    case AppointmentStatus.FINALIZADO:
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

type Props = { role: Role };

const POLL_MS = 45_000;
const POLL_BACKGROUND_MS = 120_000;

export function AgendaPanel({ role }: Props) {
  const canAct = canManageAgendaSchedule(role);
  const [list, setList] = useState<AppointmentRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    setRefreshing(true);
    try {
      const res = await fetch(appointmentsListUrl(AGENDA_STATUS_FILTER, "agenda"), {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(typeof data.error === "string" ? data.error : "Erro ao carregar agenda.");
        return;
      }
      const rows = data.appointments as AppointmentRow[];
      setList(
        sortAppointmentRows(rows).sort(
          (a, b) =>
            SORT_STATUS[a.status] - SORT_STATUS[b.status] ||
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
      );
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

  useVisiblePolling(() => refresh(), {
    intervalMs: POLL_MS,
    backgroundIntervalMs: POLL_BACKGROUND_MS,
  });

  async function putStatus(id: string, status: AppointmentStatus, actionKey: string) {
    setToast(null);
    setActionLoading(actionKey);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(typeof data.error === "string" ? data.error : "Ação não permitida.");
        setActionLoading(null);
        return;
      }
      await refresh();
      setActionLoading(null);
    } catch {
      setToast("Erro de conexão.");
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Pedidos do site e agendamentos internos. Atualização a cada {POLL_MS / 1000}s.{" "}
          <Link href="/painel/atendimento" className="font-semibold text-brand-700 hover:underline">
            Ver fila de atendimento
          </Link>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {refreshing ? "Atualizando…" : "Sincronizar"}
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {loadError}
        </div>
      ) : null}
      {toast ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {toast}
        </div>
      ) : null}

      {list === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-ink-600">Nenhum agendamento encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Paciente</th>
                <th className="py-3 pr-3">Data</th>
                <th className="py-3 pr-3">Motivo</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80">
                  <td className="py-3 pl-4 pr-3">
                    <p className="font-medium text-ink-900">{a.patient.name}</p>
                    <p className="text-xs text-ink-500">
                      {formatCpfDisplay(a.patient.cpf)} · {a.patient.phone || "—"}
                    </p>
                    <Link
                      href={`/painel/pacientes/${a.patient.id}`}
                      className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Ficha
                    </Link>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-3 text-ink-700">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(a.startsAt))}
                  </td>
                  <td className="max-w-[220px] truncate py-3 pr-3 text-ink-600" title={a.reason ?? ""}>
                    {a.reason || "—"}
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
                  <td className="py-3 pr-4 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canAct && a.status === AppointmentStatus.PENDENTE ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!!actionLoading}
                            onClick={() => void putStatus(a.id, AppointmentStatus.CONFIRMADO, `cf-${a.id}`)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!!actionLoading}
                            onClick={() => void putStatus(a.id, AppointmentStatus.CANCELADO, `cx-${a.id}`)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : null}
                      {canAct && a.status === AppointmentStatus.CONFIRMADO ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!!actionLoading}
                            onClick={() => void putStatus(a.id, AppointmentStatus.AGUARDANDO, `fq-${a.id}`)}
                          >
                            Enviar à fila (aguardando)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!!actionLoading}
                            onClick={() => void putStatus(a.id, AppointmentStatus.REALIZADO, `ok-${a.id}`)}
                          >
                            Realizado
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!!actionLoading}
                            onClick={() => void putStatus(a.id, AppointmentStatus.CANCELADO, `cx2-${a.id}`)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : null}
                      {!canAct &&
                      (a.status === AppointmentStatus.PENDENTE || a.status === AppointmentStatus.CONFIRMADO) ? (
                        <span className="text-xs text-ink-500">Somente recepção/admin</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
