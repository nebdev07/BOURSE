import type { PortfolioTransaction } from "@/modules/shared-kernel/types";

export interface OpenLot {
  quantity: number;
  unitPrice: number;
  tradedAt: string | null;
  note: string | null;
  transactionId: string;
}

export interface RebuiltPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  costBasis: number;
  lots: OpenLot[];
  realizedPnL: number;
  firstPurchaseAt: string | null;
  lastTradeAt: string | null;
}

export interface LedgerResult {
  positions: RebuiltPosition[];
  bySymbol: Map<string, RebuiltPosition>;
  closedSymbols: string[];
  /** P&L réalisé par symbole (y compris positions fermées). */
  realizedBySymbol: Map<string, number>;
}

type LotState = OpenLot;

/**
 * Reconstruit les positions à partir de l’historique (FIFO sur les cessions).
 * Les lots restants gardent leur prix et leur date d’achat d’origine.
 */
export function rebuildPositionsFromTransactions(
  transactions: Array<Pick<PortfolioTransaction, "id" | "symbol" | "side" | "quantity" | "unitPrice" | "tradedAt" | "note">>,
): LedgerResult {
  const sorted = [...transactions].sort((a, b) => {
    const da = a.tradedAt ?? "";
    const db = b.tradedAt ?? "";
    if (da !== db) return da.localeCompare(db);
    return a.id.localeCompare(b.id);
  });

  const lotsBySymbol = new Map<string, LotState[]>();
  const realizedBySymbol = new Map<string, number>();
  const lastTrade = new Map<string, string | null>();
  const touched = new Set<string>();

  for (const tx of sorted) {
    touched.add(tx.symbol);
    lastTrade.set(tx.symbol, tx.tradedAt);
    const lots = lotsBySymbol.get(tx.symbol) ?? [];
    lotsBySymbol.set(tx.symbol, lots);

    if (tx.side === "BUY") {
      lots.push({
        quantity: tx.quantity,
        unitPrice: tx.unitPrice,
        tradedAt: tx.tradedAt,
        note: tx.note,
        transactionId: tx.id,
      });
      continue;
    }

    // SELL — FIFO
    let remaining = tx.quantity;
    let realized = realizedBySymbol.get(tx.symbol) ?? 0;
    while (remaining > 0 && lots.length > 0) {
      const lot = lots[0]!;
      const take = Math.min(remaining, lot.quantity);
      realized += (tx.unitPrice - lot.unitPrice) * take;
      lot.quantity -= take;
      remaining -= take;
      if (lot.quantity <= 1e-9) lots.shift();
    }
    realizedBySymbol.set(tx.symbol, realized);
  }

  const positions: RebuiltPosition[] = [];
  const closedSymbols: string[] = [];

  for (const symbol of [...touched].sort()) {
    const lots = (lotsBySymbol.get(symbol) ?? []).filter((l) => l.quantity > 1e-9);
    const quantity = lots.reduce((s, l) => s + l.quantity, 0);
    const costBasis = lots.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    if (quantity <= 1e-9) {
      closedSymbols.push(symbol);
      continue;
    }
    const firstPurchaseAt =
      lots
        .map((l) => l.tradedAt)
        .filter((d): d is string => Boolean(d))
        .sort()[0] ?? null;
    positions.push({
      symbol,
      quantity,
      avgCost: costBasis / quantity,
      costBasis,
      lots,
      realizedPnL: realizedBySymbol.get(symbol) ?? 0,
      firstPurchaseAt,
      lastTradeAt: lastTrade.get(symbol) ?? null,
    });
  }

  return {
    positions,
    bySymbol: new Map(positions.map((p) => [p.symbol, p])),
    closedSymbols,
    realizedBySymbol,
  };
}
