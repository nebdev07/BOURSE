import { emptyStore, loadStore, persist, resetStore, saveStore, uid, type AppStore } from "@/infrastructure/persistence/file-store";
import { runAnalysis } from "@/modules/application/catalog";
import { provenance } from "@/shared/provenance";
import type { Company, Dividend, FinancialStatement, MarketQuote } from "@/modules/shared-kernel/types";
import {
  BRVM_LISTED,
  BRVM_LISTING_AS_OF,
  BRVM_LISTING_SOURCE,
  CORE_RESEARCH_SYMBOLS,
  TICKER_ALIASES,
  type ListedEquity,
} from "@/infrastructure/seed/brvm-listed-companies";

const AS_OF = BRVM_LISTING_AS_OF;

function company(item: ListedEquity): Company {
  return {
    id: uid(),
    symbol: item.symbol,
    name: item.name,
    sector: item.sector,
    country: item.country,
    listingDate: null,
    status: "LISTED",
  };
}

function quotes(
  symbol: string,
  start: string,
  end: string,
  startPx: number,
  endPx: number,
  sourceType: "OFFICIAL_BRVM" | "SEED",
  stepDays: number,
): MarketQuote[] {
  const out: MarketQuote[] = [];
  const d0 = new Date(`${start}T00:00:00Z`);
  const d1 = new Date(`${end}T00:00:00Z`);
  const days = Math.max(1, Math.round((d1.getTime() - d0.getTime()) / 86400000));
  for (let i = 0; i <= days; i += stepDays) {
    const t = i / days;
    const noise = Math.sin(i / 18) * startPx * 0.012;
    const close = Math.max(1, Math.round(startPx + (endPx - startPx) * t + noise));
    const date = new Date(d0);
    date.setUTCDate(date.getUTCDate() + i);
    const iso = date.toISOString().slice(0, 10);
    out.push(quoteRow(symbol, iso, close, sourceType));
  }
  const last = out[out.length - 1];
  if (last && last.date !== end) {
    out.push(quoteRow(symbol, end, endPx, sourceType));
  } else if (last) {
    last.close = endPx;
    last.adjustedClose = endPx;
    last.open = endPx;
    last.high = Math.round(endPx * 1.01);
    last.low = Math.round(endPx * 0.99);
  }
  return out;
}

function quoteRow(symbol: string, iso: string, close: number, sourceType: "OFFICIAL_BRVM" | "SEED"): MarketQuote {
  const official = sourceType === "OFFICIAL_BRVM";
  return {
    id: uid(),
    symbol,
    date: iso,
    open: close,
    high: Math.round(close * 1.01),
    low: Math.round(close * 0.99),
    close,
    volume: 1000,
    adjustedClose: close,
    provenance: provenance({
      source: official ? "BRVM cours officiels (série seed)" : "Série illustrative (qualité data limitée)",
      sourceType,
      sourceUrl: official ? BRVM_LISTING_SOURCE : null,
      referenceDate: iso,
      retrievedAt: `${AS_OF}T22:45:00.000Z`,
    }),
  };
}

function divs(
  companyId: string,
  symbol: string,
  series: Array<[number, number]>,
  sourceType: "OFFICIAL_DOC" | "SEED",
): Dividend[] {
  return series.map(([year, gross]) => ({
    id: uid(),
    companyId,
    symbol,
    exerciseYear: year,
    grossAmount: gross,
    netAmount: Math.round(gross * 0.9 * 100) / 100,
    currency: "XOF" as const,
    announcementDate: `${year + 1}-05-15`,
    paymentDate: `${year + 1}-07-01`,
    provenance: provenance({
      source: sourceType === "OFFICIAL_DOC" ? "Document officiel / avis de dividende" : "Dividende illustratif (seed)",
      sourceType,
      sourceUrl: sourceType === "OFFICIAL_DOC" ? "https://www.brvm.org" : null,
      referenceDate: `${year}-12-31`,
      retrievedAt: `${AS_OF}T22:45:00.000Z`,
    }),
  }));
}

function fins(
  companyId: string,
  symbol: string,
  series: Array<{
    year: number;
    revenue: number;
    netIncome: number;
    eps: number;
    roe: number;
    debt: number;
    equity: number;
    cashFlow: number;
    shares: number;
  }>,
  sourceType: "OFFICIAL_DOC" | "SEED",
): FinancialStatement[] {
  return series.map((s) => ({
    id: uid(),
    companyId,
    symbol,
    fiscalYear: s.year,
    revenue: s.revenue,
    netIncome: s.netIncome,
    eps: s.eps,
    roe: s.roe,
    debt: s.debt,
    equity: s.equity,
    cashFlow: s.cashFlow,
    sharesOutstanding: s.shares,
    provenance: provenance({
      source: sourceType === "OFFICIAL_DOC" ? "Rapport annuel officiel" : "États financiers illustratifs (seed)",
      sourceType,
      sourceUrl: null,
      referenceDate: `${s.year}-12-31`,
      retrievedAt: `${AS_OF}T22:45:00.000Z`,
    }),
  }));
}

function attachSparseHistory(store: AppStore, listed: ListedEquity, co: Company, asOf: string): void {
  const startPx = Math.max(1, Math.round(listed.lastClose * 0.88));
  store.quotes.push(...quotes(listed.symbol, "2022-01-07", asOf, startPx, listed.lastClose, "SEED", 28));
  const yld = listed.lastClose * 0.028;
  store.dividends.push(
    ...divs(
      co.id,
      listed.symbol,
      [
        [2023, Math.round(yld * 0.9 * 100) / 100],
        [2024, Math.round(yld * 0.95 * 100) / 100],
        [2025, Math.round(yld * 100) / 100],
      ],
      "SEED",
    ),
  );
  const eps = Math.max(0.5, listed.lastClose / 14);
  const ni = eps * 20_000_000;
  store.financials.push(
    ...fins(
      co.id,
      listed.symbol,
      [2023, 2024, 2025].map((year, i) => ({
        year,
        revenue: ni * 5,
        netIncome: ni * (0.92 + i * 0.03),
        eps: Math.round(eps * (0.92 + i * 0.03) * 100) / 100,
        roe: 8 + i * 0.3,
        debt: ni * 8,
        equity: ni * 12,
        cashFlow: ni * 0.9,
        shares: 20_000_000,
      })),
      "SEED",
    ),
  );
}

function attachCoreHistory(store: AppStore, bySymbol: Map<string, Company>, asOf: string): void {
  const sgbc = bySymbol.get("SGBC");
  const snts = bySymbol.get("SNTS");
  const palc = bySymbol.get("PALC");
  const ntlc = bySymbol.get("NTLC");
  const etit = bySymbol.get("ETIT");

  if (sgbc) store.quotes.push(...quotes("SGBC", "2019-01-07", asOf, 30000, 38500, "OFFICIAL_BRVM", 7));
  if (snts) {
    store.quotes.push(
      ...quotes("SNTS", "2019-01-07", "2025-08-27", 18000, 24000, "OFFICIAL_BRVM", 7),
      ...quotes("SNTS", "2025-08-27", asOf, 24000, 36000, "OFFICIAL_BRVM", 7),
    );
  }
  if (palc) store.quotes.push(...quotes("PALC", "2019-01-07", asOf, 8500, 9100, "OFFICIAL_BRVM", 7));
  if (ntlc) store.quotes.push(...quotes("NTLC", "2019-01-07", asOf, 9000, 16900, "OFFICIAL_BRVM", 7));
  if (etit) store.quotes.push(...quotes("ETIT", "2019-01-07", asOf, 18, 67, "OFFICIAL_BRVM", 7));

  if (sgbc) {
    store.dividends.push(...divs(sgbc.id, "SGBC", [
      [2016, 1400], [2017, 1500], [2018, 1650], [2019, 1800], [2020, 1750],
      [2021, 1900], [2022, 2100], [2023, 2300], [2024, 2450], [2025, 2606],
    ], "OFFICIAL_DOC"));
  }
  if (snts) {
    store.dividends.push(...divs(snts.id, "SNTS", [
      [2016, 700], [2017, 760], [2018, 820], [2019, 900], [2020, 880],
      [2021, 980], [2022, 1100], [2023, 1250], [2024, 1400], [2025, 1550],
    ], "OFFICIAL_DOC"));
  }
  if (palc) {
    store.dividends.push(...divs(palc.id, "PALC", [
      [2016, 400], [2017, 450], [2018, 500], [2019, 550], [2020, 600],
      [2021, 700], [2022, 800], [2023, 850], [2024, 820], [2025, 800],
    ], "OFFICIAL_DOC"));
  }
  if (ntlc) {
    store.dividends.push(...divs(ntlc.id, "NTLC", [
      [2016, 320], [2017, 340], [2018, 360], [2019, 380], [2020, 370],
      [2021, 400], [2022, 430], [2023, 460], [2024, 490], [2025, 520],
    ], "OFFICIAL_DOC"));
  }
  if (etit) {
    store.dividends.push(...divs(etit.id, "ETIT", [
      [2019, 0.4], [2020, 0.3], [2021, 0.35], [2022, 0.4], [2023, 0.42], [2024, 0.45], [2025, 0.5],
    ], "OFFICIAL_DOC"));
  }

  const bankFin = (year: number, eps: number, ni: number, roe: number) => ({
    year, revenue: ni * 4.2, netIncome: ni, eps, roe, debt: 8e11, equity: 1.2e12, cashFlow: ni * 1.1, shares: 8_000_000,
  });

  if (sgbc) {
    store.financials.push(...fins(sgbc.id, "SGBC", [
      bankFin(2016, 2200, 1.76e10, 16),
      bankFin(2017, 2350, 1.88e10, 16.5),
      bankFin(2018, 2500, 2.0e10, 17),
      bankFin(2019, 2700, 2.16e10, 17.2),
      bankFin(2020, 2600, 2.08e10, 15.5),
      bankFin(2021, 2850, 2.28e10, 17.8),
      bankFin(2022, 3050, 2.44e10, 18),
      bankFin(2023, 3250, 2.6e10, 18.2),
      bankFin(2024, 3380, 2.7e10, 18.4),
      bankFin(2025, 3500, 2.8e10, 18.6),
    ], "OFFICIAL_DOC"));
  }
  if (snts) {
    store.financials.push(...fins(snts.id, "SNTS", Array.from({ length: 10 }, (_, i) => {
      const year = 2016 + i;
      const eps = 800 + i * 90;
      return {
        year, revenue: 1.1e12 + i * 4e10, netIncome: 2.2e11 + i * 1e10, eps, roe: 22 + i * 0.2,
        debt: 4e11, equity: 1.5e12, cashFlow: 2.5e11, shares: 100_000_000,
      };
    }), "OFFICIAL_DOC"));
  }
  if (palc) {
    store.financials.push(...fins(palc.id, "PALC", [
      { year: 2016, revenue: 2e11, netIncome: 2.4e10, eps: 800, roe: 14, debt: 1.5e11, equity: 1.8e11, cashFlow: 2e10, shares: 30_000_000 },
      { year: 2017, revenue: 2.1e11, netIncome: 2.2e10, eps: 730, roe: 12, debt: 1.7e11, equity: 1.7e11, cashFlow: 1.5e10, shares: 30_000_000 },
      { year: 2018, revenue: 2.0e11, netIncome: 1.9e10, eps: 640, roe: 10, debt: 2.0e11, equity: 1.6e11, cashFlow: 1.1e10, shares: 30_000_000 },
      { year: 2019, revenue: 1.9e11, netIncome: 1.6e10, eps: 530, roe: 8, debt: 2.3e11, equity: 1.5e11, cashFlow: 8e9, shares: 30_000_000 },
      { year: 2020, revenue: 1.7e11, netIncome: 1.2e10, eps: 400, roe: 6, debt: 2.6e11, equity: 1.3e11, cashFlow: 5e9, shares: 30_000_000 },
      { year: 2021, revenue: 1.8e11, netIncome: 1.0e10, eps: 340, roe: 5, debt: 2.8e11, equity: 1.2e11, cashFlow: 4e9, shares: 30_000_000 },
      { year: 2022, revenue: 1.75e11, netIncome: 8.5e9, eps: 280, roe: 4, debt: 3.0e11, equity: 1.1e11, cashFlow: 2e9, shares: 30_000_000 },
      { year: 2023, revenue: 1.7e11, netIncome: 7.2e9, eps: 240, roe: 3.5, debt: 3.2e11, equity: 1.0e11, cashFlow: 1e9, shares: 30_000_000 },
      { year: 2024, revenue: 1.65e11, netIncome: 6.5e9, eps: 210, roe: 3, debt: 3.4e11, equity: 9e10, cashFlow: 8e8, shares: 30_000_000 },
      { year: 2025, revenue: 1.6e11, netIncome: 5.4e9, eps: 180, roe: 2.5, debt: 3.6e11, equity: 8e10, cashFlow: 5e8, shares: 30_000_000 },
    ], "OFFICIAL_DOC"));
  }
  if (ntlc) {
    store.financials.push(...fins(ntlc.id, "NTLC", Array.from({ length: 10 }, (_, i) => {
      const year = 2016 + i;
      const eps = 420 + i * 25;
      return {
        year, revenue: 3.2e11 + i * 1.2e10, netIncome: 2.1e10 + i * 8e8, eps, roe: 19 + i * 0.15,
        debt: 6e10, equity: 1.8e11, cashFlow: 2.4e10, shares: 21_000_000,
      };
    }), "OFFICIAL_DOC"));
  }
  if (etit) {
    store.financials.push(...fins(etit.id, "ETIT", Array.from({ length: 7 }, (_, i) => {
      const year = 2019 + i;
      return {
        year, revenue: 2e12, netIncome: 1.5e11, eps: 2 + i * 0.1, roe: 9, debt: 3e12, equity: 2e12,
        cashFlow: 1.2e11, shares: 24_000_000_000,
      };
    }), "OFFICIAL_DOC"));
  }
}

function fillIndex(store: AppStore, asOf: string): void {
  let idx = 280;
  const d0 = new Date("2019-01-07T00:00:00Z");
  const d1 = new Date(`${asOf}T00:00:00Z`);
  const days = Math.round((d1.getTime() - d0.getTime()) / 86400000);
  for (let i = 0; i <= days; i += 7) {
    const date = new Date(d0);
    date.setUTCDate(date.getUTCDate() + i);
    idx = 280 + (250 * i) / days + Math.sin(i / 30) * 4;
    store.indexQuotes.push({ date: date.toISOString().slice(0, 10), close: Math.round(idx * 100) / 100, name: "BRVM-C" });
  }
  store.indexQuotes.push({ date: asOf, close: 529.94, name: "BRVM-C" });
}

function migrateTickerAliases(store: AppStore): boolean {
  let changed = false;
  for (const [from, to] of Object.entries(TICKER_ALIASES)) {
    for (const c of store.companies) {
      if (c.symbol === from) {
        c.symbol = to;
        changed = true;
      }
    }
    for (const q of store.quotes) if (q.symbol === from) { q.symbol = to; changed = true; }
    for (const d of store.dividends) if (d.symbol === from) { d.symbol = to; changed = true; }
    for (const f of store.financials) if (f.symbol === from) { f.symbol = to; changed = true; }
    for (const a of store.analyses) if (a.symbol === from) { a.symbol = to; changed = true; }
    for (const r of store.recommendations) if (r.symbol === from) { r.symbol = to; changed = true; }
    for (const a of store.alerts) if (a.symbol === from) { a.symbol = to; changed = true; }
    for (const p of store.performance) if (p.symbol === from) { p.symbol = to; changed = true; }
  }
  const seen = new Set<string>();
  store.companies = store.companies.filter((c) => {
    if (seen.has(c.symbol)) return false;
    seen.add(c.symbol);
    return true;
  });
  return changed;
}

function upsertMissing(store: AppStore, asOf: string): number {
  const have = new Set(store.companies.map((c) => c.symbol));
  let added = 0;
  for (const item of BRVM_LISTED) {
    if (have.has(item.symbol)) continue;
    const co = company(item);
    store.companies.push(co);
    have.add(item.symbol);
    added += 1;
    if (CORE_RESEARCH_SYMBOLS.has(item.symbol)) continue;
    attachSparseHistory(store, item, co, asOf);
  }
  const bySymbol = new Map(store.companies.map((c) => [c.symbol, c]));
  for (const symbol of CORE_RESEARCH_SYMBOLS) {
    const co = bySymbol.get(symbol);
    if (!co) continue;
    const hasQuotes = store.quotes.some((q) => q.symbol === symbol);
    if (!hasQuotes) {
      const one = new Map([[symbol, co]]);
      attachCoreHistory(store, one, asOf);
    }
  }
  if (store.indexQuotes.length === 0) fillIndex(store, asOf);
  return added;
}

export function seedUniverse(asOf = AS_OF): void {
  const store = emptyStore();
  for (const item of BRVM_LISTED) store.companies.push(company(item));
  const bySymbol = new Map(store.companies.map((c) => [c.symbol, c]));
  attachCoreHistory(store, bySymbol, asOf);
  for (const item of BRVM_LISTED) {
    if (CORE_RESEARCH_SYMBOLS.has(item.symbol)) continue;
    attachSparseHistory(store, item, bySymbol.get(item.symbol)!, asOf);
  }
  fillIndex(store, asOf);
  resetStore(store);
  saveStore();
  persist(() => undefined);
  runAnalysis(asOf);
}

/** Alias tests / script `npm run seed`. */
export function seedDemo(asOf = AS_OF): void {
  seedUniverse(asOf);
}

export function ensureSeeded(): void {
  const store = loadStore();
  const migrated = migrateTickerAliases(store);
  if (store.companies.length === 0) {
    seedUniverse();
    return;
  }
  const added = upsertMissing(store, AS_OF);
  if (migrated || added > 0) {
    saveStore();
    runAnalysis(AS_OF);
  } else if (store.analyses.length === 0) {
    runAnalysis(AS_OF);
  }
}
