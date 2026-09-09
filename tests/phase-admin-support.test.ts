import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { registerUser } from "@/modules/identity/application/auth-service.ts";
import { createAlert, listAlerts, listAllAlertsForSupport } from "@/modules/application/workspace.ts";
import { parseOfficialListingHtml } from "@/infrastructure/ingestion/listing-sync.ts";

describe("Admin support — alertes utilisateurs", () => {
  it("le premier compte est admin et voit toutes les alertes", () => {
    resetStore(emptyStore());
    persist(() => undefined);
    const admin = registerUser({ email: "admin@brvm.test", password: "password1", name: "Admin" });
    const alice = registerUser({ email: "alice@brvm.test", password: "password1", name: "Alice" });
    assert.ok(admin.ok && alice.ok);
    if (!admin.ok || !alice.ok) return;
    assert.equal(admin.value.user.role, "admin");
    assert.equal(alice.value.user.role, "user");
    createAlert(alice.value.user.id, { symbol: "SGBC", type: "PRICE_LTE", threshold: 35000 });
    createAlert(admin.value.user.id, { symbol: "SNTS", type: "PRICE_GTE", threshold: 40000 });
    assert.equal(listAlerts(alice.value.user.id).length, 1);
    const all = listAllAlertsForSupport();
    assert.equal(all.length, 2);
    assert.ok(all.some((a) => a.userEmail === "alice@brvm.test" && a.symbol === "SGBC"));
    assert.ok(all.some((a) => a.userEmail === "admin@brvm.test" && a.type === "PRICE_GTE"));
  });
});

describe("Liste officielle BRVM — parseur", () => {
  it("extrait les tickers d'une table officielle", () => {
    const html = `
      <table>
        <tr><th>Symbole</th><th>Nom</th><th>Vol</th><th>Veille</th><th>Ouv</th><th>Clôture</th></tr>
        <tr><td>SGBC</td><td>SOCIETE GENERALE COTE D'IVOIRE</td><td>100</td><td>38000</td><td>38100</td><td>38500</td></tr>
        <tr><td>SNTS</td><td>SONATEL SENEGAL</td><td>200</td><td>36000</td><td>36100</td><td>36000</td></tr>
      </table>`;
    const rows = parseOfficialListingHtml(html);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.symbol, "SGBC");
    assert.equal(rows[0]?.lastClose, 38500);
    assert.equal(rows[1]?.symbol, "SNTS");
  });
});
