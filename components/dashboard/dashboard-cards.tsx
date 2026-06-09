import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { formatConsultationDuration } from "@/lib/consultation-duration";
import { cn } from "@/lib/cn";

type StatCard = {
  key: keyof Pick<
    DashboardStats,
    | "atendimentosHoje"
    | "atendimentosMes"
    | "pacientesCadastrados"
    | "agendamentosPendentes"
    | "consultasFinalizadas"
  >;
  label: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  href?: string;
};

const cards: StatCard[] = [
  {
    key: "atendimentosHoje",
    label: "Atendimentos do dia",
    hint: "Agendamentos com data de hoje (exceto cancelados)",
    icon: CalendarCheck,
    accent: "from-brand-500 to-indigo-600",
    iconBg: "bg-brand-100 text-brand-800",
    href: "/painel/agenda",
  },
  {
    key: "atendimentosMes",
    label: "Atendimentos do mês",
    hint: "No mês civil atual (horário de Brasília)",
    icon: CalendarDays,
    accent: "from-accent-500 to-accent-600",
    iconBg: "bg-brand-100 text-brand-800",
    href: "/painel/agenda",
  },
  {
    key: "pacientesCadastrados",
    label: "Pacientes cadastrados",
    hint: "Total na base de pacientes",
    icon: Users,
    accent: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100 text-emerald-800",
    href: "/painel/pacientes",
  },
  {
    key: "agendamentosPendentes",
    label: "Agendamentos pendentes",
    hint: "Pedidos do site aguardando confirmação",
    icon: Clock,
    accent: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-900",
    href: "/painel/agenda",
  },
  {
    key: "consultasFinalizadas",
    label: "Consultas finalizadas",
    hint: "Atendimentos concluídos na fila clínica",
    icon: CheckCircle2,
    accent: "from-slate-600 to-ink-900",
    iconBg: "bg-slate-100 text-slate-800",
    href: "/painel/atendimento",
  },
];

type Props = {
  stats: DashboardStats;
  userName: string;
  roleLabel: string;
  showAdminMetrics?: boolean;
};

function StatCardContent({
  card,
  value,
  floatDelay,
}: {
  card: StatCard;
  value: number | string;
  floatDelay: string;
}) {
  const Icon = card.icon;
  return (
    <article
      className="dashboard-stat-card group dashboard-card-float"
      style={{ animationDelay: floatDelay }}
    >
      <div
        className={cn(
          "dashboard-orb-pulse pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:opacity-25",
          card.accent,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 transition-transform duration-300 group-hover:translate-x-0.5">
          <p className="text-sm font-semibold text-ink-600 transition-colors duration-300 group-hover:text-brand-800">
            {card.label}
          </p>
          <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 tabular-nums transition-transform duration-300 group-hover:scale-[1.02] group-hover:origin-left">
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">{card.hint}</p>
        </div>
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:ring-brand-200/60",
            card.iconBg,
          )}
        >
          <Icon
            className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
            aria-hidden
          />
        </span>
      </div>
      {card.href ? (
        <p className="relative mt-4 translate-y-1 text-xs font-semibold text-brand-700 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver detalhes →
        </p>
      ) : null}
    </article>
  );
}

function AdminMetricCard({ mediaLabel, consultasComDuracao }: { mediaLabel: string; consultasComDuracao: number }) {
  return (
    <article
      className="dashboard-stat-card group dashboard-card-float border-violet-200/80"
      style={{ animationDelay: "2.4s" }}
    >
      <div className="dashboard-orb-pulse pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:opacity-25" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-600 transition-colors duration-300 group-hover:text-violet-800">
            Média de atendimento
          </p>
          <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 transition-transform duration-300 group-hover:scale-[1.02] group-hover:origin-left">
            {mediaLabel}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">
            Tempo médio da consulta clínica (início → finalização), com base em{" "}
            {consultasComDuracao.toLocaleString("pt-BR")}{" "}
            {consultasComDuracao === 1 ? "consulta registrada" : "consultas registradas"}.
          </p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 ring-1 ring-inset ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
          <Clock className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" aria-hidden />
        </span>
      </div>
      <Link
        href="/painel/atendimento"
        className="relative mt-4 inline-block translate-y-1 text-xs font-semibold text-brand-700 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:underline"
      >
        Ver fila de atendimento →
      </Link>
    </article>
  );
}

export function DashboardCards({ stats, userName, roleLabel, showAdminMetrics }: Props) {
  const mediaConsultaLabel = formatConsultationDuration(stats.mediaConsultaSegundos);

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:px-8">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-32 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
        aria-hidden
      />

      <div className="dashboard-welcome relative">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-brand-400/20 to-indigo-400/10 blur-2xl" />
        <p className="relative text-sm text-ink-600">
          Olá, <span className="font-semibold text-ink-900">{userName}</span> (
          <span className="font-semibold text-ink-900">{roleLabel}</span>).
        </p>
        <p className="relative mt-2 text-xs text-ink-500">
          {stats.periodo.diaLabel} · {stats.periodo.mesLabel}
        </p>
      </div>

      <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const value = stats[card.key];
          const floatDelay = `${index * 0.45}s`;
          const content = <StatCardContent card={card} value={value} floatDelay={floatDelay} />;
          if (card.href) {
            return (
              <Link
                key={card.key}
                href={card.href}
                className="block rounded-3xl focus-visible:outline-none"
              >
                {content}
              </Link>
            );
          }
          return <div key={card.key}>{content}</div>;
        })}
        {showAdminMetrics ? (
          <AdminMetricCard
            mediaLabel={mediaConsultaLabel}
            consultasComDuracao={stats.consultasComDuracao}
          />
        ) : null}
      </div>
    </div>
  );
}
