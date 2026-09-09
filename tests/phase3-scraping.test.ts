import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBrvmMarketHtml } from "@/infrastructure/data-providers/scraping/engine.ts";
import { persist, resetStore, emptyStore } from "@/infrastructure/persistence/file-store.ts";

describe("Phase 3 — scraping fixtures locales", () => {
  it("parse une page BRVM locale sans Internet", () => {
    const html = readFileSync(join(process.cwd(), "fixtures/brvm/market-page.html"), "utf8");
    const result = parseBrvmMarketHtml(html, "2026-08-26");
    assert.equal(result.ok, true);
    assert.equal(result.rows[0].symbol, "SGCI");
    assert.equal(result.rows[0].close, 38005);
  });

  it("en cas d'échec de parsing, conserve les anciennes données", () => {
    const store = emptyStore();
    store.quotes.push({
      id: "q1",
      symbol: "SGCI",
      date: "2026-08-25",
      open: 38000,
      high: 38100,
      low: 37900,
      close: 38000,
      volume: 1,
      adjustedClose: 38000,
      provenance: {
        source: "old",
        sourceType: "OFFICIAL_BRVM",
        sourceUrl: null,
        retrievedAt: "2026-08-25T18:00:00.000Z",
        referenceDate: "2026-08-25",
        confidence: 95,
      },
    });
    resetStore(store);
    const html = readFileSync(join(process.cwd(), "fixtures/brvm/market-page-broken.html"), "utf8");
    const result = parseBrvmMarketHtml(html);
    assert.equal(result.ok, false);
    assert.ok((result.error ?? "").includes("DATA_SOURCE_FAILURE"));
    persist((s) => {
      s.sourceFailures.push({
        id: "f1",
        sourceId: "src-scraping",
        timestamp: new Date().toISOString(),
        error: result.error ?? "fail",
        payload: html.slice(0, 200),
      });
    });
    assert.equal(store.quotes.length, 1);
    assert.equal(store.quotes[0].close, 38000);
  });
});
