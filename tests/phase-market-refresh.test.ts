import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, resetStore, persist, loadStore } from "@/infrastructure/persistence/file-store.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";
import { refreshMarketPrices } from "@/infrastructure/jobs/market-refresh.ts";

describe("Rafraîchissement marché", () => {
  it("met à jour les cours du jour depuis un HTML officiel", async () => {
    resetStore(emptyStore());
    persist(() => undefined);
    seedDemo();
    const html = `
      <table>
        <tr><th>Symbole</th><th>Nom</th><th>Vol</th><th>Veille</th><th>Ouv</th><th>Clôture</th></tr>
        <tr><td>SGBC</td><td>SOCIETE GENERALE</td><td>100</td><td>38000</td><td>38100</td><td>39111</td></tr>
        <tr><td>SNTS</td><td>SONATEL</td><td>200</td><td>36000</td><td>36100</td><td>37222</td></tr>
      </table>`;
    const asOf = new Date().toISOString().slice(0, 10);
    const result = await refreshMarketPrices({ html, allowNetwork: false });
    assert.equal(result.ok, true);
    assert.ok(result.quotesUpdated >= 2);
    const store = loadStore();
    const sgbc = store.quotes.find((q) => q.symbol === "SGBC" && q.date === asOf);
    assert.ok(sgbc);
    assert.equal(sgbc?.close, 39111);
  });
});
