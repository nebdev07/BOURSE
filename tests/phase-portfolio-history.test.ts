import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rebuildPositionsFromTransactions } from "@/modules/portfolio/domain/ledger.ts";
import { BROKER_EXTRACT_OPS, brokerExtractHistoryCsv } from "@/modules/portfolio/seed/broker-extract-example.ts";
import { parsePortfolioCsv } from "@/modules/portfolio/domain/import-csv.ts";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";
import { registerUser } from "@/modules/identity/application/auth-service.ts";
import { importHoldingsCsv, getPortfolioView } from "@/modules/portfolio/application/portfolio-service.ts";
import { buildPortfolioWorkbook } from "@/modules/portfolio/infrastructure/portfolio-workbook.ts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

describe("Ledger FIFO — historique progressif", () => {
  it("conserve les lots restants et solde Uniwax après cession", () => {
    const rebuilt = rebuildPositionsFromTransactions(
      BROKER_EXTRACT_OPS.map((o, i) => ({
        id: `t${i}`,
        symbol: o.symbol,
        side: o.side,
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        tradedAt: o.tradedAt,
        note: o.note,
      })),
    );
    assert.equal(rebuilt.bySymbol.get("BOAC")?.quantity, 47);
    assert.equal(rebuilt.bySymbol.get("BICB")?.quantity, 83);
    assert.equal(rebuilt.bySymbol.get("CIEC")?.quantity, 63);
    assert.equal(rebuilt.bySymbol.get("FTSC")?.quantity, 80);
    assert.equal(rebuilt.bySymbol.get("ONTBF")?.quantity, 50);
    assert.equal(rebuilt.bySymbol.get("ORAC")?.quantity, 18);
    assert.equal(rebuilt.bySymbol.get("SIBC")?.quantity, 69);
    assert.equal(rebuilt.bySymbol.get("SHEC")?.quantity, 64);
    assert.ok(rebuilt.closedSymbols.includes("UNXC"));
    assert.equal(rebuilt.bySymbol.has("UNXC"), false);
    // Uniwax : (806-750)*5 + (806-585)*10 = 280 + 2210 = 2490
    assert.equal(rebuilt.realizedBySymbol.get("UNXC"), 2490);
    assert.ok((rebuilt.bySymbol.get("BOAC")?.lots.length ?? 0) >= 2);
  });
});

describe("Import historique courtier", () => {
  it("parse et importe toutes les opérations de l'extrait", () => {
    process.env.BRVM_DISABLE_PG = "1";
    process.env.PERSISTENCE_DRIVER = "file";
    resetStore(emptyStore());
    persist(() => undefined);
    seedDemo();
    const user = registerUser({ email: "hist@test.local", password: "password1", name: "Hist" });
    assert.ok(user.ok);
    if (!user.ok) return;

    const parsed = parsePortfolioCsv(brokerExtractHistoryCsv());
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.ok(parsed.value.rows.length >= 50);
    assert.ok(parsed.value.rows.some((r) => r.side === "SELL" && r.symbol === "UNXC"));

    const result = importHoldingsCsv(user.value.user.id, brokerExtractHistoryCsv());
    assert.equal(result.imported, BROKER_EXTRACT_OPS.length);
    const view = getPortfolioView(user.value.user.id);
    assert.equal(view.lines.length, 8);
    assert.equal(view.closed.length, 1);
    assert.equal(view.closed[0]?.symbol, "UNXC");
    const boa = view.lines.find((l) => l.holding.symbol === "BOAC");
    assert.ok(boa);
    assert.equal(boa?.holding.quantity, 47);
    assert.ok((boa?.lots.length ?? 0) > 1);
  });
});

describe("Classeur Excel historique", () => {
  it("génère un XLSX modèle vierge", async () => {
    const buf = await buildPortfolioWorkbook("modele");
    assert.ok(buf.length > 5000);
    mkdirSync(join(process.cwd(), "public/templates"), { recursive: true });
    writeFileSync(join(process.cwd(), "public/templates/BRVM-Portefeuille-Modele.xlsx"), buf);
  });
});
