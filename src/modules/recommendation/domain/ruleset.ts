export interface RulesetParams {
  version: string;
  minimumBuyScore: number;
  minimumMarginOfSafety: number;
  minimumConfidence: number;
  minimumDividendScore: number;
  minimumGrowthScore: number;
  maximumPER: number;
  minimumROE: number;
  minimumAccumulateScore: number;
  minimumAccumulateMoS: number;
  minimumAccumulateConfidence: number;
  minimumWaitBusinessQuality: number;
  minimumDataQualityBuy: number;
  neverBuyBelowDataQuality: number;
  highYieldTrapThreshold: number;
  discountRate: number;
}

export const DEFAULT_RULESET: RulesetParams = {
  version: "v1",
  minimumBuyScore: 80,
  minimumMarginOfSafety: 15,
  minimumConfidence: 75,
  minimumDividendScore: 10,
  minimumGrowthScore: 8,
  maximumPER: 18,
  minimumROE: 10,
  minimumAccumulateScore: 70,
  minimumAccumulateMoS: 5,
  minimumAccumulateConfidence: 70,
  minimumWaitBusinessQuality: 70,
  minimumDataQualityBuy: 80,
  neverBuyBelowDataQuality: 70,
  highYieldTrapThreshold: 10,
  discountRate: 12,
};

export function createRuleset(overrides: Partial<RulesetParams> & { version: string }): RulesetParams {
  return { ...DEFAULT_RULESET, ...overrides };
}
