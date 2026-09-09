import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BRVM_LISTED, BRVM_LISTED_COUNT } from "@/infrastructure/seed/brvm-listed-companies.ts";
import { emptyStore, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";
import { listCompanies } from "@/modules/application/catalog.ts";

describe("Univers BRVM — 47 actions cotées", () => {
  it("liste officielle : 47 symboles uniques, SGBC pas SGCI, pas BBGC", () => {
    assert.equal(BRVM_LISTED_COUNT, 47);
    const symbols = BRVM_LISTED.map((c) => c.symbol);
    assert.equal(new Set(symbols).size, 47);
    assert.ok(symbols.includes("SGBC"));
    assert.ok(symbols.includes("SNTS"));
    assert.ok(symbols.includes("ORAC"));
    assert.ok(symbols.includes("ONTBF"));
    assert.equal(symbols.includes("SGCI"), false);
    assert.equal(symbols.includes("BBGC"), false);
  });

  it("le seed matérialise les 47 titres cotés", () => {
    resetStore(emptyStore());
    seedDemo();
    const companies = listCompanies();
    assert.equal(companies.length, 47);
    assert.ok(companies.some((c) => c.symbol === "SGBC"));
    assert.equal(companies.some((c) => c.symbol === "SGCI"), false);
  });
});
