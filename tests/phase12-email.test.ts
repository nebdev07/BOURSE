import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emptyStore, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { renderMonthlyReport } from "@/infrastructure/email/report.ts";

describe("Phase 12 — e-mail", () => {
  it("génère le rapport même sans opportunité", () => {
    resetStore(emptyStore());
    const report = renderMonthlyReport("2026-08-27");
    assert.ok(report.subject.includes("27/08/2026"));
    assert.ok(report.text.includes("BRVM INVESTMENT ANALYZER"));
    assert.ok(report.text.includes("TOP OPPORTUNITÉS"));
  });
});
