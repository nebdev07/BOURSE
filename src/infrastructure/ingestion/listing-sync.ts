import { persist, uid } from "@/infrastructure/persistence/file-store";
import {
  insertListingSnapshot,
  latestListingFingerprint,
  postgresEnabled,
  type ListingItem,
} from "@/infrastructure/persistence/postgres";
import { BRVM_LISTED, BRVM_LISTING_AS_OF, BRVM_LISTING_SOURCE } from "@/infrastructure/seed/brvm-listed-companies";

const OFFICIAL_LIST_URL = "https://www.brvm.org/fr/cours-actions/0";

export interface ParsedListing {
  symbol: string;
  name: string;
  lastClose: number | null;
}

/** Parse la page officielle « Cours actions » (séance). */
export function parseOfficialListingHtml(html: string): ParsedListing[] {
  const out = new Map<string, ParsedListing>();
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html))) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );
    if (cells.length < 2) continue;
    const symbol = (cells[0] ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z]{3,6}$/.test(symbol) || symbol === "SYMBOLE") continue;
    const name = cells[1] ?? symbol;
    const closeCell = cells[5] ?? cells[3] ?? cells[2];
    const lastClose = parseFrNumber(closeCell);
    out.set(symbol, { symbol, name, lastClose });
  }
  return [...out.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function parseFrNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function fetchOfficialListingHtml(url = OFFICIAL_LIST_URL): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BRVM-Investment-Analyzer/1.0 (listing-sync)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

export async function syncOfficialListing(options?: {
  html?: string;
  asOf?: string;
  allowNetwork?: boolean;
}): Promise<{
  ok: boolean;
  count: number;
  changed: boolean;
  added: string[];
  delisted: string[];
  source: string;
  error?: string;
}> {
  const asOf = options?.asOf ?? new Date().toISOString().slice(0, 10);
  let items: ParsedListing[] = [];
  let source = "OFFICIAL_BRVM";
  let sourceUrl: string | null = OFFICIAL_LIST_URL;

  try {
    const html =
      options?.html ??
      (options?.allowNetwork === false ? "" : await fetchOfficialListingHtml());
    if (html) items = parseOfficialListingHtml(html);
  } catch (error) {
    return {
      ok: false,
      count: 0,
      changed: false,
      added: [],
      delisted: [],
      source,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (items.length < 20) {
    items = BRVM_LISTED.map((c) => ({ symbol: c.symbol, name: c.name, lastClose: c.lastClose }));
    source = "SEED_FALLBACK";
    sourceUrl = BRVM_LISTING_SOURCE;
  }

  const fingerprint = items
    .map((i) => i.symbol)
    .sort()
    .join(",");
  const previous = postgresEnabled() ? await latestListingFingerprint() : null;
  const changed = previous !== fingerprint;

  persist((store) => {
    const have = new Map(store.companies.map((c) => [c.symbol, c]));
    for (const item of items) {
      const existing = have.get(item.symbol);
      if (existing) {
        existing.name = item.name || existing.name;
        existing.status = "LISTED";
      } else {
        store.companies.push({
          id: uid(),
          symbol: item.symbol,
          name: item.name,
          sector: "Non classé",
          country: "CI",
          listingDate: asOf,
          status: "LISTED",
        });
      }
    }
    const live = new Set(items.map((i) => i.symbol));
    for (const c of store.companies) {
      if (!live.has(c.symbol) && c.status === "LISTED") c.status = "DELISTED";
    }
    store.ingestionRuns.push({
      id: uid(),
      source,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      recordsFetched: items.length,
      recordsInserted: items.filter((i) => !have.has(i.symbol)).length,
      recordsRejected: 0,
      errors: [],
    });
  });

  const added: string[] = [];
  const delisted: string[] = [];
  if (previous) {
    const prevSet = new Set(previous.split(",").filter(Boolean));
    const nextSet = new Set(items.map((i) => i.symbol));
    for (const s of nextSet) if (!prevSet.has(s)) added.push(s);
    for (const s of prevSet) if (!nextSet.has(s)) delisted.push(s);
  } else {
    added.push(...items.map((i) => i.symbol));
  }

  if (postgresEnabled()) {
    await insertListingSnapshot({
      asOf: items.length ? asOf : BRVM_LISTING_AS_OF,
      source,
      sourceType: source === "SEED_FALLBACK" ? "SEED" : "OFFICIAL_BRVM",
      sourceUrl,
      items: items.map<ListingItem>((i) => ({ symbol: i.symbol, name: i.name, lastClose: i.lastClose })),
      changed,
    });
  }

  return { ok: true, count: items.length, changed, added, delisted, source };
}
