import { importQuotesCsv, runAnalysis } from "@/modules/application/catalog";
import {
  fetchOfficialListingHtml,
  parseOfficialListingHtml,
  syncOfficialListing,
} from "@/infrastructure/ingestion/listing-sync";
import { ensureSeeded } from "@/infrastructure/seed/brvm-seed";
import { persist } from "@/infrastructure/persistence/file-store";

/** Rafraîchit liste + cours du jour depuis la page officielle BRVM, puis recalcule. */
export async function refreshMarketPrices(options?: {
  allowNetwork?: boolean;
  html?: string;
}): Promise<{
  ok: boolean;
  quotesUpdated: number;
  listingCount: number;
  analyzed: number;
  asOf: string;
  source: string;
  error?: string;
}> {
  ensureSeeded();
  const asOf = new Date().toISOString().slice(0, 10);
  const allowNetwork = options?.allowNetwork !== false;

  let html = options?.html ?? "";
  if (!html && allowNetwork) {
    try {
      html = await fetchOfficialListingHtml();
    } catch (error) {
      return {
        ok: false,
        quotesUpdated: 0,
        listingCount: 0,
        analyzed: 0,
        asOf,
        source: "OFFICIAL_BRVM",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const listing = await syncOfficialListing({
    html: html || undefined,
    asOf,
    allowNetwork: false,
  });

  const items = html ? parseOfficialListingHtml(html) : [];
  const priced = items.filter((i) => i.lastClose != null && i.lastClose > 0);
  let quotesUpdated = 0;
  let source = listing.source;

  if (priced.length > 0) {
    const csv = [
      "symbol,date,open,high,low,close,volume",
      ...priced.map((i) => {
        const px = i.lastClose!;
        return `${i.symbol},${asOf},${px},${px},${px},${px},0`;
      }),
    ].join("\n");
    const result = importQuotesCsv(csv, "OFFICIAL_BRVM");
    quotesUpdated = result.inserted + ("updated" in result ? (result.updated ?? 0) : 0);
    source = "OFFICIAL_BRVM";
    persist((s) => {
      const src = s.sources.find((x) => x.id === "src-official-brvm");
      if (src) src.lastSuccessfulSync = new Date().toISOString();
    });
  }

  const analyzed = runAnalysis(asOf).length;
  const result = {
    ok: listing.ok || quotesUpdated > 0,
    quotesUpdated,
    listingCount: listing.count,
    analyzed,
    asOf,
    source,
    error: listing.ok ? undefined : listing.error,
  };
  console.info(
    `[market-refresh] ok=${result.ok} quotes=${result.quotesUpdated} listing=${result.listingCount} analyzed=${result.analyzed} asOf=${result.asOf} source=${result.source}${result.error ? ` error=${result.error}` : ""}`,
  );
  const { noteMarketRefresh } = await import("@/infrastructure/runtime/market-refresh-state");
  noteMarketRefresh();
  return result;
}
