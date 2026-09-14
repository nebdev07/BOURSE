import { NextResponse } from "next/server";
import { loadStore } from "@/infrastructure/persistence/file-store";
import { bootPersistence } from "@/infrastructure/persistence/boot";
import { getSql, postgresEnabled, sqlDialect } from "@/infrastructure/persistence/postgres";
import { packageVersion } from "@/infrastructure/runtime/version";
import { getLastMarketRefreshAt } from "@/infrastructure/runtime/market-refresh-state";

export const dynamic = "force-dynamic";

export async function GET() {
  await bootPersistence();
  const store = loadStore();
  let mysqlOk = false;
  let mysqlError: string | undefined;
  if (postgresEnabled()) {
    try {
      await (await getSql()).query("SELECT 1 AS ok");
      mysqlOk = true;
    } catch (e) {
      mysqlError = e instanceof Error ? e.message : String(e);
    }
  }

  const status = mysqlOk || !postgresEnabled() ? "ok" : "degraded";
  return NextResponse.json(
    {
      status,
      version: packageVersion(),
      persistenceDriver: process.env.PERSISTENCE_DRIVER ?? "file",
      sqlDialect: postgresEnabled() ? sqlDialect() : null,
      sql: { ok: mysqlOk, error: mysqlError },
      counts: {
        companies: store.companies.length,
        quotes: store.quotes.length,
        analyses: store.analyses.length,
        recommendations: store.recommendations.length,
        users: store.users.length,
      },
      lastMarketRefreshAt: getLastMarketRefreshAt(),
      now: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
