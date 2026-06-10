import Link from "next/link";
import { CalendarClock, Glasses, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { BrandLogoLink } from "@/components/brand/brand-logo";
import { buttonClassName } from "@/components/ui/button";
import { PublicBookingForm } from "@/components/public/public-booking-form";
import { SiteUnderDevelopmentPage } from "@/components/public/site-under-development-page";
import { isSiteUnderDevelopment } from "@/lib/site-mode";

/** Lê SITE_UNDER_DEVELOPMENT em runtime (Vercel), não só no build. */
export const dynamic = "force-dynamic";

export default function HomePage() {
  if (isSiteUnderDevelopment()) {
    return <SiteUnderDevelopmentPage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogoLink
            href="/"
            size="md"
            showName
            priority
            nameClassName="font-display text-lg text-ink-900"
          />
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 md:flex">
            <a className="hover:text-brand-700" href="#servicos">
              Serviços
            </a>
            <a className="hover:text-brand-700" href="#experiencia">
              Experiência
            </a>
            <a className="hover:text-brand-700" href="#agendar">
              Agendar
            </a>
            <a className="hover:text-brand-700" href="#contato">
              Contato
            </a>
            <Link className="hover:text-brand-700" href="/privacidade">
              Privacidade
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonClassName({ variant: "ghost", className: "hidden sm:inline-flex" })}
            >
              Área interna
            </Link>
            <Link href="/login" className={buttonClassName()}>
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Clareza com cuidado
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink-900 text-balance sm:text-5xl">
              Visão nítida, atendimento humano e tecnologia de ponta.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600">
              A El Shaday integra exame, consulta e vendas em um fluxo simples para sua equipe — e uma
              experiência acolhedora para quem confia na sua ótica.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={buttonClassName({ size: "lg" })}>
                Acessar sistema
              </Link>
              <a href="#agendar" className={buttonClassName({ size: "lg", variant: "outline" })}>
                Agendar consulta
              </a>
              <a href="#servicos" className={buttonClassName({ size: "lg", variant: "outline" })}>
                Conhecer serviços
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Agenda</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-ink-900">Organizada</dd>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Prontuário</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-ink-900">Completo</dd>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Vendas</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-ink-900">Rápidas</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-white to-indigo-100/70 blur-2xl" />
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-soft backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Painel interno</p>
                  <p className="mt-1 text-sm text-ink-600">Recepção, médico e administração no mesmo lugar.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Online
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { title: "Próximo paciente", subtitle: "Consulta — 14:30", icon: Stethoscope },
                  { title: "Exame em andamento", subtitle: "Refração dinâmica", icon: Glasses },
                  { title: "Conformidade", subtitle: "Registros auditáveis", icon: ShieldCheck },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                      <p className="text-xs text-ink-600">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="border-t border-slate-200/70 bg-white/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              Serviços pensados para o dia a dia da ótica
            </h2>
            <p className="mt-3 max-w-2xl text-ink-600">
              Cadastro de pacientes, anamnese, agenda, prontuário, receitas e vendas — com trilhas de permissão por perfil.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Recepção ágil",
                  body: "Agenda e cadastro com foco em poucos cliques e menos fila.",
                },
                {
                  title: "Atendimento clínico",
                  body: "Evolução do paciente com histórico e prescrições vinculadas.",
                },
                {
                  title: "Gestão e auditoria",
                  body: "Rastreabilidade para decisões seguras e conformidade operacional.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-lg font-semibold text-ink-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencia" className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-brand-600 to-accent-600 p-8 text-white shadow-soft sm:p-10">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Experiência moderna, sem perder o toque humano.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-50">
                Interface limpa, responsiva e preparada para crescer com novos módulos nas próximas fases do projeto.
              </p>
            </div>
          </div>
        </section>

        <section id="agendar" className="border-t border-slate-200/70 bg-slate-50/80 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-8 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                <CalendarClock className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                  Agendamento online
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Envie seu pedido com nome, telefone, data e horário desejados. A recepção confirma pelo painel e move o paciente para a fila quando for o caso.
                </p>
              </div>
            </div>
            <PublicBookingForm />
          </div>
        </section>

        <section id="contato" className="border-t border-slate-200/70 bg-white/60 py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Pronto para começar?</h2>
              <p className="mt-2 text-sm text-ink-600">Use os usuários de teste da fase 1 para explorar o painel.</p>
            </div>
            <Link href="/login" className={buttonClassName({ size: "lg" })}>
              Ir para login
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} El Shaday. Todos os direitos reservados.</p>
          <Link href="/privacidade" className="text-xs font-semibold text-brand-700 hover:underline">
            Política de Privacidade (LGPD)
          </Link>
        </div>
      </footer>
    </div>
  );
}
