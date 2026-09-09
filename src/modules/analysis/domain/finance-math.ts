import { round2, round4 } from "@/shared/normalize";

export { round2, round4 };

export function dividendYield(annualDividend: number, currentPrice: number): number | null {
  if (currentPrice <= 0 || annualDividend < 0) return null;
  return round2((annualDividend / currentPrice) * 100);
}

export function periodGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return round2(((current - previous) / previous) * 100);
}

export function cagr(beginning: number, ending: number, years: number): number | null {
  if (years <= 0 || beginning <= 0 || ending <= 0) return null;
  return round2((Math.pow(ending / beginning, 1 / years) - 1) * 100);
}

export function yieldOnCost(currentDividend: number, purchasePrice: number): number | null {
  if (purchasePrice <= 0 || currentDividend < 0) return null;
  return round2((currentDividend / purchasePrice) * 100);
}

export function totalReturn(
  currentPrice: number,
  cumulativeDividends: number,
  purchasePrice: number,
): number | null {
  if (purchasePrice <= 0) return null;
  return round2(((currentPrice + cumulativeDividends - purchasePrice) / purchasePrice) * 100);
}

export function epsFromNetIncome(netIncome: number, shares: number): number | null {
  if (shares <= 0) return null;
  return round4(netIncome / shares);
}

export function per(currentPrice: number, earnings: number): number | null {
  if (earnings <= 0 || currentPrice <= 0) return null;
  return round2(currentPrice / earnings);
}

export function marginOfSafety(intrinsicValue: number, currentPrice: number): number | null {
  if (intrinsicValue <= 0) return null;
  return round2(((intrinsicValue - currentPrice) / intrinsicValue) * 100);
}

export function payoutRatio(dividend: number, eps: number): number | null {
  if (eps <= 0 || dividend < 0) return null;
  return round2((dividend / eps) * 100);
}

export function multiYearGrowth(values: number[], years: number): number | null {
  if (years < 1 || values.length < years + 1) return null;
  const current = values[values.length - 1];
  const previous = values[values.length - 1 - years];
  return periodGrowth(current, previous);
}

export function cagrFromSeries(values: number[], years: number): number | null {
  if (years < 1 || values.length < years + 1) return null;
  const ending = values[values.length - 1];
  const beginning = values[values.length - 1 - years];
  return cagr(beginning, ending, years);
}

export function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 === 0 ? (clean[mid - 1] + clean[mid]) / 2 : clean[mid];
}

export function maxDrawdown(closes: number[]): number | null {
  if (closes.length < 2) return null;
  let peak = closes[0];
  let maxDd = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    const dd = peak > 0 ? ((close - peak) / peak) * 100 : 0;
    if (dd < maxDd) maxDd = dd;
  }
  return round2(maxDd);
}

export function volatility(closes: number[]): number | null {
  if (closes.length < 3) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i += 1) {
    if (closes[i - 1] > 0) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return round2(Math.sqrt(variance) * Math.sqrt(252) * 100);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
