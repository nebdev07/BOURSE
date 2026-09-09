"use client";

import type { ScoreBreakdown } from "@/modules/shared-kernel/types";
import { useI18n } from "@/frontend/i18n/provider";

export function ScoreBreakdownPanel({ breakdown, total }: { breakdown: ScoreBreakdown; total: number }) {
  const { t } = useI18n();
  const rows = [
    [t.stock.quality, breakdown.businessQuality],
    [t.stock.growthPillar, breakdown.growth],
    [t.stock.divQuality, breakdown.dividendQuality],
    [t.stock.valuation, breakdown.valuation],
    [t.stock.mosPillar, breakdown.marginOfSafety],
    [t.stock.priceFund, breakdown.priceFundamentals],
    [t.stock.risk, breakdown.risk],
  ] as const;

  return (
    <div className="card p-5">
      <h3 className="font-serif text-lg">{t.stock.whyScore}</h3>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map(([label, item]) => (
          <li key={label} className="flex items-center justify-between gap-4">
            <span className="text-muted">{label}</span>
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
