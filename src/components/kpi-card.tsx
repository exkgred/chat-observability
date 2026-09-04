interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <article className="rounded-2xl border border-white/5 bg-ink-800/80 p-4 shadow-glow">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </article>
  );
}
