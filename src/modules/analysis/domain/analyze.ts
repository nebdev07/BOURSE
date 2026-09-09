import {
  cagrFromSeries,
  clamp,
  dividendYield,
  maxDrawdown,
  median,
  multiYearGrowth,
  payoutRatio,
  per,
  periodGrowth,
  round2,
  volatility,
} from "@/modules/analysis/domain/finance-math";
import { computeIntrinsicValue } from "@/modules/analysis/domain/intrinsic-value";
import type { AnalysisResult, Dividend, FinancialStatement, MarketQuote, ScoreBreakdown } from "@/modules/shared-kernel/types";
import type { RulesetParams } from "@/modules/recommendation/domain/ruleset";

export interface AnalyzeInput {
  symbol: string;
  asOf: string;
  quotes: MarketQuote[];
  dividends: Dividend[];
  financials: FinancialStatement[];
  indexCloses?: number[];
}

function sortedQuotes(quotes: MarketQuote[]): MarketQuote[] {
  return [...quotes].sort((a, b) => a.date.localeCompare(b.date));
}

function amountsByYear(dividends: Dividend[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const d of dividends) {
    map.set(d.exerciseYear, d.grossAmount);
  }
  return map;
}

function seriesFromMap(map: Map<number, number>): { years: number[]; values: number[] } {
  const years = [...map.keys()].sort((a, b) => a - b);
  return { years, values: years.map((y) => map.get(y) as number) };
}

function quoteOnOrBefore(quotes: MarketQuote[], date: string): MarketQuote | null {
  const eligible = quotes.filter((q) => q.date <= date);
  return eligible.length ? eligible[eligible.length - 1] : quotes.at(-1) ?? null;
}

function growthAt(values: number[], years: number): number | null {
  return multiYearGrowth(values, years);
}

export function analyzeCompany(input: AnalyzeInput, rules: RulesetParams): AnalysisResult {
  const quotes = sortedQuotes(input.quotes);
  const latest = quoteOnOrBefore(quotes, input.asOf);
  const currentPrice = latest?.close ?? 0;
  const closes = quotes.filter((q) => q.date <= input.asOf).map((q) => q.close);

  const divMap = amountsByYear(input.dividends.filter((d) => d.exerciseYear <= Number(input.asOf.slice(0, 4))));
  const { values: divs } = seriesFromMap(divMap);
  const lastDiv = divs.at(-1) ?? 0;

  const fins = [...input.financials]
    .filter((f) => f.fiscalYear <= Number(input.asOf.slice(0, 4)))
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
  const lastFin = fins.at(-1) ?? null;
  const epsSeries = fins.map((f) => f.eps).filter((v): v is number => v !== null && v > 0);
  const roe = lastFin?.roe ?? null;
  const eps = lastFin?.eps ?? (lastFin?.netIncome && lastFin.sharesOutstanding
    ? lastFin.netIncome / lastFin.sharesOutstanding
    : null);

  const yieldPct = dividendYield(lastDiv, currentPrice);
  const perPct = eps ? per(currentPrice, eps) : null;

  const historicalPers: number[] = [];
  for (const f of fins) {
    if (!f.eps || f.eps <= 0) continue;
    const q = quoteOnOrBefore(quotes, `${f.fiscalYear}-12-31`);
    if (q) {
      const p = per(q.close, f.eps);
      if (p) historicalPers.push(p);
    }
  }

  const intrinsic = computeIntrinsicValue(
    {
      currentPrice,
      currentEps: eps,
      historicalPers,
      currentDividend: lastDiv || null,
      dividendCagr: cagrFromSeries(divs, Math.min(5, Math.max(1, divs.length - 1))),
      cashFlows: fins
        .map((f) => {
          if (f.cashFlow === null) return null;
          if (f.sharesOutstanding && f.sharesOutstanding > 0) return f.cashFlow / f.sharesOutstanding;
          return f.cashFlow;
        })
        .filter((v): v is number => v !== null),
      historicalCloses: closes,
      discountRatePct: rules.discountRate,
    },
    rules,
  );

  const mos = intrinsic.value && currentPrice > 0
    ? round2(((intrinsic.value - currentPrice) / intrinsic.value) * 100)
    : null;

  const price1y = priceChange(quotes, input.asOf, 365);
  const price3y = priceChange(quotes, input.asOf, 365 * 3);
  const eps1y = growthAt(epsSeries, 1);
  const d1 = growthAt(divs, 1);
  const d3 = growthAt(divs, 3);
  const d5 = growthAt(divs, 5);
  const d10 = growthAt(divs, 10);

  const flags: string[] = [];
  const reasons: string[] = [];
  const risks: string[] = [];

  const payout = eps && lastDiv ? payoutRatio(lastDiv, eps) : null;
  const highYield = (yieldPct ?? 0) >= rules.highYieldTrapThreshold;
  const epsDown = (eps1y ?? 0) < -10;
  const lastCf = lastFin?.cashFlow ?? null;
  const cfInsufficient = lastCf !== null && lastDiv > 0 && lastCf < lastDiv;
  if (highYield && (epsDown || cfInsufficient)) {
    flags.push("DIVIDEND_TRAP");
    risks.push("Piège à dividende : rendement élevé mais bénéfices ou cash-flow fragiles");
  }

  if ((eps1y ?? 0) <= -30) flags.push("EPS_COLLAPSE");
  if ((d1 ?? 0) <= -30) flags.push("DIVIDEND_COLLAPSE");
  if (lastFin?.debt && lastFin.equity && lastFin.equity > 0 && lastFin.debt / lastFin.equity > 2.5) {
    flags.push("EXCESSIVE_DEBT");
  }
  if ((eps1y ?? 0) < -15 && (d1 ?? 0) < 0) flags.push("FUNDAMENTAL_DETERIORATION");
  if ((price1y ?? 0) >= 40) flags.push("RECENT_RUN_UP");
  if ((price1y ?? 0) <= -15 && (eps1y ?? 0) < -15) flags.push("PRICE_DROP_WITH_DETERIORATION");
  if ((price1y ?? 0) <= -15 && (eps1y ?? 0) >= 0 && (d1 ?? 0) >= 0) {
    flags.push("POTENTIAL_OPPORTUNITY");
    reasons.push("Le cours a baissé alors que les fondamentaux restent solides");
  }

  const alignmentPenalty = priceFundamentalPenalty(price3y, cagrFromSeries(epsSeries, Math.min(3, epsSeries.length - 1)), cagrFromSeries(divs, Math.min(3, divs.length - 1)));
  if (alignmentPenalty >= 6) {
    flags.push("OVERVALUATION_RISK");
    risks.push("Le prix a crû bien plus vite que le BPA et le dividende");
  }
  if (alignmentPenalty <= -4) {
    flags.push("PRICE_LAGGING_FUNDAMENTALS");
    reasons.push("Le prix n'a pas suivi la croissance des fondamentaux");
  }

  const dataQuality = dataQualityScore({ quotes: closes.length, divYears: divs.length, finYears: fins.length, officialShare: officialShare(input) });
  if (dataQuality < 50) flags.push("DATA_INSUFFICIENT");

  const breakdown = scoreBreakdown({
    rules,
    roe,
    fins,
    epsSeries,
    divs,
    yieldPct,
    payout,
    perPct,
    historicalPer: median(historicalPers),
    mos,
    price1y,
    price3y,
    epsCagr3: cagrFromSeries(epsSeries, Math.min(3, epsSeries.length - 1)),
    divCagr3: cagrFromSeries(divs, Math.min(3, divs.length - 1)),
    flags,
    lastFin,
    alignmentPenalty,
    volatilityPct: volatility(closes),
    drawdown: maxDrawdown(closes),
  });

  const investmentScore = clamp(
    breakdown.businessQuality.score +
      breakdown.growth.score +
      breakdown.dividendQuality.score +
      breakdown.valuation.score +
      breakdown.marginOfSafety.score +
      breakdown.priceFundamentals.score +
      breakdown.risk.score,
    0,
    100,
  );

  const confidence = confidenceScore(dataQuality, intrinsic.reliability, flags);

  if ((roe ?? 0) >= rules.minimumROE) reasons.push("Rentabilité des capitaux (ROE) correcte");
  if ((d5 ?? 0) > 0) reasons.push("Dividende croissant sur 5 ans");
  if (eps && (epsCagrLabel(epsSeries) ?? 0) > 0) reasons.push("Bénéfices en croissance");
  if ((mos ?? 0) >= 10) reasons.push("Valorisation intéressante par rapport à la valeur estimée");
  if ((yieldPct ?? 0) >= 4 && !flags.includes("DIVIDEND_TRAP")) reasons.push("Rendement de dividende attractif et soutenable");

  if ((perPct ?? 0) > rules.maximumPER) risks.push(`PER ${perPct} au-dessus du seuil ${rules.maximumPER}`);
  if ((roe ?? 0) < rules.minimumROE) risks.push("ROE inférieur au minimum configuré");

  return {
    symbol: input.symbol,
    asOf: input.asOf,
    currentPrice,
    dividendYield: yieldPct,
    dividendGrowth1y: d1,
    dividendGrowth3y: d3,
    dividendGrowth5y: d5,
    dividendGrowth10y: d10,
    dividendCagr3y: cagrFromSeries(divs, 3),
    dividendCagr5y: cagrFromSeries(divs, 5),
    dividendCagr10y: cagrFromSeries(divs, 10),
    eps,
    epsGrowth1y: eps1y,
    epsCagr3y: cagrFromSeries(epsSeries, 3),
    epsCagr5y: cagrFromSeries(epsSeries, 5),
    epsCagr10y: cagrFromSeries(epsSeries, 10),
    per: perPct,
    historicalPerMedian: median(historicalPers),
    roe,
    payoutRatio: payout,
    maxDrawdown: maxDrawdown(closes),
    volatility: volatility(closes),
    priceGrowth1y: price1y,
    priceGrowth3y: price3y,
    intrinsicValue: intrinsic.value,
    intrinsicReliability: intrinsic.reliability,
    intrinsicMethods: intrinsic.methods,
    marginOfSafety: mos,
    investmentScore,
    confidenceScore: confidence,
    dataQualityScore: dataQuality,
    breakdown,
    flags,
    reasons: unique(reasons),
    risks: unique(risks),
  };
}

function epsCagrLabel(epsSeries: number[]): number | null {
  return cagrFromSeries(epsSeries, Math.min(5, Math.max(1, epsSeries.length - 1)));
}

function priceChange(quotes: MarketQuote[], asOf: string, days: number): number | null {
  const end = quoteOnOrBefore(quotes, asOf);
  if (!end) return null;
  const from = addDays(asOf, -days);
  const start = quoteOnOrBefore(quotes, from);
  if (!start || start.date === end.date) return null;
  return periodGrowth(end.close, start.close);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function officialShare(input: AnalyzeInput): number {
  const items = [...input.quotes, ...input.dividends, ...input.financials];
  if (!items.length) return 0;
  const official = items.filter((i) =>
    i.provenance.sourceType === "OFFICIAL_BRVM" || i.provenance.sourceType === "OFFICIAL_DOC",
  ).length;
  return official / items.length;
}

function dataQualityScore(p: { quotes: number; divYears: number; finYears: number; officialShare: number }): number {
  const quoteScore = clamp((p.quotes / 200) * 25, 0, 25);
  const divScore = clamp((p.divYears / 8) * 25, 0, 25);
  const finScore = clamp((p.finYears / 8) * 30, 0, 30);
  const srcScore = clamp(p.officialShare * 20, 0, 20);
  return Math.round(quoteScore + divScore + finScore + srcScore);
}

function confidenceScore(dataQuality: number, intrinsicRel: number, flags: string[]): number {
  let c = dataQuality * 0.7 + intrinsicRel * 0.3;
  if (flags.includes("DIVIDEND_TRAP")) c -= 15;
  if (flags.includes("DATA_INSUFFICIENT")) c -= 20;
  return Math.round(clamp(c, 5, 99));
}

function priceFundamentalPenalty(priceG: number | null, epsG: number | null, divG: number | null): number {
  if (priceG === null || epsG === null) return 0;
  const fund = (epsG + (divG ?? epsG)) / 2;
  return round2((priceG - fund) / 10);
}

function scoreBreakdown(p: {
  rules: RulesetParams;
  roe: number | null;
  fins: FinancialStatement[];
  epsSeries: number[];
  divs: number[];
  yieldPct: number | null;
  payout: number | null;
  perPct: number | null;
  historicalPer: number | null;
  mos: number | null;
  price1y: number | null;
  price3y: number | null;
  epsCagr3: number | null;
  divCagr3: number | null;
  flags: string[];
  lastFin: FinancialStatement | null;
  alignmentPenalty: number;
  volatilityPct: number | null;
  drawdown: number | null;
}): ScoreBreakdown {
  let bq = 0;
  if ((p.roe ?? 0) >= 15) bq += 8;
  else if ((p.roe ?? 0) >= p.rules.minimumROE) bq += 6;
  else if ((p.roe ?? 0) >= 5) bq += 3;
  const profits = p.fins.filter((f) => (f.netIncome ?? 0) > 0).length;
  bq += clamp(profits, 0, 6);
  if (p.lastFin?.debt != null && p.lastFin.equity && p.lastFin.equity > 0) {
    const de = p.lastFin.debt / p.lastFin.equity;
    if (de < 1) bq += 4;
    else if (de < 2) bq += 2;
  } else {
    bq += 2;
  }
  if ((p.epsCagr3 ?? 0) > 0) bq += 2;
  bq = clamp(bq, 0, 20);

  let growth = 0;
  growth += band(p.epsCagr3, [15, 8, 3, 0], [8, 6, 4, 2]);
  growth += band(p.divCagr3, [12, 6, 2, 0], [7, 5, 3, 1]);
  growth = clamp(growth, 0, 15);

  let dq = 0;
  if (p.flags.includes("DIVIDEND_TRAP")) {
    dq = 2;
  } else {
    const y = p.yieldPct ?? 0;
    if (y >= 3 && y <= 8) dq += 5;
    else if (y > 8 && y < p.rules.highYieldTrapThreshold) dq += 3;
    else if (y >= 2) dq += 2;
    const growing = countRising(p.divs);
    dq += clamp(growing, 0, 5);
    if (p.payout !== null && p.payout < 70) dq += 3;
    else if (p.payout !== null && p.payout <= 90) dq += 1;
    else if (p.payout === null && (p.divs.length ?? 0) > 0) dq += 1;
  }
  dq = clamp(dq, 0, 15);

  let val = 10;
  if (p.perPct && p.perPct > 0) {
    if (p.perPct <= p.rules.maximumPER * 0.7) val = 18;
    else if (p.perPct <= p.rules.maximumPER) val = 14;
    else if (p.perPct <= p.rules.maximumPER * 1.3) val = 8;
    else val = 4;
    if (p.historicalPer && p.perPct < p.historicalPer * 0.85) val = clamp(val + 2, 0, 20);
  }
  val = clamp(val, 0, 20);

  let mosScore = 0;
  const mos = p.mos ?? -50;
  if (mos >= 30) mosScore = 15;
  else if (mos >= 15) mosScore = 13;
  else if (mos >= 5) mosScore = 8;
  else if (mos >= 0) mosScore = 4;
  else if (mos >= -10) mosScore = 2;
  else mosScore = 0;

  let pf = clamp(10 - p.alignmentPenalty, 0, 10);

  let risk = 5;
  if (p.flags.includes("DIVIDEND_TRAP")) risk -= 3;
  if (p.flags.includes("EXCESSIVE_DEBT")) risk -= 2;
  if (p.flags.includes("RECENT_RUN_UP")) risk -= 1;
  if ((p.drawdown ?? 0) < -50) risk -= 1;
  if ((p.volatilityPct ?? 0) > 40) risk -= 1;
  risk = clamp(risk, 0, 5);

  return {
    businessQuality: { score: Math.round(bq), max: 20 },
    growth: { score: Math.round(growth), max: 15 },
    dividendQuality: { score: Math.round(dq), max: 15 },
    valuation: { score: Math.round(val), max: 20 },
    marginOfSafety: { score: Math.round(mosScore), max: 15 },
    priceFundamentals: { score: Math.round(pf), max: 10 },
    risk: { score: Math.round(risk), max: 5 },
  };
}

function band(value: number | null, thresholds: number[], points: number[]): number {
  if (value === null) return 0;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (value >= thresholds[i]) return points[i];
  }
  return 0;
}

function countRising(values: number[]): number {
  let n = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[i - 1]) n += 1;
  }
  return n;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
