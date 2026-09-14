export function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-2xl border border-brand-400/25 bg-brand-200/30 px-4 py-3 text-sm text-muted">
      <p className="font-semibold text-brand-500">{title}</p>
      <div className="mt-1 leading-relaxed">{children}</div>
    </aside>
  );
}
