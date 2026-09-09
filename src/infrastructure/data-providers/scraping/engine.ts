import { parseQuoteCsv } from "@/infrastructure/data-providers/manual-import/csv";
import { normalizeAmount } from "@/shared/normalize";
import type { NormalizedQuoteRow } from "@/infrastructure/data-providers/manual-import/csv";

export interface ScrapingEngineResult {
  ok: boolean;
  version: string;
  rows: NormalizedQuoteRow[];
  error?: string;
  raw: string;
}

export function parseBrvmMarketHtml(html: string, asOf = "2026-08-27"): ScrapingEngineResult {
  const version = "scraper-1";
  const tableMatch = html.match(/<table[^>]*id=["']cours["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    return { ok: false, version, rows: [], error: "DATA_SOURCE_FAILURE: table#cours introuvable", raw: html };
  }
  const rows: NormalizedQuoteRow[] = [];
  const trs = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trs.slice(1)) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim(),
    );
    if (cells.length < 2) continue;
    const parsed = parseQuoteCsv(
      `symbol,date,open,high,low,close,volume\n${cells[0]},${asOf},${cells[1]},${cells[1]},${cells[1]},${cells[1]},${cells[2] ?? 0}`,
    );
    if (parsed.ok && parsed.value.rows[0]) rows.push(parsed.value.rows[0]);
  }
  if (rows.length === 0) {
    return { ok: false, version, rows: [], error: "DATA_SOURCE_FAILURE: aucune ligne parsée", raw: html };
  }
  return { ok: true, version, rows, raw: html };
}

export function parseAmountCell(value: string): number | null {
  return normalizeAmount(value);
}
