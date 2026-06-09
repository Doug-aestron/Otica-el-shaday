"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonClassName } from "@/components/ui/button";
import { formatCpfDisplay, formatDateOnlyPtBR } from "@/lib/formatting";

export type PatientRow = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  createdAt: string;
  _count: { anamneses: number };
};

type Props = {
  canCreate: boolean;
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function PatientList({ canCreate }: Props) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 350);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const load = useCallback(async (search: string) => {
    const q = search.trim();
    if (q.length < 2) {
      setPatients([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    setHasSearched(true);
    try {
      const url = new URL("/api/patients", window.location.origin);
      url.searchParams.set("q", q);
      const res = await fetch(url.toString(), { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Falha ao carregar pacientes.");
        setPatients([]);
        return;
      }
      setPatients(data.patients as PatientRow[]);
    } catch {
      setError("Não foi possível conectar. Verifique sua rede.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(debouncedQ);
  }, [debouncedQ, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone…"
            className="pl-10"
            aria-label="Buscar pacientes"
          />
        </div>
        {canCreate ? (
          <Link href="/painel/pacientes/novo" className={buttonClassName()}>
            <Plus className="h-4 w-4" />
            Novo paciente
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-ink-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : !hasSearched ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-ink-300" />
          <p className="mt-4 font-display text-lg font-semibold text-ink-900">Buscar pacientes</p>
          <p className="mt-2 text-sm text-ink-600">Digite pelo menos 2 caracteres (nome, CPF ou telefone) para listar.</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-ink-300" />
          <p className="mt-4 font-display text-lg font-semibold text-ink-900">Nenhum paciente encontrado</p>
          <p className="mt-2 text-sm text-ink-600">Tente outro termo de busca.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3 hidden md:table-cell">Nascimento</th>
                  <th className="px-4 py-3">Anamneses</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                    <td className="px-4 py-3 text-ink-600">{formatCpfDisplay(p.cpf)}</td>
                    <td className="px-4 py-3 text-ink-600">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-ink-600 hidden md:table-cell">
                      {p.birthDate ? formatDateOnlyPtBR(p.birthDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{p._count.anamneses}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/painel/pacientes/${p.id}`}
                        className="font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
