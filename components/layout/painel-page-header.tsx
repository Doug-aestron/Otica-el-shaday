type Props = {
  title: string;
  subtitle?: string;
};

export function PainelPageHeader({ title, subtitle }: Props) {
  return (
    <div className="border-b border-slate-200/80 bg-white/70 px-4 py-6 backdrop-blur sm:px-6 md:px-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
      {subtitle ? <p className="mt-1 max-w-2xl text-sm text-ink-600">{subtitle}</p> : null}
    </div>
  );
}
