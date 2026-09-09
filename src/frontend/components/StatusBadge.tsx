"use client";

import { statusLabel } from "@/frontend/i18n/dictionary";
import { useI18n } from "@/frontend/i18n/provider";

const TONE: Record<string, string> = {
  BUY: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
  ACCUMULATE: "bg-brand-200 text-brand-500 border-brand-400/40",
  WATCH: "bg-slate-800/80 text-slate-300 border-slate-600",
  WAIT: "bg-amber-950/60 text-amber-200 border-amber-800",
  AVOID: "bg-rose-950/60 text-rose-300 border-rose-800",
};

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useI18n();
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${TONE[status] ?? "bg-brand-200"}`}>
      {statusLabel(locale, status)}
    </span>
  );
}
