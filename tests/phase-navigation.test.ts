import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_APP_LINKS,
  ADMIN_NAV,
  USER_ACCOUNT_LINKS,
  USER_APP_LINKS,
  assertAdminNotInUserChrome,
  homeAfterLogin,
  isAdminNavActive,
  userChromeHrefs,
} from "@/frontend/navigation/routes.ts";

describe("Navigation — cohérence user vs admin", () => {
  it("ne place jamais /admin dans la chrome utilisateur", () => {
    assert.equal(assertAdminNotInUserChrome(), true);
    assert.equal(userChromeHrefs().includes("/admin"), false);
  });

  it("sépare clairement les liens app et backoffice", () => {
    for (const link of USER_APP_LINKS) {
      assert.equal(link.adminChrome, false);
      assert.ok(link.href.startsWith("/"));
      assert.notEqual(link.href, "/admin");
    }
    for (const link of ADMIN_APP_LINKS) {
      assert.equal(link.adminChrome, true);
      assert.equal(link.userChrome, false);
      assert.ok(link.href.startsWith("/admin"));
    }
  });

  it("expose les routes backoffice (pas des ancres)", () => {
    assert.deepEqual(
      ADMIN_NAV.map((n) => n.href),
      ["/admin", "/admin/users", "/admin/alerts", "/admin/ops", "/admin/data"],
    );
  });

  it("marque le menu admin actif correctement", () => {
    assert.equal(isAdminNavActive("/admin", "/admin", true), true);
    assert.equal(isAdminNavActive("/admin/users", "/admin", true), false);
    assert.equal(isAdminNavActive("/admin/users", "/admin/users", false), true);
    assert.equal(isAdminNavActive("/admin/alerts", "/admin/users", false), false);
  });

  it("envoie l’admin vers /admin et l’utilisateur vers /dashboard après login", () => {
    assert.equal(homeAfterLogin("admin"), "/admin");
    assert.equal(homeAfterLogin("user"), "/dashboard");
  });

  it("garde les réglages hors barre principale (menu compte)", () => {
    assert.equal(USER_APP_LINKS.some((l) => l.href === "/settings"), false);
    assert.equal(USER_ACCOUNT_LINKS.some((l) => l.href === "/settings"), true);
  });

  it("couvre les parcours métier utilisateur sans trou évident", () => {
    const hrefs = userChromeHrefs();
    for (const required of ["/dashboard", "/stocks", "/recommendations", "/alerts", "/portfolio", "/guide"]) {
      assert.ok(hrefs.includes(required), `manque ${required}`);
    }
  });
});
