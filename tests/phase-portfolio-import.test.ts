import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parsePortfolioCsv,
  portfolioExampleCsv,
  resolveListedSymbol,
} from "@/modules/portfolio/domain/import-csv.ts";
import { emptyStore, persist, resetStore } from "@/infrastructure/persistence/file-store.ts";
import { seedDemo } from "@/infrastructure/seed/brvm-seed.ts";
import { registerUser } from "@/modules/identity/application/auth-service.ts";
import { importHoldingsCsv, getPortfolioView } from "@/modules/portfolio/application/portfolio-service.ts";
import { BROKER_EXTRACT_OPS } from "@/modules/portfolio/seed/broker-extract-example.ts";

describe("Import portefeuille CSV", () => {
  it("résout les libellés courtier vers les tickers BRVM", () => {
    assert.equal(resolveListedSymbol("BANK OF AFRICA CI"), "BOAC");
    assert.equal(resolveListedSymbol("BIC BENIN"), "BICB");
    assert.equal(resolveListedSymbol("ORANGE CÔTE D'IVOIRE"), "ORAC");
    assert.equal(resolveListedSymbol("SIB"), "SIBC");
    assert.equal(resolveListedSymbol("VIVO ENERGY CI"), "SHEC");
  });

  it("parse l'exemple historique complet", () => {
    const parsed = parsePortfolioCsv(portfolioExampleCsv());
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.format, "platform");
    assert.equal(parsed.value.rows.length, BROKER_EXTRACT_OPS.length);
    assert.ok(parsed.value.rows.some((r) => r.symbol === "BOAC" && r.side === "BUY"));
    assert.ok(parsed.value.rows.some((r) => r.symbol === "UNXC" && r.side === "SELL"));
  });

  it("parse un extrait type courtier (Acquisitions / Cessions)", () => {
    const csv = `Titre;Date;Libellé;Valeur Unitaire;Débit;Crédit;Solde
BANK OF AFRICA CI;25/02/2025;Acquisitions BANK OF AFRICA CI;6 780.000;;10;10
;27/02/2025;Acquisitions BANK OF AFRICA CI;6 090.000;;2;12
UNIWAX CI;11/08/2025;Cessions UNIWAX CI;806.000;5;;0
`;
    const parsed = parsePortfolioCsv(csv);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.format, "broker");
    assert.equal(parsed.value.rows.length, 3);
    assert.equal(parsed.value.rows[0]?.unitPrice, 6780);
    assert.equal(parsed.value.rows[2]?.side, "SELL");
    assert.equal(parsed.value.rows[2]?.symbol, "UNXC");
  });

  it("importe l'historique et reconstruit les soldes", () => {
    process.env.BRVM_DISABLE_PG = "1";
    process.env.PERSISTENCE_DRIVER = "file";
    resetStore(emptyStore());
    persist(() => undefined);
    seedDemo();
    const user = registerUser({ email: "import2@test.local", password: "password1", name: "Import" });
    assert.ok(user.ok);
    if (!user.ok) return;
    const result = importHoldingsCsv(user.value.user.id, portfolioExampleCsv());
    assert.equal(result.imported, BROKER_EXTRACT_OPS.length);
    const view = getPortfolioView(user.value.user.id);
    assert.equal(view.lines.length, 8);
    assert.ok(view.lines.every((l) => (l.lots?.length ?? 0) >= 1));
  });
});
