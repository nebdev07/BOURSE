import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { AppStore } from "./file-store";
import type { Alert, Company, UserAccount } from "@/modules/shared-kernel/types";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";

type QueryResult = { rows: Array<Record<string, unknown>> };

interface SqlClient {
  query(text: string, params?: unknown[]): Promise<QueryResult>;
}

let client: SqlClient | null = null;
let schemaReady = false;
let pglite: PGlite | null = null;

export function postgresEnabled(): boolean {
  if (process.env.PERSISTENCE_DRIVER === "file") return false;
  if (process.env.BRVM_DISABLE_PG === "1") return false;
  return process.env.PERSISTENCE_DRIVER === "prisma" || process.env.PERSISTENCE_DRIVER === "pglite" || Boolean(process.env.DATABASE_URL);
}

export async function getSql(): Promise<SqlClient> {
  if (client) return client;
  const dataDir = process.env.PGLITE_DATA_DIR ?? `${process.cwd()}/.postgres/pglite`;
  pglite = new PGlite({ dataDir });
  await pglite.waitReady;
  client = {
    async query(text: string, params: unknown[] = []) {
      const result = await pglite!.query(text, params);
      return { rows: (result.rows ?? []) as Array<Record<string, unknown>> };
    },
  };
  return client;
}

export async function ensurePostgresSchema(): Promise<void> {
  if (!postgresEnabled() || schemaReady) return;
  const sqlPath = `${process.cwd()}/prisma/migrations/0001_init.sql`;
  const sql = readFileSync(sqlPath, "utf8");
  const db = await getSql();
  for (const statement of splitSql(sql)) {
    await db.query(statement);
  }
  schemaReady = true;
}

function splitSql(sql: string): string[] {
  return sql
    .replace(/^--.*$/gm, "")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function overlayPlatformFromPostgres(store: AppStore): Promise<void> {
  if (!postgresEnabled()) return;
  await ensurePostgresSchema();
  const db = await getSql();

  const users = await db.query(`SELECT * FROM user_account`);
  if (users.rows.length > 0) store.users = users.rows.map(rowToUser);

  const sessions = await db.query(`SELECT * FROM auth_session`);
  store.sessions = sessions.rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    tokenHash: String(r.token_hash),
    expiresAt: new Date(String(r.expires_at)).toISOString(),
  }));

  const alerts = await db.query(`SELECT * FROM alert`);
  store.alerts = alerts.rows.map(rowToAlert);

  const reports = await db.query(`SELECT * FROM scheduled_report`);
  store.scheduledReports = reports.rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    runAt: new Date(String(r.run_at)).toISOString(),
    type: r.type as "MONTHLY_ANALYSIS" | "CUSTOM",
    email: String(r.email),
    sentAt: r.sent_at ? new Date(String(r.sent_at)).toISOString() : null,
    status: r.status as "PENDING" | "SENT" | "FAILED",
  }));

  const companies = await db.query(`SELECT * FROM company`);
  if (companies.rows.length > 0) {
    const bySymbol = new Map(store.companies.map((c) => [c.symbol, c]));
    for (const r of companies.rows) {
      const mapped = rowToCompany(r);
      bySymbol.set(mapped.symbol, mapped);
    }
    store.companies = [...bySymbol.values()];
  }
}

export async function syncPlatformToPostgres(store: AppStore): Promise<void> {
  if (!postgresEnabled()) return;
  await ensurePostgresSchema();
  const db = await getSql();
  for (const u of store.users) {
    await db.query(
      `INSERT INTO user_account (id, email, name, role, password_hash, password_salt, ruleset, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash,
         password_salt = EXCLUDED.password_salt,
         ruleset = EXCLUDED.ruleset`,
      [u.id, u.email, u.name, u.role, u.passwordHash, u.passwordSalt, JSON.stringify(u.ruleset), u.createdAt],
    );
  }
  await db.query("DELETE FROM auth_session");
  for (const s of store.sessions) {
    await db.query(`INSERT INTO auth_session (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)`, [
      s.id,
      s.userId,
      s.tokenHash,
      s.expiresAt,
    ]);
  }
  await db.query("DELETE FROM alert");
  for (const a of store.alerts) {
    await db.query(
      `INSERT INTO alert (id, user_id, symbol, type, threshold, recommendation, active, note, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [a.id, a.userId, a.symbol, a.type, a.threshold, a.recommendation, a.active, a.note, a.createdAt],
    );
  }
  for (const c of store.companies) {
    await db.query(
      `INSERT INTO company (id, symbol, name, sector, country, listing_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (symbol) DO UPDATE SET
         name = EXCLUDED.name,
         sector = EXCLUDED.sector,
         country = EXCLUDED.country,
         status = EXCLUDED.status`,
      [c.id, c.symbol, c.name, c.sector, c.country, c.listingDate, c.status],
    );
  }
  for (const r of store.scheduledReports) {
    await db.query(
      `INSERT INTO scheduled_report (id, user_id, run_at, type, email, sent_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET sent_at = EXCLUDED.sent_at, status = EXCLUDED.status`,
      [r.id, r.userId, r.runAt, r.type, r.email, r.sentAt, r.status],
    );
  }
}

export interface ListingItem {
  symbol: string;
  name: string;
  lastClose: number | null;
}

export async function insertListingSnapshot(input: {
  asOf: string;
  source: string;
  sourceType: string;
  sourceUrl: string | null;
  items: ListingItem[];
  changed: boolean;
}): Promise<{ id: string; fingerprint: string; changed: boolean }> {
  await ensurePostgresSchema();
  const db = await getSql();
  const fingerprint = input.items
    .map((i) => i.symbol)
    .sort()
    .join(",");
  const id = randomUUID();
  await db.query(
    `INSERT INTO listing_snapshot (id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count)
     VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8)`,
    [id, input.asOf, input.source, input.sourceType, input.sourceUrl, fingerprint, input.changed, input.items.length],
  );
  for (const item of input.items) {
    await db.query(
      `INSERT INTO listing_snapshot_item (id, snapshot_id, symbol, name, last_close) VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), id, item.symbol, item.name, item.lastClose],
    );
  }
  return { id, fingerprint, changed: input.changed };
}

export async function latestListingFingerprint(): Promise<string | null> {
  if (!postgresEnabled()) return null;
  await ensurePostgresSchema();
  const res = await (await getSql()).query(`SELECT fingerprint FROM listing_snapshot ORDER BY retrieved_at DESC LIMIT 1`);
  return res.rows[0] ? String(res.rows[0].fingerprint) : null;
}

export async function listListingSnapshots(limit = 20) {
  if (!postgresEnabled()) return [];
  await ensurePostgresSchema();
  const res = await (await getSql()).query(
    `SELECT id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count
     FROM listing_snapshot ORDER BY retrieved_at DESC LIMIT $1`,
    [limit],
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    asOf: r.as_of,
    retrievedAt: r.retrieved_at,
    source: String(r.source),
    sourceType: String(r.source_type),
    sourceUrl: r.source_url ? String(r.source_url) : null,
    fingerprint: String(r.fingerprint),
    changed: Boolean(r.changed),
    itemCount: Number(r.item_count),
  }));
}

function rowToUser(r: Record<string, unknown>): UserAccount {
  const raw = r.ruleset;
  const ruleset = (typeof raw === "string" ? JSON.parse(raw) : raw) as RulesetParams;
  return {
    id: String(r.id),
    email: String(r.email),
    name: String(r.name),
    role: r.role === "admin" ? "admin" : "user",
    passwordHash: String(r.password_hash),
    passwordSalt: String(r.password_salt),
    ruleset: ruleset ?? { ...DEFAULT_RULESET },
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

function rowToAlert(r: Record<string, unknown>): Alert {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    symbol: r.symbol ? String(r.symbol) : null,
    type: r.type as Alert["type"],
    threshold: r.threshold === null || r.threshold === undefined ? null : Number(r.threshold),
    recommendation: r.recommendation ? (r.recommendation as Alert["recommendation"]) : null,
    active: Boolean(r.active),
    note: r.note ? String(r.note) : null,
    createdAt: new Date(String(r.created_at)).toISOString().slice(0, 10),
  };
}

function rowToCompany(r: Record<string, unknown>): Company {
  return {
    id: String(r.id),
    symbol: String(r.symbol),
    name: String(r.name),
    sector: String(r.sector),
    country: String(r.country),
    listingDate: r.listing_date ? new Date(String(r.listing_date)).toISOString().slice(0, 10) : null,
    status: r.status as Company["status"],
  };
}
