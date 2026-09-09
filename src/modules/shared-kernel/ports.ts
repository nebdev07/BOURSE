export interface MarketDataProvider {
  getLatestQuote(symbol: string): Promise<import("@/modules/shared-kernel/types").MarketQuote | null>;
  getHistoricalQuotes(
    symbol: string,
    from: Date,
    to: Date,
  ): Promise<import("@/modules/shared-kernel/types").MarketQuote[]>;
}

export interface DividendDataProvider {
  getDividendHistory(symbol: string): Promise<import("@/modules/shared-kernel/types").Dividend[]>;
}

export interface FinancialDataProvider {
  getFinancialHistory(symbol: string): Promise<import("@/modules/shared-kernel/types").FinancialStatement[]>;
}

export interface EmailPort {
  send(input: { to: string; subject: string; text: string; html: string }): Promise<{ ok: boolean; error?: string }>;
}

export interface SchedulerPort {
  name: string;
  trigger(job: "tick" | "ingest" | "analyze"): Promise<void>;
}
