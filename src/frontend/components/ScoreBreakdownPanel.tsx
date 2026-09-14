"use client";

import type { ScoreBreakdown } from "@/modules/shared-kernel/types";
import { useI18n } from "@/frontend/i18n/provider";
import { GHelp } from "@/frontend/components/GTerm";

export function ScoreBreakdownPanel({ breakdown, total }: { breakdown: ScoreBreakdown; total: number }) {
  const { t } = useI18n();
  const rows = [
    [t.stock.quality, breakdown.businessQuality, null],
    [t.stock.growthPillar, breakdown.growth, null],
    [t.stock.divQuality, breakdown.dividendQuality, null],
    [t.stock.valuation, breakdown.valuation, null],
    [t.stock.mosPillar, breakdown.marginOfSafety, "mos" as const],
    [t.stock.priceFund, breakdown.priceFundamentals, null],
    [t.stock.risk, breakdown.risk, null],
  ] as const;

  return (
    <div className="card p-5">
      <h3 className="font-serif text-lg">
        {t.stock.whyScore} <GHelp id="score" />
      </h3>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map(([label, item, tip]) => (
          <li key={label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1 text-muted">
              {label}
              {tip ? <GHelp id={tip} /> : null}
            </span>
            <span className="num font-medium">
              {item.score}/{item.max}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-white/10 pt-3 font-serif text-lg">
        <span>Total</span>
        <span className="num text-brand-500">{total}/100</span>
      </div>
    </div>
  );
}
