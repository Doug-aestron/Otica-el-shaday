"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COST_TYPE, costTypeLabel, type CostTypeValue } from "@/lib/cost-type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { centsToReaisInput, formatCentsBRL } from "@/lib/formatting-money";
import { formatDateTimePtBR } from "@/lib/formatting";
import { COST_CATEGORIES } from "@/lib/validation/finance";
import {
  BarChart3,
  FileSpreadsheet,
  Loader2,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

type TabId = "dashboard" | "costs" | "demonstrativo";

type Summary = {
  period: { from: string; to: string; label: string };
  receitasCents: number;
  vendasCount: number;
  orcamentosCents: number;
  orcamentosCount: number;
  custosCents: number;
  custosFixosCents: number;
  custosVariaveisCents: number;
  custosCount: number;
  lucroCents: number;
  margemPercent: number | null;
};

type CostRow = {
  id: string;
  description: string;
  amountCents: number;
  type: CostTypeValue;
  category: string | null;
  referenceAt: string;
  notes: string | null;
  createdBy: { id: string; name: string };
};

type Demonstrativo = Summary & {
  receitas: Array<{
    id: string;
    createdAt: string;
    totalCents: number;
    product: string | null;
    paymentMethod: string | null;
    patientName: string | null;
  }>;
  custosFixos: Array<{
    id: string;
    referenceAt: string;
    description: string;
    amountCents: number;
    category: string | null;
  }>;
  custosVariaveis: Array<{
    id: string;
    referenceAt: string;
    description: string;
    amountCents: number;
    category: string | null;
  }>;
};

function referenceAtToInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  return {
    from: `${y}-${String(m).padStart(2, "0")}-01`,
    to: `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`,
  };
}

const TABS: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "costs", label: "Custos", icon: Receipt },
  { id: "demonstrativo", label: "Demonstrativo", icon: FileSpreadsheet },
];

export function FinancePanel() {
  const defaults = useMemo(() => defaultMonthRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [tab, setTab] = useState<TabId>("dashboard");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [demonstrativo, setDemonstrativo] = useState<Demonstrativo | null>(null);
  const [costs, setCosts] = useState<CostRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [costType, setCostType] = useState<CostTypeValue>(COST_TYPE.FIXO);
  const [category, setCategory] = useState<string>(COST_CATEGORIES[0]);
  const [referenceAt, setReferenceAt] = useState(defaults.from);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  function resetCostForm() {
    setEditingId(null);
    setDesc("");
    setValor("");
    setCostType(COST_TYPE.FIXO);
    setCategory(COST_CATEGORIES[0]);
    setReferenceAt(defaults.from);
    setNotes("");
  }

  function startEditCost(c: CostRow) {
    setEditingId(c.id);
    setDesc(c.description);
    setValor(centsToReaisInput(c.amountCents));
    setCostType(c.type);
    setCategory(c.category ?? COST_CATEGORIES[0]);
    setReferenceAt(referenceAtToInput(c.referenceAt));
    setNotes(c.notes ?? "");
    setFormMsg(null);
  }

  const periodQs = useMemo(() => {
    const p = new URLSearchParams({ from, to });
    return p.toString();
  }, [from, to]);

  const loadSummary = useCallback(async () => {
    const res = await fetch(`/api/finance/summary?${periodQs}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro no resumo.");
    setSummary(data.summary as Summary);
  }, [periodQs]);

  const loadCosts = useCallback(async () => {
    const res = await fetch(`/api/finance/costs?${periodQs}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao carregar custos.");
    setCosts(data.costs as CostRow[]);
  }, [periodQs]);

  const loadDemonstrativo = useCallback(async () => {
    const res = await fetch(`/api/finance/demonstrativo?${periodQs}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro no demonstrativo.");
    setDemonstrativo(data.demonstrativo as Demonstrativo);
  }, [periodQs]);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (tab === "dashboard") await loadSummary();
      else if (tab === "costs") await Promise.all([loadCosts(), loadSummary()]);
      else await loadDemonstrativo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }, [tab, loadSummary, loadCosts, loadDemonstrativo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitCost(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    setSubmitting(true);
    const payload = {
      description: desc,
      valor,
      type: costType,
      category,
      referenceAt,
      notes: notes.trim() || null,
    };
    try {
      const url = editingId ? `/api/finance/costs/${editingId}` : "/api/finance/costs";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data.details && typeof data.details === "object"
            ? Object.values(data.details as Record<string, string[]>)
                .flat()
                .join(" ")
            : null;
        setFormMsg(detail || (typeof data.error === "string" ? data.error : "Não foi possível salvar."));
        setSubmitting(false);
        return;
      }
      const wasEdit = !!editingId;
      resetCostForm();
      setFormMsg(wasEdit ? "Custo atualizado." : "Custo registrado.");
      await Promise.all([loadCosts(), loadSummary()]);
      setSubmitting(false);
    } catch {
      setFormMsg("Erro de conexão.");
      setSubmitting(false);
    }
  }

  async function deleteCost(id: string) {
    if (!confirm("Excluir este custo?")) return;
    const res = await fetch(`/api/finance/costs/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      if (editingId === id) resetCostForm();
      void refresh();
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="rounded-3xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        Módulo exclusivo da <strong>administração</strong>. Receitas vêm de vendas com status{" "}
        <strong>Vendido</strong>; custos são lançados manualmente (fixos e variáveis).
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="fin-from">De</Label>
          <Input id="fin-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fin-to">Até</Label>
          <Input id="fin-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Aplicar período
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-600 hover:bg-slate-100",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {tab === "dashboard" && (
        <DashboardTab summary={summary} loading={loading} />
      )}

      {tab === "costs" && (
        <CostsTab
          summary={summary}
          costs={costs}
          loading={loading}
          desc={desc}
          setDesc={setDesc}
          valor={valor}
          setValor={setValor}
          costType={costType}
          setCostType={setCostType}
          category={category}
          setCategory={setCategory}
          referenceAt={referenceAt}
          setReferenceAt={setReferenceAt}
          notes={notes}
          setNotes={setNotes}
          submitting={submitting}
          formMsg={formMsg}
          editingId={editingId}
          onSubmit={submitCost}
          onCancelEdit={resetCostForm}
          onStartEdit={startEditCost}
          onDelete={deleteCost}
        />
      )}

      {tab === "demonstrativo" && (
        <DemonstrativoTab data={demonstrativo} loading={loading} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Wallet;
  variant?: "default" | "positive" | "negative";
}) {
  const colors =
    variant === "positive"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : variant === "negative"
        ? "bg-red-50 text-red-900 ring-red-200"
        : "bg-white text-ink-900 ring-slate-200";
  return (
    <article className={cn("rounded-3xl border p-6 shadow-sm ring-1 ring-inset", colors)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold opacity-80">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
        </div>
        <Icon className="h-8 w-8 opacity-40" aria-hidden />
      </div>
    </article>
  );
}

function DashboardTab({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  if (loading && !summary) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-600">Período: {summary.period.label}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Receitas"
          value={formatCentsBRL(summary.receitasCents)}
          hint={`${summary.vendasCount} venda(s) confirmada(s)`}
          icon={TrendingUp}
          variant="positive"
        />
        <StatCard
          label="Custos totais"
          value={formatCentsBRL(summary.custosCents)}
          hint={`Fixos ${formatCentsBRL(summary.custosFixosCents)} · Variáveis ${formatCentsBRL(summary.custosVariaveisCents)}`}
          icon={TrendingDown}
          variant="negative"
        />
        <StatCard
          label="Resultado (lucro)"
          value={formatCentsBRL(summary.lucroCents)}
          hint={
            summary.margemPercent !== null
              ? `Margem ${summary.margemPercent}%`
              : "Sem receitas no período"
          }
          icon={PiggyBank}
          variant={summary.lucroCents >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Orçamentos em aberto"
          value={formatCentsBRL(summary.orcamentosCents)}
          hint={`${summary.orcamentosCount} orçamento(s) — não entram na receita`}
          icon={Wallet}
        />
        <StatCard
          label="Lançamentos de custo"
          value={String(summary.custosCount)}
          hint="Registros no período"
          icon={Receipt}
        />
      </div>
    </div>
  );
}

function CostsTab(props: {
  summary: Summary | null;
  costs: CostRow[] | null;
  loading: boolean;
  desc: string;
  setDesc: (v: string) => void;
  valor: string;
  setValor: (v: string) => void;
  costType: CostTypeValue;
  setCostType: (v: CostTypeValue) => void;
  category: string;
  setCategory: (v: string) => void;
  referenceAt: string;
  setReferenceAt: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  editingId: string | null;
  submitting: boolean;
  formMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onStartEdit: (c: CostRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section
        className={cn(
          "rounded-3xl border bg-white p-6 shadow-sm",
          props.editingId ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200/80",
        )}
      >
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {props.editingId ? "Editar custo" : "Novo custo"}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {props.editingId
            ? "Altere os valores e salve. O demonstrativo e o dashboard serão recalculados."
            : (
              <>
                <strong>Fixo:</strong> despesa recorrente (aluguel, folha). <strong>Variável:</strong> despesa pontual do período.
              </>
            )}
        </p>
        <form onSubmit={props.onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cost-desc">Descrição</Label>
            <Input id="cost-desc" value={props.desc} onChange={(e) => props.setDesc(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cost-valor">Valor (R$)</Label>
              <Input
                id="cost-valor"
                value={props.valor}
                onChange={(e) => props.setValor(e.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-ref">Competência / data</Label>
              <Input
                id="cost-ref"
                type="date"
                value={props.referenceAt}
                onChange={(e) => props.setReferenceAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cost-type">Tipo</Label>
              <select
                id="cost-type"
                value={props.costType}
                onChange={(e) => props.setCostType(e.target.value as CostTypeValue)}
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                <option value={COST_TYPE.FIXO}>Custo fixo</option>
                <option value={COST_TYPE.VARIAVEL}>Custo variável</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-cat">Categoria</Label>
              <select
                id="cost-cat"
                value={props.category}
                onChange={(e) => props.setCategory(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                {COST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost-notes">Observações</Label>
            <Textarea id="cost-notes" value={props.notes} onChange={(e) => props.setNotes(e.target.value)} rows={2} />
          </div>
          {props.formMsg ? (
            <p
              className={cn(
                "text-sm font-medium",
                props.formMsg.includes("registrado") || props.formMsg.includes("atualizado")
                  ? "text-emerald-800"
                  : "text-red-700",
              )}
            >
              {props.formMsg}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={props.submitting}>
              {props.submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : props.editingId ? (
                "Salvar alterações"
              ) : (
                "Registrar custo"
              )}
            </Button>
            {props.editingId ? (
              <Button type="button" variant="outline" disabled={props.submitting} onClick={props.onCancelEdit}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink-900">Custos do período</h2>
        {props.summary ? (
          <p className="mt-1 text-sm text-ink-600">
            Total: {formatCentsBRL(props.summary.custosCents)} ({props.summary.custosCount} lançamentos)
          </p>
        ) : null}
        {props.loading && !props.costs ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : !props.costs?.length ? (
          <p className="mt-6 text-sm text-ink-600">Nenhum custo no período.</p>
        ) : (
          <ul className="mt-4 max-h-[520px] space-y-2 overflow-auto">
            {props.costs.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border px-3 py-3 text-sm",
                  props.editingId === c.id
                    ? "border-brand-300 bg-brand-50/80"
                    : "border-slate-100 bg-slate-50/80",
                )}
              >
                <div>
                  <p className="font-medium text-ink-900">{c.description}</p>
                  <p className="text-xs text-ink-500">
                    {costTypeLabel(c.type)} · {c.category ?? "—"} ·{" "}
                    {new Date(c.referenceAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink-900">{formatCentsBRL(c.amountCents)}</p>
                  <div className="mt-1 flex flex-col items-end gap-0.5">
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-700 hover:underline"
                      onClick={() => props.onStartEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-700 hover:underline"
                      onClick={() => props.onDelete(c.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DemonstrativoTab({ data, loading }: { data: Demonstrativo | null; loading: boolean }) {
  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-800 to-ink-900 p-6 text-white shadow-sm sm:p-8">
        <h2 className="font-display text-xl font-semibold">Demonstrativo do período</h2>
        <p className="mt-1 text-sm text-slate-300">{data.period.label}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Receitas</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCentsBRL(data.receitasCents)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Custos</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCentsBRL(data.custosCents)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Resultado</dt>
            <dd
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                data.lucroCents >= 0 ? "text-emerald-300" : "text-red-300",
              )}
            >
              {formatCentsBRL(data.lucroCents)}
            </dd>
          </div>
        </dl>
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-emerald-800">Receitas (vendas)</h3>
        {data.receitas.length === 0 ? (
          <p className="mt-4 text-sm text-ink-600">Nenhuma venda confirmada no período.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs font-semibold uppercase text-ink-500">
              <tr>
                <th className="py-2">Data</th>
                <th className="py-2">Paciente</th>
                <th className="py-2">Produto</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.receitas.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-ink-600">{formatDateTimePtBR(r.createdAt)}</td>
                  <td className="py-2">{r.patientName ?? "—"}</td>
                  <td className="py-2">{r.product ?? "—"}</td>
                  <td className="py-2 text-right font-semibold">{formatCentsBRL(r.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <CostBlock title="Custos fixos" items={data.custosFixos} total={data.custosFixosCents} />
        <CostBlock title="Custos variáveis" items={data.custosVariaveis} total={data.custosVariaveisCents} />
      </div>
    </div>
  );
}

function CostBlock({
  title,
  items,
  total,
}: {
  title: string;
  items: Array<{ id: string; description: string; amountCents: number; category: string | null; referenceAt: string }>;
  total: number;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
        <span className="text-sm font-semibold text-ink-700">{formatCentsBRL(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-600">Nenhum lançamento.</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
              <span>
                {c.description}
                <span className="block text-xs text-ink-500">
                  {c.category ?? "—"} · {new Date(c.referenceAt).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span className="font-semibold tabular-nums">{formatCentsBRL(c.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
