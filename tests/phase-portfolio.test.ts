import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  portfolioWeight,
  positionMetrics,
  reinforceStance,
} from "@/modules/portfolio/domain/metrics.ts";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";
import { registerUser } from "@/modules/identity/application/auth-service.ts";
import {
  createHolding,
  getPortfolioView,
} from "@/modules/portfolio/application/portfolio-service.ts";

describe("Portefeuille — métriques domaine", () => {
  it("calcule P&L, variation journalière et poids", () => {
    const m = positionMetrics({
      quantity: 10,
      avgCost: 1000,
      currentPrice: 1200,
      previousClose: 1100,
    });
    assert.equal(m.marketValue, 12000);
    assert.equal(m.costBasis, 10000);
    assert.equal(m.unrealizedPnL, 2000);
    assert.equal(m.dayPnL, 1000);
    assert.equal(portfolioWeight(12000, 40000), 30);
    assert.equal(reinforceStance("BUY"), "BUY_MORE");
    assert.equal(reinforceStance("WAIT"), "HOLD_NO_BUY");
    assert.equal(reinforceStance("AVOID"), "AVOID_ADD");
  });
});

describe("Portefeuille — positions utilisateur", () => {
  it("isole les positions et calcule les contributions", () => {
    process.env.BRVM_DISABLE_PG = "1";
    process.env.PERSISTENCE_DRIVER = "file";
    resetStore(emptyStore());
    persist(() => undefined);
    seedDemo();

    const a = registerUser({ email: "holder-a@test.local", password: "password1", name: "Alice" });
    const b = registerUser({ email: "holder-b@test.local", password: "password1", name: "Bob" });
    assert.ok(a.ok && b.ok, !a.ok ? a.error : !b.ok ? b.error : "");
    if (!a.ok || !b.ok) return;

    createHolding(a.value.user.id, { symbol: "SGBC", quantity: 2, avgCost: 30000 });
    createHolding(a.value.user.id, { symbol: "SNTS", quantity: 5, avgCost: 40000 });
    createHolding(b.value.user.id, { symbol: "ORAC", quantity: 1, avgCost: 20000 });

    const viewA = getPortfolioView(a.value.user.id);
    const viewB = getPortfolioView(b.value.user.id);
    assert.equal(viewA.lines.length, 2);
    assert.equal(viewB.lines.length, 1);
    assert.ok(viewA.totals.costBasis > 0);
    const weights = viewA.lines.map((l) => l.weightPct ?? 0);
    assert.ok(Math.abs(weights.reduce((s, w) => s + w, 0) - 100) < 0.2);
    assert.ok(viewA.lines.every((l) => l.reasons.length > 0));
  });
});
