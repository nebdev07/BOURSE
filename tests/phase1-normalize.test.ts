import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeAmount, normalizeDate, normalizeSymbol } from "@/shared/normalize.ts";

describe("Phase 1 — normalisation", () => {
  it("normalise 2 606 FCFA vers 2606", () => {
    assert.equal(normalizeAmount("2 606 FCFA"), 2606);
    assert.equal(normalizeAmount("2606"), 2606);
    assert.equal(normalizeAmount("2,606"), 2606);
    assert.equal(normalizeAmount("2606.00"), 2606);
    assert.equal(normalizeAmount("2.606,00"), 2606);
  });

  it("normalise symboles et dates", () => {
    assert.equal(normalizeSymbol(" sgci "), "SGCI");
    assert.equal(normalizeDate("27/08/2026"), "2026-08-27");
    assert.equal(normalizeDate("2026-08-27"), "2026-08-27");
  });
});
