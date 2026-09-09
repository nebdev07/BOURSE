import type { AnalysisResult, RecommendationSnapshot, RecommendationStatus } from "@/modules/shared-kernel/types";
import type { RulesetParams } from "@/modules/recommendation/domain/ruleset";

export interface RecommendationDecision {
  status: RecommendationStatus;
  snapshot: Omit<RecommendationSnapshot, "id">;
}

const CRITICAL = [
  "DIVIDEND_TRAP",
  "EPS_COLLAPSE",
  "DIVIDEND_COLLAPSE",
  "EXCESSIVE_DEBT",
  "FUNDAMENTAL_DETERIORATION",
  "PRICE_DROP_WITH_DETERIORATION",
  "DATA_INSUFFICIENT",
];

export function recommend(analysis: AnalysisResult, rules: RulesetParams): RecommendationDecision {
  const critical = analysis.flags.filter((f) => CRITICAL.includes(f));
  const bq = (analysis.breakdown.businessQuality.score / 20) * 100;

  let status: RecommendationStatus = "WATCH";

  const canBuy =
    analysis.dataQualityScore >= rules.minimumDataQualityBuy &&
    analysis.dataQualityScore >= rules.neverBuyBelowDataQuality &&
    analysis.investmentScore >= rules.minimumBuyScore &&
    (analysis.marginOfSafety ?? -999) >= rules.minimumMarginOfSafety &&
    analysis.confidenceScore >= rules.minimumConfidence &&
    critical.length === 0 &&
    !analysis.flags.includes("RECENT_RUN_UP") &&
    bq >= 60;

  const canAccumulate =
    analysis.dataQualityScore >= rules.neverBuyBelowDataQuality &&
    analysis.investmentScore >= rules.minimumAccumulateScore &&
    (analysis.marginOfSafety ?? -999) >= rules.minimumAccumulateMoS &&
    analysis.confidenceScore >= rules.minimumAccumulateConfidence &&
    critical.length === 0;

  if (critical.length > 0 || analysis.dataQualityScore < 50) {
    status = "AVOID";
  } else if (canBuy) {
    status = "BUY";
  } else if (canAccumulate) {
    status = "ACCUMULATE";
  } else if (bq >= rules.minimumWaitBusinessQuality && (analysis.marginOfSafety ?? 0) < 0) {
    status = "WAIT";
  } else {
    status = "WATCH";
  }

  const ideal = analysis.intrinsicValue
    ? Math.round(analysis.intrinsicValue * (1 - rules.minimumMarginOfSafety / 100))
    : null;
  const maxEntry = analysis.intrinsicValue
    ? Math.round(analysis.intrinsicValue * (1 - Math.max(5, rules.minimumAccumulateMoS) / 100))
    : null;

  return {
    status,
    snapshot: {
      date: analysis.asOf,
      symbol: analysis.symbol,
      price: analysis.currentPrice,
      score: analysis.investmentScore,
      confidence: analysis.confidenceScore,
      dataQuality: analysis.dataQualityScore,
      intrinsicValue: analysis.intrinsicValue,
      marginOfSafety: analysis.marginOfSafety,
      status,
      rulesVersion: rules.version,
      reasons: analysis.reasons,
      risks: [...analysis.risks, ...critical.map((c) => `Alerte critique : ${c}`)],
      targetPrice: analysis.intrinsicValue,
      idealEntryPrice: ideal,
      maximumEntryPrice: maxEntry,
    },
  };
}
