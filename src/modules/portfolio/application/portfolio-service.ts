import { loadStore, persist, uid } from "@/infrastructure/persistence/file-store";
import { latestRecommendations, quotesOf } from "@/modules/application/catalog";
import { personalRecommendations } from "@/modules/application/workspace";
import {
  portfolioWeight,
  positionMetrics,
  reinforceStance,
  sumNullable,
  type ReinforceStance,
} from "@/modules/portfolio/domain/metrics";
import { parsePortfolioCsv } from "@/modules/portfolio/domain/import-csv";
import { rebuildPositionsFromTransactions, type OpenLot } from "@/modules/portfolio/domain/ledger";
import type {
  PortfolioHolding,
  PortfolioTransaction,
  RecommendationSnapshot,
} from "@/modules/shared-kernel/types";
import type { AppStore } from "@/infrastructure/persistence/file-store";

export interface PortfolioLineView {
  holding: PortfolioHolding;
  name: string;
  currentPrice: number | null;
  previousClose: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedPnL: number | null;
  unrealizedPnLPct: number | null;
  dayPnL: number | null;
  dayPnLPct: number | null;
  weightPct: number | null;
  status: RecommendationSnapshot["status"] | null;
  reinforce: ReinforceStance;
  reasons: string[];
  risks: string[];
  score: number | null;
  confidence: number | null;
  marginOfSafety: number | null;
  lots: OpenLot[];
  realizedPnL: number;
  transactions: PortfolioTransaction[];
}

export interface PortfolioView {
  lines: PortfolioLineView[];
  totals: {
    marketValue: number;
    costBasis: number;
    unrealizedPnL: number;
    dayPnL: number;
    realizedPnL: number;
  };
  contributors: {
    gainers: PortfolioLineView[];
    losers: PortfolioLineView[];
  };
  closed: Array<{ symbol: string; name: string; realizedPnL: number; transactions: PortfolioTransaction[] }>;
}

function userTxs(store: AppStore, userId: string): PortfolioTransaction[] {
  return store.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => {
      const da = a.tradedAt ?? "";
      const db = b.tradedAt ?? "";
      if (da !== db) return da.localeCompare(db);
      return a.createdAt.localeCompare(b.createdAt);
    });
}

function writeHoldingsFromLedger(store: AppStore, userId: string): void {
  const rebuilt = rebuildPositionsFromTransactions(userTxs(store, userId));
  store.holdings = store.holdings.filter((h) => h.userId !== userId);
  const now = new Date().toISOString();
  for (const pos of rebuilt.positions) {
    store.holdings.push({
      id: uid(),
      userId,
      symbol: pos.symbol,
      quantity: pos.quantity,
      avgCost: pos.avgCost,
      purchasedAt: pos.firstPurchaseAt,
      note: `${pos.lots.length} lot(s) ouvert(s)`,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function listHoldings(userId: string): PortfolioHolding[] {
  return persist((store) => {
    writeHoldingsFromLedger(store, userId);
    return store.holdings.filter((h) => h.userId === userId).sort((a, b) => a.symbol.localeCompare(b.symbol));
  });
}

export function addTransaction(
  userId: string,
  input: {
    symbol: string;
    side?: "BUY" | "SELL";
    quantity: number;
    unitPrice: number;
    tradedAt?: string | null;
    note?: string | null;
  },
): PortfolioTransaction {
  const symbol = input.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const side = input.side ?? "BUY";
  if (!symbol) throw new Error("Symbole requis");
  if (!(input.quantity > 0) || !Number.isFinite(input.quantity)) throw new Error("Quantité invalide");
  if (!(input.unitPrice > 0) || !Number.isFinite(input.unitPrice)) throw new Error("Prix unitaire invalide");

  return persist((store) => {
    const known = store.companies.some((c) => c.symbol === symbol && c.status !== "DELISTED");
    if (!known) throw new Error(`Société inconnue : ${symbol}`);
    const row: PortfolioTransaction = {
      id: uid(),
      userId,
      symbol,
      side,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      tradedAt: input.tradedAt ?? null,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    };
    store.transactions.push(row);
    writeHoldingsFromLedger(store, userId);
    return row;
  });
}

export function createHolding(
  userId: string,
  input: { symbol: string; quantity: number; avgCost: number; purchasedAt?: string | null; note?: string | null },
): PortfolioHolding {
  addTransaction(userId, {
    symbol: input.symbol,
    side: "BUY",
    quantity: input.quantity,
    unitPrice: input.avgCost,
    tradedAt: input.purchasedAt,
    note: input.note,
  });
  const holding = loadStore().holdings.find(
    (h) => h.userId === userId && h.symbol === input.symbol.toUpperCase().replace(/[^A-Z0-9]/g, ""),
  );
  if (!holding) throw new Error("Position introuvable après ajout");
  return holding;
}

export function deleteHolding(userId: string, id: string): boolean {
  return persist((store) => {
    const holding = store.holdings.find((h) => h.id === id && h.userId === userId);
    if (!holding) return false;
    store.transactions = store.transactions.filter(
      (t) => !(t.userId === userId && t.symbol === holding.symbol),
    );
    writeHoldingsFromLedger(store, userId);
    return true;
  });
}

export function getPortfolioView(userId: string): PortfolioView {
  const store = loadStore();
  const txs = userTxs(store, userId);
  const rebuilt = rebuildPositionsFromTransactions(txs);
  const holdings = persist((s) => {
    writeHoldingsFromLedger(s, userId);
    return s.holdings.filter((h) => h.userId === userId);
  });

  const companies = new Map(store.companies.map((c) => [c.symbol, c]));
  const official = new Map(latestRecommendations().map((r) => [r.symbol, r]));
  const personal = new Map(personalRecommendations(userId).map((r) => [r.symbol, r]));

  const draft = holdings.map((holding) => {
    const pos = rebuilt.bySymbol.get(holding.symbol);
    const quotes = quotesOf(holding.symbol);
    const current = quotes.at(-1) ?? null;
    const previous = quotes.length >= 2 ? quotes[quotes.length - 2]! : null;
    const metrics = positionMetrics({
      quantity: holding.quantity,
      avgCost: holding.avgCost,
      currentPrice: current?.close ?? null,
      previousClose: previous?.close ?? null,
    });
    const rec = personal.get(holding.symbol) ?? official.get(holding.symbol) ?? null;
    const stance = reinforceStance(rec?.status);
    return {
      holding,
      name: companies.get(holding.symbol)?.name ?? holding.symbol,
      currentPrice: current?.close ?? null,
      previousClose: previous?.close ?? null,
      ...metrics,
      weightPct: null as number | null,
      status: rec?.status ?? null,
      reinforce: stance,
      reasons: buildReinforceReasons(stance, rec),
      risks: rec?.risks ?? [],
      score: rec?.score ?? null,
      confidence: rec?.confidence ?? null,
      marginOfSafety: rec?.marginOfSafety ?? null,
      lots: pos?.lots ?? [],
      realizedPnL: rebuilt.realizedBySymbol.get(holding.symbol) ?? 0,
      transactions: txs.filter((t) => t.symbol === holding.symbol),
    };
  });

  const totalMarketValue = sumNullable(draft.map((l) => l.marketValue));
  const lines: PortfolioLineView[] = draft.map((line) => ({
    ...line,
    weightPct: portfolioWeight(line.marketValue, totalMarketValue),
  }));

  const byDayDesc = [...lines].sort((a, b) => (b.dayPnL ?? 0) - (a.dayPnL ?? 0));
  const byDayAsc = [...lines].sort((a, b) => (a.dayPnL ?? 0) - (b.dayPnL ?? 0));

  const closed = rebuilt.closedSymbols.map((symbol) => ({
    symbol,
    name: companies.get(symbol)?.name ?? symbol,
    realizedPnL: rebuilt.realizedBySymbol.get(symbol) ?? 0,
    transactions: txs.filter((t) => t.symbol === symbol),
  }));

  return {
    lines,
    totals: {
      marketValue: totalMarketValue,
      costBasis: sumNullable(lines.map((l) => l.costBasis)),
      unrealizedPnL: sumNullable(lines.map((l) => l.unrealizedPnL)),
      dayPnL: sumNullable(lines.map((l) => l.dayPnL)),
      realizedPnL: [...rebuilt.realizedBySymbol.values()].reduce((s, v) => s + v, 0),
    },
    contributors: {
      gainers: byDayDesc.filter((l) => (l.dayPnL ?? 0) > 0).slice(0, 5),
      losers: byDayAsc.filter((l) => (l.dayPnL ?? 0) < 0).slice(0, 5),
    },
    closed,
  };
}

function buildReinforceReasons(stance: ReinforceStance, rec: RecommendationSnapshot | null): string[] {
  if (!rec) return ["Pas encore d'analyse récente pour ce titre."];
  if (stance === "BUY_MORE") {
    return [
      `Signal ${rec.status} : période favorable pour renforcer.`,
      ...rec.reasons.slice(0, 4),
      ...(rec.marginOfSafety != null ? [`Marge de sécurité : ${rec.marginOfSafety.toFixed(1)} %.`] : []),
    ];
  }
  if (stance === "AVOID_ADD") {
    return [`Signal ${rec.status} : ne pas ajouter à la position.`, ...rec.risks.slice(0, 4), ...rec.reasons.slice(0, 2)];
  }
  return [
    `Signal ${rec.status} : conserver, sans renforcer pour l'instant.`,
    ...rec.reasons.slice(0, 3),
    ...rec.risks.slice(0, 2),
  ];
}

export function importHoldingsCsv(
  userId: string,
  text: string,
): {
  imported: number;
  skipped: number;
  format: "platform" | "broker";
  errors: string[];
  portfolio: PortfolioView;
} {
  const parsed = parsePortfolioCsv(text);
  if (!parsed.ok) {
    return { imported: 0, skipped: 0, format: "platform", errors: [parsed.error], portfolio: getPortfolioView(userId) };
  }

  let imported = 0;
  const errors = parsed.value.rejected.map((r) => `Ligne ${r.row}: ${r.reason}`);

  persist((store) => {
    for (const row of parsed.value.rows) {
      try {
        const known = store.companies.some((c) => c.symbol === row.symbol && c.status !== "DELISTED");
        if (!known) throw new Error(`Société inconnue : ${row.symbol}`);
        store.transactions.push({
          id: uid(),
          userId,
          symbol: row.symbol,
          side: row.side,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          tradedAt: row.tradedAt,
          note: row.note,
          createdAt: new Date().toISOString(),
        });
        imported += 1;
      } catch (error) {
        errors.push(`Ligne ${row.sourceRow}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    writeHoldingsFromLedger(store, userId);
  });

  return {
    imported,
    skipped: errors.length,
    format: parsed.value.format,
    errors,
    portfolio: getPortfolioView(userId),
  };
}
