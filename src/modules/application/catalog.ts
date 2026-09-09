import { persist, uid, loadStore } from "@/infrastructure/persistence/file-store";
import { analyzeCompany } from "@/modules/analysis/domain/analyze";
import { recommend } from "@/modules/recommendation/domain/recommend";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";
import type {
  Company,
  Dividend,
  FinancialStatement,
  MarketQuote,
  RecommendationSnapshot,
  AnalysisResult,
} from "@/modules/shared-kernel/types";
import { provenance } from "@/shared/provenance";
import { parseDividendCsv, parseFinancialCsv, parseQuoteCsv } from "@/infrastructure/data-providers/manual-import/csv";
import { totalReturn } from "@/modules/analysis/domain/finance-math";

export function getRuleset(): RulesetParams {
  const store = loadStore();
  return store.rulesets.find((r) => r.version === store.activeRulesetVersion) ?? DEFAULT_RULESET;
}

export function listCompanies(): Company[] {
  return loadStore().companies.filter((c) => c.status !== "DELISTED");
}

export function getCompany(symbol: string): Company | null {
  return loadStore().companies.find((c) => c.symbol === symbol.toUpperCase()) ?? null;
}

export function quotesOf(symbol: string): MarketQuote[] {
  return loadStore()
    .quotes.filter((q) => q.symbol === symbol.toUpperCase())
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function dividendsOf(symbol: string): Dividend[] {
  return loadStore()
    .dividends.filter((d) => d.symbol === symbol.toUpperCase())
    .sort((a, b) => a.exerciseYear - b.exerciseYear);
}

export function financialsOf(symbol: string): FinancialStatement[] {
  return loadStore()
    .financials.filter((f) => f.symbol === symbol.toUpperCase())
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}

export function latestAnalysis(symbol: string): AnalysisResult | null {
  const all = loadStore().analyses.filter((a) => a.symbol === symbol.toUpperCase());
  return all.at(-1) ?? null;
}

export function recommendationHistory(symbol: string): RecommendationSnapshot[] {
  return loadStore()
    .recommendations.filter((r) => r.symbol === symbol.toUpperCase())
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function latestRecommendations(): RecommendationSnapshot[] {
  const store = loadStore();
  const bySymbol = new Map<string, RecommendationSnapshot>();
  for (const rec of store.recommendations) {
    const prev = bySymbol.get(rec.symbol);
    if (!prev || rec.date >= prev.date) bySymbol.set(rec.symbol, rec);
  }
  return [...bySymbol.values()].sort((a, b) => b.score - a.score);
}

export function runAnalysis(asOf?: string): AnalysisResult[] {
  const date = asOf ?? new Date().toISOString().slice(0, 10);
  const rules = getRuleset();
  return persist((store) => {
    const results: AnalysisResult[] = [];
    for (const company of store.companies) {
      if (company.status === "DELISTED") continue;
      const analysis = analyzeCompany(
        {
          symbol: company.symbol,
          asOf: date,
          quotes: store.quotes.filter((q) => q.symbol === company.symbol),
          dividends: store.dividends.filter((d) => d.symbol === company.symbol),
          financials: store.financials.filter((f) => f.symbol === company.symbol),
        },
        rules,
      );
      const decision = recommend(analysis, rules);
      results.push(analysis);
      store.analyses = store.analyses.filter((a) => !(a.symbol === company.symbol && a.asOf === date));
      store.analyses.push(analysis);
      const snapshot: RecommendationSnapshot = { id: uid(), ...decision.snapshot };
      store.recommendations = store.recommendations.filter(
        (r) => !(r.symbol === company.symbol && r.date === date && r.rulesVersion === rules.version),
      );
      store.recommendations.push(snapshot);
      updatePerformance(store, snapshot, date);
    }
    return results;
  });
}

function updatePerformance(
  store: import("@/infrastructure/persistence/file-store").AppStore,
  snapshot: RecommendationSnapshot,
  asOf: string,
) {
  const horizons: Array<30 | 90 | 180 | 365> = [30, 90, 180, 365];
  for (const h of horizons) {
    const from = addDays(snapshot.date, h);
    if (from > asOf) continue;
    const quotes = store.quotes.filter((q) => q.symbol === snapshot.symbol).sort((a, b) => a.date.localeCompare(b.date));
    const later = [...quotes].reverse().find((q) => q.date <= from) ?? quotes.at(-1);
    if (!later) continue;
    const divs = store.dividends
      .filter((d) => d.symbol === snapshot.symbol && `${d.exerciseYear}-12-31` > snapshot.date && `${d.exerciseYear}-12-31` <= later.date)
      .reduce((a, d) => a + d.grossAmount, 0);
    const idxStart = [...store.indexQuotes].reverse().find((q) => q.date <= snapshot.date);
    const idxEnd = [...store.indexQuotes].reverse().find((q) => q.date <= later.date);
    const indexReturn =
      idxStart && idxEnd && idxStart.close > 0 ? ((idxEnd.close - idxStart.close) / idxStart.close) * 100 : null;
    const tr = totalReturn(later.close, divs, snapshot.price);
    store.performance = store.performance.filter(
      (p) => !(p.symbol === snapshot.symbol && p.snapshotDate === snapshot.date && p.horizonDays === h),
    );
    store.performance.push({
      symbol: snapshot.symbol,
      snapshotDate: snapshot.date,
      horizonDays: h,
      priceReturn: snapshot.price > 0 ? ((later.close - snapshot.price) / snapshot.price) * 100 : null,
      dividendReturn: snapshot.price > 0 ? (divs / snapshot.price) * 100 : null,
      totalReturn: tr,
      indexReturn,
    });
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function importQuotesCsv(text: string, source = "MANUAL") {
  const parsed = parseQuoteCsv(text);
  if (!parsed.ok) return { inserted: 0, rejected: 0, errors: [parsed.error] };
  return persist((store) => {
    const known = new Set(store.companies.map((c) => c.symbol));
    let inserted = 0;
    const errors: string[] = [];
    const runId = uid();
    store.rawDocuments.push({
      id: uid(),
      kind: "MARKET",
      source,
      fetchedAt: new Date().toISOString(),
      contentType: "text/csv",
      payload: text,
      parserVersion: "csv-1",
    });
    for (const row of parsed.value.rejected) errors.push(`Ligne ${row.row}: ${row.reason}`);
    for (const row of parsed.value.rows) {
      if (!known.has(row.symbol)) {
        errors.push(`${row.symbol}: société inconnue`);
        continue;
      }
      const existing = store.quotes.find((q) => q.symbol === row.symbol && q.date === row.date);
      const next: MarketQuote = {
        id: existing?.id ?? uid(),
        symbol: row.symbol,
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        adjustedClose: row.close,
        provenance: provenance({
          source,
          sourceType: source === "OFFICIAL_BRVM" ? "OFFICIAL_BRVM" : "MANUAL",
          referenceDate: row.date,
        }),
      };
      if (existing && existing.close !== next.close) {
        store.quoteRevisions.push({
          id: uid(),
          entityId: existing.id,
          previous: existing,
          next,
          changedAt: new Date().toISOString(),
          reason: "correction source",
          source,
        });
        Object.assign(existing, next, { id: existing.id });
      } else if (!existing) {
        store.quotes.push(next);
        inserted += 1;
      }
    }
    store.ingestionRuns.push({
      id: runId,
      source,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      recordsFetched: parsed.value.rows.length,
      recordsInserted: inserted,
      recordsRejected: parsed.value.rejected.length + errors.length,
      errors,
    });
    const src = store.sources.find((s) => s.type === "MANUAL");
    if (src) src.lastSuccessfulSync = new Date().toISOString();
    return { inserted, rejected: parsed.value.rejected.length, errors };
  });
}

export function importDividendsCsv(text: string, source = "MANUAL") {
  const parsed = parseDividendCsv(text);
  if (!parsed.ok) return { inserted: 0, rejected: 0, errors: [parsed.error] };
  return persist((store) => {
    const known = new Set(store.companies.map((c) => c.symbol));
    let inserted = 0;
    const errors: string[] = [...parsed.value.rejected.map((r) => `Ligne ${r.row}: ${r.reason}`)];
    store.rawDocuments.push({
      id: uid(),
      kind: "DIVIDEND",
      source,
      fetchedAt: new Date().toISOString(),
      contentType: "text/csv",
      payload: text,
      parserVersion: "csv-1",
    });
    for (const row of parsed.value.rows) {
      if (!known.has(row.symbol)) {
        errors.push(`${row.symbol}: société inconnue`);
        continue;
      }
      const company = store.companies.find((c) => c.symbol === row.symbol)!;
      const existing = store.dividends.find((d) => d.symbol === row.symbol && d.exerciseYear === row.exerciseYear);
      const next: Dividend = {
        id: existing?.id ?? uid(),
        companyId: company.id,
        symbol: row.symbol,
        exerciseYear: row.exerciseYear,
        grossAmount: row.grossAmount,
        netAmount: row.netAmount,
        currency: "XOF",
        announcementDate: row.announcementDate,
        paymentDate: row.paymentDate,
        provenance: provenance({
          source,
          sourceType: source === "OFFICIAL_DOC" ? "OFFICIAL_DOC" : "MANUAL",
          referenceDate: `${row.exerciseYear}-12-31`,
        }),
      };
      if (existing && existing.grossAmount !== next.grossAmount) {
        store.dividendRevisions.push({
          id: uid(),
          entityId: existing.id,
          previous: { ...existing },
          next,
          changedAt: new Date().toISOString(),
          reason: "correction source",
          source,
        });
        Object.assign(existing, next, { id: existing.id });
      } else if (!existing) {
        store.dividends.push(next);
        inserted += 1;
      }
    }
    store.ingestionRuns.push({
      id: uid(),
      source,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      recordsFetched: parsed.value.rows.length,
      recordsInserted: inserted,
      recordsRejected: errors.length,
      errors,
    });
    return { inserted, rejected: errors.length, errors };
  });
}

export function importFinancialsCsv(text: string, source = "MANUAL") {
  const parsed = parseFinancialCsv(text);
  if (!parsed.ok) return { inserted: 0, rejected: 0, errors: [parsed.error] };
  return persist((store) => {
    const known = new Set(store.companies.map((c) => c.symbol));
    let inserted = 0;
    const errors: string[] = [...parsed.value.rejected.map((r) => `Ligne ${r.row}: ${r.reason}`)];
    store.rawDocuments.push({
      id: uid(),
      kind: "FINANCIAL",
      source,
      fetchedAt: new Date().toISOString(),
      contentType: "text/csv",
      payload: text,
      parserVersion: "csv-1",
    });
    for (const row of parsed.value.rows) {
      if (!known.has(row.symbol)) {
        errors.push(`${row.symbol}: société inconnue`);
        continue;
      }
      const company = store.companies.find((c) => c.symbol === row.symbol)!;
      const existing = store.financials.find((f) => f.symbol === row.symbol && f.fiscalYear === row.fiscalYear);
      const next: FinancialStatement = {
        id: existing?.id ?? uid(),
        companyId: company.id,
        symbol: row.symbol,
        fiscalYear: row.fiscalYear,
        revenue: row.revenue,
        netIncome: row.netIncome,
        eps: row.eps,
        roe: row.roe,
        debt: row.debt,
        equity: row.equity,
        cashFlow: row.cashFlow,
        sharesOutstanding: row.sharesOutstanding,
        provenance: provenance({
          source,
          sourceType: source === "OFFICIAL_DOC" ? "OFFICIAL_DOC" : "MANUAL",
          referenceDate: `${row.fiscalYear}-12-31`,
        }),
      };
      if (existing && existing.eps !== next.eps) {
        store.financialRevisions.push({
          id: uid(),
          entityId: existing.id,
          previous: { ...existing },
          next,
          changedAt: new Date().toISOString(),
          reason: "correction source",
          source,
        });
        Object.assign(existing, next, { id: existing.id });
      } else if (!existing) {
        store.financials.push(next);
        inserted += 1;
      }
    }
    store.ingestionRuns.push({
      id: uid(),
      source,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      recordsFetched: parsed.value.rows.length,
      recordsInserted: inserted,
      recordsRejected: errors.length,
      errors,
    });
    return { inserted, rejected: errors.length, errors };
  });
}
