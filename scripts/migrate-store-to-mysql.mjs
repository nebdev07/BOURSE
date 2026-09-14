/**
 * One-shot: push data/store.json (or BRVM_STORE_PATH) into MySQL as source of truth.
 * Loads .env.local / .env when present, then reuses app TypeScript sync helpers.
 *
 * Usage: npm run db:migrate-from-store
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    console.log(`[migrate] loaded env from ${name}`);
  }
}

loadDotEnv();

if (!process.env.PERSISTENCE_DRIVER) process.env.PERSISTENCE_DRIVER = "mysql";
if (!process.env.DATABASE_URL) {
  const host = process.env.MYSQL_HOST ?? "127.0.0.1";
  const port = process.env.MYSQL_PORT ?? "3306";
  const user = process.env.MYSQL_USER ?? "root";
  const password = process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.MYSQL_DATABASE ?? "db_bourse";
  const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  process.env.DATABASE_URL = `mysql://${auth}@${host}:${port}/${database}`;
}

const { loadStore, storePath } = await import("../src/infrastructure/persistence/file-store.ts");
const {
  ensurePostgresSchema,
  postgresEnabled,
  sqlDialect,
  syncPlatformToPostgres,
} = await import("../src/infrastructure/persistence/postgres.ts");

async function main() {
  if (!postgresEnabled()) {
    throw new Error("SQL persistence disabled (PERSISTENCE_DRIVER=file or BRVM_DISABLE_PG=1)");
  }
  if (sqlDialect() !== "mysql") {
    console.warn(`[migrate] dialect is "${sqlDialect()}" — expected mysql; continuing with DATABASE_URL as-is`);
  }

  const store = loadStore();
  console.log(`[migrate] store: ${storePath()}`);
  console.log(
    `[migrate] entities: companies=${store.companies.length} quotes=${store.quotes.length} dividends=${store.dividends.length} financials=${store.financials.length} analyses=${store.analyses.length} recommendations=${store.recommendations.length}`,
  );

  await ensurePostgresSchema();
  await syncPlatformToPostgres(store, { includeCompanies: true, includeMarket: true });
  console.log("[migrate] sync complete (companies + market → MySQL)");
  process.exit(0);
}

main().catch((error) => {
  console.error("[migrate] failed", error);
  process.exit(1);
});
