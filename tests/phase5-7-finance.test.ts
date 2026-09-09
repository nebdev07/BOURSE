import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cagr,
  dividendYield,
  marginOfSafety,
  per,
  totalReturn,
  yieldOnCost,
} from "@/modules/analysis/domain/finance-math.ts";

describe("Phases 5-7 — formules financières", () => {
  it("calcule le dividend yield SGCI", () => {
    assert.equal(dividendYield(2606, 38005), 6.86);
  });

  it("calcule CAGR, YOC, total return, PER, marge de sécurité", () => {
    assert.equal(cagr(100, 161.05, 5), 10);
    assert.equal(yieldOnCost(2606, 20000), 13.03);
    assert.equal(totalReturn(38005, 5000, 30000), 43.35);
    assert.equal(per(38005, 3500), 10.86);
    assert.equal(marginOfSafety(45500, 38005), 16.47);
  });

  it("rejette les entrées invalides", () => {
    assert.equal(dividendYield(10, 0), null);
    assert.equal(cagr(0, 100, 5), null);
    assert.equal(marginOfSafety(0, 100), null);
  });
});
