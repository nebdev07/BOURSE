import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { loginUser, registerUser, userFromToken } from "@/modules/identity/application/auth-service.ts";
import { createAlert, listAlerts, personalRecommendations, savePersonalRuleset } from "@/modules/application/workspace.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";

describe("Identité publique — comptes, isolation, réglages", () => {
  it("inscrit un utilisateur, ouvre une session, refuse un mot de passe court", () => {
    resetStore(emptyStore());
    const bad = registerUser({ email: "a@b.co", password: "short", name: "Ada" });
    assert.equal(bad.ok, false);
    const okReg = registerUser({ email: "ada@brvm.test", password: "secret-ada", name: "Ada" });
    assert.equal(okReg.ok, true);
    if (!okReg.ok) return;
    assert.equal(okReg.value.user.role, "admin");
    const sessionUser = userFromToken(okReg.value.token);
    assert.equal(sessionUser?.email, "ada@brvm.test");
    const fail = loginUser("ada@brvm.test", "wrong-password");
    assert.equal(fail.ok, false);
    const login = loginUser("ada@brvm.test", "secret-ada");
    assert.equal(login.ok, true);
  });

  it("isole les alertes entre utilisateurs", () => {
    resetStore(emptyStore());
    const a = registerUser({ email: "a@brvm.test", password: "password1", name: "Alice" });
    const b = registerUser({ email: "b@brvm.test", password: "password1", name: "Bob" });
    assert.ok(a.ok && b.ok);
    if (!a.ok || !b.ok) return;
    createAlert(a.value.user.id, { symbol: "SGBC", type: "PRICE_LTE", threshold: 35000 });
    createAlert(b.value.user.id, { symbol: "SNTS", type: "SCORE_GTE", threshold: 80 });
    assert.equal(listAlerts(a.value.user.id).length, 1);
    assert.equal(listAlerts(a.value.user.id)[0].symbol, "SGBC");
    assert.equal(listAlerts(b.value.user.id)[0].symbol, "SNTS");
    assert.equal(listAlerts(a.value.user.id).some((x) => x.symbol === "SNTS"), false);
  });

  it("applique les seuils personnels sans changer le signal officiel", () => {
    resetStore(emptyStore());
    persist(() => undefined);
    seedDemo();
    const a = registerUser({ email: "perso@brvm.test", password: "password1", name: "Perso" });
    assert.equal(a.ok, true);
    if (!a.ok) return;
    savePersonalRuleset(a.value.user.id, { minimumBuyScore: 99, minimumMarginOfSafety: 90 });
    const personal = personalRecommendations(a.value.user.id);
    assert.ok(personal.every((r) => r.status !== "BUY"));
  });
});
