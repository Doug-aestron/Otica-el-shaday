"use client";

import { useCallback, useEffect, useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { auditActionLabel } from "@/lib/audit";
import { formatDateTimePtBR } from "@/lib/formatting";
import { roleLabel } from "@/lib/role-label";
import { Loader2, RefreshCw, Shield } from "lucide-react";
import { cn } from "@/lib/cn";

type AuditLogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: Role } | null;
};

export function AuditoriaPanel() {
  const [logs, setLogs] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/audit-logs", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao carregar auditoria.");
        setLogs([]);
        return;
      }
      setLogs(data.logs as AuditLogRow[]);
    } catch {
      setError("Falha de conexão.");
      setLogs([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <Shield className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Trilha de eventos</p>
            <p className="text-xs text-ink-600">
              Registros de criação/edição de pacientes, atendimentos e receitas. Dados sensíveis não são duplicados nos metadados.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {logs === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center text-sm text-ink-600">Nenhum evento registrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Data</th>
                <th className="py-3 pr-3">Ação</th>
                <th className="py-3 pr-3">Usuário</th>
                <th className="py-3 pr-3">Entidade</th>
                <th className="py-3 pr-3">Detalhes</th>
                <th className="py-3 pr-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap py-3 pl-4 pr-3 text-ink-600">
                    {formatDateTimePtBR(log.createdAt)}
                  </td>
                  <td className="py-3 pr-3 font-medium text-ink-900">{auditActionLabel(log.action)}</td>
                  <td className="py-3 pr-3 text-ink-700">
                    {log.user ? (
                      <>
                        <span className="font-medium">{log.user.name}</span>
                        <span className="block text-xs text-ink-500">
                          {roleLabel(log.user.role)} · {log.user.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-500">Sistema</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-ink-600">
                    <span className="font-mono text-xs">{log.entity}</span>
                    {log.entityId ? (
                      <span className="mt-0.5 block truncate font-mono text-xs text-ink-400" title={log.entityId}>
                        {log.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[240px] py-3 pr-3 text-xs text-ink-600">
                    {log.metadata && typeof log.metadata === "object"
                      ? formatMetadata(log.metadata as Record<string, unknown>)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-ink-500">{log.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatMetadata(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof meta.patientName === "string") parts.push(`Paciente: ${meta.patientName}`);
  if (typeof meta.status === "string") parts.push(`Status: ${meta.status}`);
  if (typeof meta.fields === "string") parts.push(`Campos: ${meta.fields}`);
  if (parts.length > 0) return parts.join(" · ");
  return JSON.stringify(meta).slice(0, 120);
}
