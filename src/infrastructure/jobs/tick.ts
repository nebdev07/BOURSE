import { importDividendsCsv, importFinancialsCsv, importQuotesCsv, runAnalysis } from "@/modules/application/catalog";
import { sendDueReports, createLogMailer } from "@/infrastructure/email/report";
import { persist } from "@/infrastructure/persistence/file-store";
import { parseBrvmMarketHtml } from "@/infrastructure/data-providers/scraping/engine";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export async function runTick(): Promise<{ analyzed: number; emails: number }> {
  const analyzed = runAnalysis().length;
  const emails = await sendDueReports(createLogMailer());
  return { analyzed, emails };
}

export function runOfficialIngestFromFixture(): { ok: boolean; inserted: number; error?: string } {
  const fixture = join(process.cwd(), "fixtures/brvm/market-page.html");
  if (!existsSync(fixture)) return { ok: false, inserted: 0, error: "fixture absente" };
  const html = readFileSync(fixture, "utf8");
  persist((s) => {
    s.rawDocuments.push({
      id: `${Date.now()}`,
      kind: "MARKET",
      source: "OFFICIAL_BRVM",
      fetchedAt: new Date().toISOString(),
      contentType: "text/html",
      payload: html,
      parserVersion: "scraper-1",
    });
  });
  const parsed = parseBrvmMarketHtml(html);
  if (!parsed.ok) {
    persist((s) => {
      const src = s.sources.find((x) => x.type === "SCRAPING" || x.type === "OFFICIAL_BRVM");
      if (src) src.lastFailure = new Date().toISOString();
      s.sourceFailures.push({
        id: `${Date.now()}`,
        sourceId: src?.id ?? "unknown",
        timestamp: new Date().toISOString(),
        error: parsed.error ?? "DATA_SOURCE_FAILURE",
        payload: html.slice(0, 500),
      });
    });
    return { ok: false, inserted: 0, error: parsed.error };
  }
  const csv = [
    "symbol,date,open,high,low,close,volume",
    ...parsed.rows.map((r) => `${r.symbol},${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume}`),
  ].join("\n");
  const result = importQuotesCsv(csv, "OFFICIAL_BRVM");
  persist((s) => {
    const src = s.sources.find((x) => x.id === "src-official-brvm");
    if (src) src.lastSuccessfulSync = new Date().toISOString();
  });
  return { ok: true, inserted: result.inserted };
}

export function ingestCsv(kind: "quotes" | "dividends" | "financials", text: string) {
  if (kind === "quotes") return importQuotesCsv(text);
  if (kind === "dividends") return importDividendsCsv(text);
  return importFinancialsCsv(text);
}
