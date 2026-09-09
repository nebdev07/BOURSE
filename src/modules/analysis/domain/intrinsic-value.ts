import { cagr, clamp, marginOfSafety, median } from "@/modules/analysis/domain/finance-math";
import { round2 } from "@/shared/normalize";
import type { RulesetParams } from "@/modules/recommendation/domain/ruleset";

export interface IntrinsicInput {
  currentPrice: number;
  currentEps: number | null;
  historicalPers: number[];
  currentDividend: number | null;
  dividendCagr: number | null;
  cashFlows: number[];
  historicalCloses: number[];
  discountRatePct: number;
}

export interface IntrinsicValue {
  value: number | null;
  reliability: number;
  methods: string[];
  details: Record<string, number | null>;
}

export function computeIntrinsicValue(input: IntrinsicInput, rules: RulesetParams): IntrinsicValue {
  const details: Record<string, number | null> = {};
  const methods: string[] = [];
  const weights: Array<{ value: number; weight: number }> = [];

  const perMedian = median(input.historicalPers);
  details.perNormalized = null;
  if (perMedian && perMedian > 0 && input.currentEps && input.currentEps > 0) {
    const v = round2(perMedian * input.currentEps);
    details.perNormalized = v;
    methods.push("PER_NORMALIZED");
    weights.push({ value: v, weight: 0.4 });
  }

  const r = rules.discountRate / 100;
  details.ddm = null;
  if (input.currentDividend && input.currentDividend > 0) {
    const gPct = input.dividendCagr ?? 0;
    const g = clamp(gPct / 100, 0, Math.min(0.06, r - 0.03));
    if (r > g) {
      const v = round2(input.currentDividend / (r - g));
      details.ddm = v;
      methods.push("DDM");
      weights.push({ value: v, weight: 0.3 });
    }
  }

  details.historicalValuation = null;
  const medianClose = median(input.historicalCloses);
  if (medianClose && medianClose > 0) {
    details.historicalValuation = round2(medianClose);
    methods.push("HISTORICAL_VALUATION");
    weights.push({ value: medianClose, weight: 0.15 });
  }

  details.dcf = null;
  if (input.cashFlows.length >= 5) {
    const last = input.cashFlows[input.cashFlows.length - 1];
    const first = input.cashFlows[input.cashFlows.length - 5];
    const gPct = cagr(first, last, 4) ?? 0;
    const g = clamp(gPct / 100, 0, Math.min(0.06, r - 0.03));
    if (last > 0 && r > g) {
      let pv = 0;
      let cf = last;
      for (let t = 1; t <= 5; t += 1) {
        cf *= 1 + g;
        pv += cf / (1 + r) ** t;
      }
      const terminal = (cf * (1 + g)) / (r - g);
      pv += terminal / (1 + r) ** 5;
      const sane = input.currentPrice <= 0 || (pv > input.currentPrice * 0.05 && pv < input.currentPrice * 20);
      if (sane) {
        details.dcf = round2(pv);
        methods.push("DCF");
        weights.push({ value: pv, weight: 0.35 });
      }
    }
  }

  const filtered = weights.filter((w) => {
    if (input.currentPrice <= 0) return true;
    return w.value > input.currentPrice * 0.05 && w.value < input.currentPrice * 20;
  });
  const used = filtered.length ? filtered : weights;

  if (used.length === 0) {
    return { value: null, reliability: 20, methods, details };
  }

  const totalWeight = used.reduce((a, b) => a + b.weight, 0);
  const value = round2(used.reduce((a, b) => a + b.value * b.weight, 0) / totalWeight);
  const reliability = clamp(40 + used.length * 15, 20, 95);

  return { value, reliability, methods, details };
}

export function mosFromIntrinsic(intrinsic: number | null, price: number): number | null {
  if (intrinsic === null) return null;
  return marginOfSafety(intrinsic, price);
}
