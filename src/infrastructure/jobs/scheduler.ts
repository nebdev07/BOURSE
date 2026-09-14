const HOUR_MS = 60 * 60 * 1000;

declare global {
  var __brvmMarketScheduler: { started: boolean; timer?: ReturnType<typeof setInterval> } | undefined;
}

function intervalMs(): number {
  const raw = Number(process.env.MARKET_REFRESH_MS ?? HOUR_MS);
  return Number.isFinite(raw) && raw >= 60_000 ? raw : HOUR_MS;
}

function tickUrl(): string {
  const port = process.env.PORT ?? "3000";
  const base = process.env.APP_URL ?? `http://127.0.0.1:${port}`;
  return `${base.replace(/\/$/, "")}/api/jobs/tick`;
}

/**
 * Planifie un appel HTTP interne vers /api/jobs/tick.
 * Évite d’importer file-store / node:crypto dans instrumentation (Webpack).
 */
export function startMarketRefreshScheduler(): void {
  if (process.env.MARKET_REFRESH_DISABLED === "1") return;
  if (globalThis.__brvmMarketScheduler?.started) return;

  globalThis.__brvmMarketScheduler = { started: true };
  const ms = intervalMs();
  const secret = process.env.JOB_SECRET ?? "";

  const run = () => {
    void fetch(tickUrl(), {
      method: "POST",
      headers: secret ? { "x-job-secret": secret } : {},
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          quotesUpdated?: number;
          listingCount?: number;
          analyzed?: number;
          asOf?: string;
          error?: string;
        };
        if (!res.ok) {
          console.error(`[market-refresh] HTTP ${res.status}`, body);
          return;
        }
        console.info(
          `[market-refresh] ok=${body.ok} quotes=${body.quotesUpdated ?? 0} listing=${body.listingCount ?? 0} analyzed=${body.analyzed ?? 0} asOf=${body.asOf ?? ""}`,
        );
      })
      .catch((error) => {
        console.error("[market-refresh] échec", error);
      });
  };

  setTimeout(run, 20_000);
  globalThis.__brvmMarketScheduler.timer = setInterval(run, ms);
  console.info(`[market-refresh] planifié toutes les ${Math.round(ms / 60000)} min`);
}
