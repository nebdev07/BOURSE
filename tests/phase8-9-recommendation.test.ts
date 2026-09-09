import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recommend } from "@/modules/recommendation/domain/recommend.ts";
import { DEFAULT_RULESET } from "@/modules/recommendation/domain/ruleset.ts";
import type { AnalysisResult } from "@/modules/shared-kernel/types.ts";

function base(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    symbol: "SGCI",
    asOf: "2026-08-27",
    currentPrice: 38005,
    dividendYield: 6.86,
    dividendGrowth1y: 6.4,
    dividendGrowth3y: 24,
    dividendGrowth5y: 49,
    dividendGrowth10y: 86,
    dividendCagr3y: 7,
    dividendCagr5y: 8,
    dividendCagr10y: 6,
    eps: 3500,
    epsGrowth1y: 3.5,
    epsCagr3y: 7,
    epsCagr5y: 6,
    epsCagr10y: 5,
    per: 10.86,
    historicalPerMedian: 13,
    roe: 18.6,
    payoutRatio: 74,
    maxDrawdown: -12,
    volatility: 18,
    priceGrowth1y: 6,
    priceGrowth3y: 20,
    intrinsicValue: 45500,
    intrinsicReliability: 85,
    intrinsicMethods: ["PER_NORMALIZED", "DDM"],
    marginOfSafety: 16.47,
    investmentScore: 87,
    confidenceScore: 91,
    dataQualityScore: 90,
    breakdown: {
      businessQuality: { score: 18, max: 20 },
      growth: { score: 13, max: 15 },
      dividendQuality: { score: 14, max: 15 },
      valuation: { score: 18, max: 20 },
      marginOfSafety: { score: 13, max: 15 },
      priceFundamentals: { score: 7, max: 10 },
      risk: { score: 4, max: 5 },
    },
    flags: [],
    reasons: ["bénéfices solides", "dividende croissant", "valorisation intéressante"],
    risks: [],
    ...overrides,
  };
}

describe("Phases 8-9 — scoring et recommandation", () => {
  it("BUY exige le triptyque qualité + MoS + confiance data", () => {
    assert.equal(recommend(base(), DEFAULT_RULESET).status, "BUY");
  });

  it("un score élevé avec confiance faible n'est pas un BUY (anti-FILTISAC)", () => {
    const a = base({ investmentScore: 88, confidenceScore: 45, dataQualityScore: 60 });
    assert.notEqual(recommend(a, DEFAULT_RULESET).status, "BUY");
  });

  it("DataQuality < 70 n'autorise jamais BUY", () => {
    const a = base({ dataQualityScore: 65, investmentScore: 90, confidenceScore: 90 });
    assert.notEqual(recommend(a, DEFAULT_RULESET).status, "BUY");
  });

  it("ACCUMULATE si score 70+, MoS 5+, confiance 70+", () => {
    const a = base({
      investmentScore: 73,
      marginOfSafety: 8,
      confidenceScore: 74,
      dataQualityScore: 82,
      flags: [],
    });
    assert.equal(recommend(a, DEFAULT_RULESET).status, "ACCUMULATE");
  });

  it("WAIT = qualité élevée mais MoS négative", () => {
    const a = base({
      investmentScore: 68,
      marginOfSafety: -12,
      confidenceScore: 80,
      flags: [],
      breakdown: {
        businessQuality: { score: 16, max: 20 },
        growth: { score: 12, max: 15 },
        dividendQuality: { score: 12, max: 15 },
        valuation: { score: 8, max: 20 },
        marginOfSafety: { score: 0, max: 15 },
        priceFundamentals: { score: 5, max: 10 },
        risk: { score: 4, max: 5 },
      },
    });
    assert.equal(recommend(a, DEFAULT_RULESET).status, "WAIT");
  });

  it("AVOID sur dividend trap / collapse", () => {
    assert.equal(recommend(base({ flags: ["DIVIDEND_TRAP"], investmentScore: 55 }), DEFAULT_RULESET).status, "AVOID");
    assert.equal(recommend(base({ flags: ["EPS_COLLAPSE"] }), DEFAULT_RULESET).status, "AVOID");
  });

  it("une hausse récente bloque le BUY (anti-FOMO)", () => {
    assert.notEqual(recommend(base({ flags: ["RECENT_RUN_UP"] }), DEFAULT_RULESET).status, "BUY");
  });

  it("WATCH par défaut si signal insuffisant", () => {
    const a = base({
      investmentScore: 62,
      marginOfSafety: 3,
      confidenceScore: 72,
      flags: [],
      breakdown: {
        businessQuality: { score: 10, max: 20 },
        growth: { score: 8, max: 15 },
        dividendQuality: { score: 8, max: 15 },
        valuation: { score: 12, max: 20 },
        marginOfSafety: { score: 6, max: 15 },
        priceFundamentals: { score: 6, max: 10 },
        risk: { score: 4, max: 5 },
      },
    });
    assert.equal(recommend(a, DEFAULT_RULESET).status, "WATCH");
  });
});
