import type { RecommendationStatus } from "@/modules/shared-kernel/types";

export type ReinforceStance = "BUY_MORE" | "HOLD_NO_BUY" | "AVOID_ADD";

export interface PositionMetricsInput {
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
  previousClose: number | null;
}

export interface PositionMetrics {
  marketValue: number | null;
  costBasis: number;
  unrealizedPnL: number | null;
  unrealizedPnLPct: number | null;
  dayPnL: number | null;
  dayPnLPct: number | null;
}

export function positionMetrics(input: PositionMetricsInput): PositionMetrics {
  const costBasis = input.quantity * input.avgCost;
  if (input.currentPrice == null || !Number.isFinite(input.currentPrice)) {
    return {
      marketValue: null,
      costBasis,
      unrealizedPnL: null,
      unrealizedPnLPct: null,
      dayPnL: null,
      dayPnLPct: null,
    };
  }
  const marketValue = input.quantity * input.currentPrice;
  const unrealizedPnL = marketValue - costBasis;
  const unrealizedPnLPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : null;
  const dayPnL =
    input.previousClose != null && Number.isFinite(input.previousClose)
      ? (input.currentPrice - input.previousClose) * input.quantity
      : null;
  const dayPnLPct =
    dayPnL != null && input.previousClose != null && input.previousClose > 0
      ? ((input.currentPrice - input.previousClose) / input.previousClose) * 100
      : null;
  return { marketValue, costBasis, unrealizedPnL, unrealizedPnLPct, dayPnL, dayPnLPct };
}

export function portfolioWeight(marketValue: number | null, totalMarketValue: number): number | null {
  if (marketValue == null || totalMarketValue <= 0) return null;
  return (marketValue / totalMarketValue) * 100;
}

/** Conseil de renforcement (pas une vente) à partir du signal officiel. */
export function reinforceStance(status: RecommendationStatus | null | undefined): ReinforceStance {
  if (status === "BUY" || status === "ACCUMULATE") return "BUY_MORE";
  if (status === "AVOID") return "AVOID_ADD";
  return "HOLD_NO_BUY";
}

export function sumNullable(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0), 0);
}
