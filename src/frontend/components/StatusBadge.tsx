"use client";

import { statusLabel } from "@/frontend/i18n/dictionary";
import { useI18n } from "@/frontend/i18n/provider";
import { InfoBubble } from "@/frontend/components/InfoBubble";

const TONE: Record<string, string> = {
  BUY: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
  ACCUMULATE: "bg-brand-200 text-brand-500 border-brand-400/40",
  WATCH: "bg-slate-800/80 text-slate-300 border-slate-600",
  WAIT: "bg-amber-950/60 text-amber-200 border-amber-800",
  AVOID: "bg-rose-950/60 text-rose-300 border-rose-800",
};

const GLOSSARY_KEY: Record<string, "buy" | "accumulate" | "watch" | "wait" | "avoid"> = {
  BUY: "buy",
  ACCUMULATE: "accumulate",
  WATCH: "watch",
  WAIT: "wait",
  AVOID: "avoid",
};

export function StatusBadge({ status }: { status: string }) {
  const { locale, t } = useI18n();
  const key = GLOSSARY_KEY[status];
  const tip = key ? t.glossary[key] : null;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${TONE[status] ?? "bg-brand-200"}`}
      >
        {statusLabel(locale, status)}
      </span>
      {tip && (
        <InfoBubble
          term={tip.label}
          beginner={tip.beginner}
          expert={tip.expert}
          levelLabels={{ beginner: t.glossary.beginner, expert: t.glossary.expert }}
        />
      )}
    </span>
  );
}
