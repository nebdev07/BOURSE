import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { importDividendsCsv } from "@/modules/application/catalog.ts";
import { provenance } from "@/shared/provenance.ts";

describe("Phase 3 — historisation, pas d'écrasement silencieux", () => {
  it("conserve l'ancienne valeur de dividende lors d'une correction", () => {
    const store = emptyStore();
    store.companies.push({
      id: "c1",
      symbol: "SGCI",
      name: "SGCI",
      sector: "Banque",
      country: "CI",
      listingDate: null,
      status: "LISTED",
    });
    store.dividends.push({
      id: "d1",
      companyId: "c1",
      symbol: "SGCI",
      exerciseYear: 2025,
      grossAmount: 1200,
      netAmount: 1080,
      currency: "XOF",
      announcementDate: null,
      paymentDate: null,
      provenance: provenance({ source: "old", sourceType: "MANUAL", referenceDate: "2025-12-31" }),
    });
    resetStore(store);
    importDividendsCsv(`symbol,year,gross\nSGCI,2025,1250`);
    const next = persist((s) => s);
    assert.equal(next.dividends[0].grossAmount, 1250);
    assert.equal(next.dividendRevisions.length, 1);
    const prev = next.dividendRevisions[0] as { previous: { grossAmount: number } };
    assert.equal(prev.previous.grossAmount, 1200);
  });
});
