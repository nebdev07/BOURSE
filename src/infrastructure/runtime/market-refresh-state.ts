let lastMarketRefreshAt: string | null = null;

export function noteMarketRefresh(iso = new Date().toISOString()): void {
  lastMarketRefreshAt = iso;
}

export function getLastMarketRefreshAt(): string | null {
  return lastMarketRefreshAt;
}
