type GlossaryEntry = { label: string; beginner: string; expert: string };

/** Affiche un libellé avec info-bulle (débutant + expert). Utilisable en RSC. */
export function TermLabel({
  entry,
  levelLabels,
  className = "",
}: {
  entry: GlossaryEntry;
  levelLabels: { beginner: string; expert: string };
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{entry.label}</span>
      <InfoBubble term={entry.label} beginner={entry.beginner} expert={entry.expert} levelLabels={levelLabels} />
    </span>
  );
}

/** Bouton « ? » avec bulle au survol / focus — accessible clavier. */
export function InfoBubble({
  term,
  beginner,
  expert,
  levelLabels,
}: {
  term: string;
  beginner: string;
  expert: string;
  levelLabels: { beginner: string; expert: string };
}) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-brand-400/50 bg-brand-200/40 text-[10px] font-bold leading-none text-brand-500 outline-none transition hover:border-brand-400 hover:bg-brand-200 focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-label={`Aide : ${term}`}
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-white/15 bg-[#12151c] p-3 text-left text-xs shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:w-80"
      >
        <span className="block font-serif text-sm text-ink">{term}</span>
        <span className="mt-2 block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">{levelLabels.beginner}</span>
          <span className="mt-0.5 block leading-relaxed text-muted">{beginner}</span>
        </span>
        <span className="mt-2 block border-t border-white/10 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">{levelLabels.expert}</span>
          <span className="mt-0.5 block leading-relaxed text-muted">{expert}</span>
        </span>
      </span>
    </span>
  );
}
