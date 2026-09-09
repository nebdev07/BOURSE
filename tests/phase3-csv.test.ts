import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseQuoteCsv } from "@/infrastructure/data-providers/manual-import/csv.ts";

describe("Phase 3 — CSV / validation", () => {
  it("importe un CSV normalisé", () => {
    const csv = `symbol,date,open,high,low,close,volume
SGCI,2026-08-26,38000,38500,37900,38005,1200
sgci,27/08/2026,38 000,38 500,37 900,38 010,1100`;
    const parsed = parseQuoteCsv(csv);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.rows.length, 2);
    assert.equal(parsed.value.rows[0].symbol, "SGCI");
    assert.equal(parsed.value.rows[0].close, 38005);
    assert.equal(parsed.value.rows[1].date, "2026-08-27");
  });

  it("rejette un prix invalide", () => {
    const csv = `symbol,date,open,high,low,close,volume
SGCI,2026-08-26,1,1,1,0,10`;
    const parsed = parseQuoteCsv(csv);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.rows.length, 0);
    assert.ok(parsed.value.rejected[0].reason.includes("price"));
  });
});
