import { existsSync, readFileSync } from "fs";
import { PGlite } from "@electric-sql/pglite";
import mysql from "mysql2/promise";
import type { AppStore } from "./file-store";
import type {
  Alert,
  AnalysisResult,
  Company,
  Dividend,
  FinancialStatement,
  MarketQuote,
  PortfolioHolding,
  PortfolioTransaction,
  RecommendationSnapshot,
  UserAccount,
} from "@/modules/shared-kernel/types";
import type { Provenance } from "@/shared/provenance";
import { DEFAULT_RULESET, type RulesetParams } from "@/modules/recommendation/domain/ruleset";

function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}

type QueryResult = { rows: Array<Record<string, unknown>> };

interface SqlClient {
  query(text: string, params?: unknown[]): Promise<QueryResult>;
}

type SqlDialect = "pglite" | "mysql";

let client: SqlClient | null = null;
let schemaReady = false;
let pglite: PGlite | null = null;
let dialect: SqlDialect = "pglite";

function databaseUrl(): string {
  return (process.env.DATABASE_URL ?? "").trim();
}

function driverName(): string {
  return (process.env.PERSISTENCE_DRIVER ?? "").trim().toLowerCase();
}

export function sqlDialect(): SqlDialect {
  const driver = driverName();
  const url = databaseUrl();
  if (driver === "mysql" || url.startsWith("mysql://") || url.startsWith("mysql2://")) return "mysql";
  return "pglite";
}

export function postgresEnabled(): boolean {
  if (process.env.PERSISTENCE_DRIVER === "file") return false;
  if (process.env.BRVM_DISABLE_PG === "1") return false;
  const driver = driverName();
  return (
    driver === "prisma" ||
    driver === "pglite" ||
    driver === "mysql" ||
    Boolean(databaseUrl())
  );
}

function parseMysqlUrl(url: string): mysql.PoolOptions {
  const u = new URL(url.replace(/^mysql2:/, "mysql:"));
  return {
    host: u.hostname || "127.0.0.1",
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username || "root"),
    password: decodeURIComponent(u.password || ""),
    database: (u.pathname || "/db_bourse").replace(/^\//, "") || "db_bourse",
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true,
  };
}

/** Convert `$1,$2` + `::jsonb` (PG) into MySQL `?` placeholders. */
function toMysqlSql(text: string): string {
  return text.replace(/::jsonb/gi, "").replace(/\$(\d+)/g, "?");
}

export async function getSql(): Promise<SqlClient> {
  if (client) return client;
  dialect = sqlDialect();

  if (dialect === "mysql") {
    const url =
      databaseUrl() ||
      `mysql://root@127.0.0.1:3306/${process.env.MYSQL_DATABASE ?? "db_bourse"}`;
    const pool = mysql.createPool(parseMysqlUrl(url));
    client = {
      async query(text: string, params: unknown[] = []) {
        const [rows] = await pool.execute(toMysqlSql(text), params as (string | number | boolean | Date | null)[]);
        const list = Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
        return { rows: list };
      },
    };
    return client;
  }

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
  const db = await getSql();
  const folder = dialect === "mysql" ? "prisma/migrations/mysql" : "prisma/migrations";
  const migrations = ["0001_init.sql", "0002_portfolio_holding.sql", "0003_portfolio_transaction.sql"];
  for (const file of migrations) {
    const sqlPath = `${process.cwd()}/${folder}/${file}`;
    if (!existsSync(sqlPath)) continue;
    const sql = readFileSync(sqlPath, "utf8");
    for (const statement of splitSql(sql)) {
      try {
        await db.query(statement);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // Indexes / constraints already present on re-run
        if (!/already exists|Duplicate key name|ER_DUP_KEYNAME/i.test(msg)) throw error;
      }
    }
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

  const holdings = await db.query(`SELECT * FROM portfolio_holding`);
  store.holdings = holdings.rows.map(rowToHolding);

  try {
    const transactions = await db.query(`SELECT * FROM portfolio_transaction`);
    store.transactions = transactions.rows.map(rowToTransaction);
  } catch {
    store.transactions = store.transactions ?? [];
  }

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

  await overlayMarketFromSql(store);
}

/** Hydrate market / analysis / recommendation tables into the in-memory store when SQL has rows. */
export async function overlayMarketFromSql(store: AppStore): Promise<void> {
  if (!postgresEnabled()) return;
  await ensurePostgresSchema();
  const db = await getSql();

  const quotes = await db.query(`SELECT * FROM market_quote`);
  if (quotes.rows.length > 0) {
    store.quotes = quotes.rows.map(rowToQuote);
  }

  const dividends = await db.query(`SELECT * FROM dividend`);
  if (dividends.rows.length > 0) {
    store.dividends = dividends.rows.map(rowToDividend);
  }

  const financials = await db.query(`SELECT * FROM financial_statement`);
  if (financials.rows.length > 0) {
    store.financials = financials.rows.map(rowToFinancial);
  }

  const analyses = await db.query(`SELECT * FROM analysis_result`);
  if (analyses.rows.length > 0) {
    store.analyses = analyses.rows.map(rowToAnalysis);
  }

  const recommendations = await db.query(`SELECT * FROM recommendation_snapshot`);
  if (recommendations.rows.length > 0) {
    store.recommendations = recommendations.rows.map(rowToRecommendation);
  }
}

export async function syncPlatformToPostgres(
  store: AppStore,
  opts: { includeCompanies?: boolean; includeMarket?: boolean } = {},
): Promise<void> {
  if (!postgresEnabled()) return;
  await ensurePostgresSchema();
  const db = await getSql();
  const mysql = dialect === "mysql";
  const includeCompanies = opts.includeCompanies ?? false;
  const includeMarket = opts.includeMarket ?? true;

  for (const u of store.users) {
    if (mysql) {
      await db.query(
        `INSERT INTO user_account (id, email, name, role, password_hash, password_salt, ruleset, created_at)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           role = VALUES(role),
           password_hash = VALUES(password_hash),
           password_salt = VALUES(password_salt),
           ruleset = VALUES(ruleset)`,
        [u.id, u.email, u.name, u.role, u.passwordHash, u.passwordSalt, JSON.stringify(u.ruleset), toSqlDate(u.createdAt)],
      );
    } else {
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
  }

  await db.query("DELETE FROM auth_session");
  for (const s of store.sessions) {
    await db.query(
      mysql
        ? `INSERT INTO auth_session (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), token_hash = VALUES(token_hash), expires_at = VALUES(expires_at)`
        : `INSERT INTO auth_session (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)`,
      [s.id, s.userId, s.tokenHash, toSqlDate(s.expiresAt)],
    );
  }

  await db.query("DELETE FROM alert");
  for (const a of store.alerts) {
    await db.query(
      mysql
        ? `INSERT INTO alert (id, user_id, symbol, type, threshold, recommendation, active, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), symbol = VALUES(symbol), type = VALUES(type),
             threshold = VALUES(threshold), recommendation = VALUES(recommendation), active = VALUES(active),
             note = VALUES(note), created_at = VALUES(created_at)`
        : `INSERT INTO alert (id, user_id, symbol, type, threshold, recommendation, active, note, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [a.id, a.userId, a.symbol, a.type, a.threshold, a.recommendation, a.active ? 1 : 0, a.note, toSqlDate(a.createdAt)],
    );
  }

  await db.query("DELETE FROM portfolio_holding");
  for (const h of store.holdings ?? []) {
    await db.query(
      mysql
        ? `INSERT INTO portfolio_holding (id, user_id, symbol, quantity, avg_cost, purchased_at, note, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), symbol = VALUES(symbol), quantity = VALUES(quantity),
             avg_cost = VALUES(avg_cost), purchased_at = VALUES(purchased_at), note = VALUES(note),
             created_at = VALUES(created_at), updated_at = VALUES(updated_at)`
        : `INSERT INTO portfolio_holding (id, user_id, symbol, quantity, avg_cost, purchased_at, note, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        h.id,
        h.userId,
        h.symbol,
        h.quantity,
        h.avgCost,
        h.purchasedAt,
        h.note,
        toSqlDate(h.createdAt),
        toSqlDate(h.updatedAt),
      ],
    );
  }

  await db.query("DELETE FROM portfolio_transaction");
  for (const t of store.transactions ?? []) {
    await db.query(
      mysql
        ? `INSERT INTO portfolio_transaction (id, user_id, symbol, side, quantity, unit_price, traded_at, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), symbol = VALUES(symbol), side = VALUES(side),
             quantity = VALUES(quantity), unit_price = VALUES(unit_price), traded_at = VALUES(traded_at),
             note = VALUES(note), created_at = VALUES(created_at)`
        : `INSERT INTO portfolio_transaction (id, user_id, symbol, side, quantity, unit_price, traded_at, note, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id, t.userId, t.symbol, t.side, t.quantity, t.unitPrice, t.tradedAt, t.note, toSqlDate(t.createdAt)],
    );
  }

  if (includeCompanies) {
    for (const c of store.companies) {
      if (mysql) {
        await db.query(
          `INSERT INTO company (id, symbol, name, sector, country, listing_date, status)
           VALUES (?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             sector = VALUES(sector),
             country = VALUES(country),
             status = VALUES(status)`,
          [c.id, c.symbol, c.name, c.sector, c.country, c.listingDate, c.status],
        );
      } else {
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
    }
  }

  for (const r of store.scheduledReports) {
    if (mysql) {
      await db.query(
        `INSERT INTO scheduled_report (id, user_id, run_at, type, email, sent_at, status)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE sent_at = VALUES(sent_at), status = VALUES(status)`,
        [r.id, r.userId, toSqlDate(r.runAt), r.type, r.email, r.sentAt ? toSqlDate(r.sentAt) : null, r.status],
      );
    } else {
      await db.query(
        `INSERT INTO scheduled_report (id, user_id, run_at, type, email, sent_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET sent_at = EXCLUDED.sent_at, status = EXCLUDED.status`,
        [r.id, r.userId, r.runAt, r.type, r.email, r.sentAt, r.status],
      );
    }
  }

  if (includeMarket) {
    await syncMarketToSql(store, db, mysql);
  }
}

async function syncMarketToSql(store: AppStore, db: SqlClient, mysql: boolean): Promise<void> {
  for (const q of store.quotes ?? []) {
    const p = q.provenance;
    const params = [
      q.id,
      q.symbol,
      toSqlDateOnly(q.date),
      q.open,
      q.high,
      q.low,
      q.close,
      q.volume,
      q.adjustedClose,
      p.source,
      p.sourceType,
      p.sourceUrl,
      toSqlDate(p.retrievedAt),
      toSqlDateOnly(p.referenceDate),
      p.confidence,
    ];
    if (mysql) {
      await db.query(
        `INSERT INTO market_quote
           (id, symbol, date, open, high, low, close, volume, adjusted_close,
            source, source_type, source_url, retrieved_at, reference_date, confidence)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           open = VALUES(open), high = VALUES(high), low = VALUES(low), close = VALUES(close),
           volume = VALUES(volume), adjusted_close = VALUES(adjusted_close),
           source = VALUES(source), source_type = VALUES(source_type), source_url = VALUES(source_url),
           retrieved_at = VALUES(retrieved_at), reference_date = VALUES(reference_date),
           confidence = VALUES(confidence)`,
        params,
      );
    } else {
      await db.query(
        `INSERT INTO market_quote
           (id, symbol, date, open, high, low, close, volume, adjusted_close,
            source, source_type, source_url, retrieved_at, reference_date, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (symbol, date) DO UPDATE SET
           open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close,
           volume = EXCLUDED.volume, adjusted_close = EXCLUDED.adjusted_close,
           source = EXCLUDED.source, source_type = EXCLUDED.source_type, source_url = EXCLUDED.source_url,
           retrieved_at = EXCLUDED.retrieved_at, reference_date = EXCLUDED.reference_date,
           confidence = EXCLUDED.confidence`,
        params,
      );
    }
  }

  for (const d of store.dividends ?? []) {
    const p = d.provenance;
    const params = [
      d.id,
      d.companyId,
      d.symbol,
      d.exerciseYear,
      d.grossAmount,
      d.netAmount,
      d.currency,
      toSqlDateOnly(d.announcementDate),
      toSqlDateOnly(d.paymentDate),
      p.source,
      p.sourceType,
      p.sourceUrl,
      toSqlDate(p.retrievedAt),
      p.confidence,
    ];
    if (mysql) {
      await db.query(
        `INSERT INTO dividend
           (id, company_id, symbol, exercise_year, gross_amount, net_amount, currency,
            announcement_date, payment_date, source, source_type, source_url, retrieved_at, confidence)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           company_id = VALUES(company_id), gross_amount = VALUES(gross_amount),
           net_amount = VALUES(net_amount), currency = VALUES(currency),
           announcement_date = VALUES(announcement_date), payment_date = VALUES(payment_date),
           source = VALUES(source), source_type = VALUES(source_type), source_url = VALUES(source_url),
           retrieved_at = VALUES(retrieved_at), confidence = VALUES(confidence)`,
        params,
      );
    } else {
      await db.query(
        `INSERT INTO dividend
           (id, company_id, symbol, exercise_year, gross_amount, net_amount, currency,
            announcement_date, payment_date, source, source_type, source_url, retrieved_at, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (symbol, exercise_year) DO UPDATE SET
           company_id = EXCLUDED.company_id, gross_amount = EXCLUDED.gross_amount,
           net_amount = EXCLUDED.net_amount, currency = EXCLUDED.currency,
           announcement_date = EXCLUDED.announcement_date, payment_date = EXCLUDED.payment_date,
           source = EXCLUDED.source, source_type = EXCLUDED.source_type, source_url = EXCLUDED.source_url,
           retrieved_at = EXCLUDED.retrieved_at, confidence = EXCLUDED.confidence`,
        params,
      );
    }
  }

  for (const f of store.financials ?? []) {
    const p = f.provenance;
    const params = [
      f.id,
      f.companyId,
      f.symbol,
      f.fiscalYear,
      f.revenue,
      f.netIncome,
      f.eps,
      f.roe,
      f.debt,
      f.equity,
      f.cashFlow,
      f.sharesOutstanding,
      p.source,
      p.sourceType,
      p.sourceUrl,
      toSqlDate(p.retrievedAt),
      p.confidence,
    ];
    if (mysql) {
      await db.query(
        `INSERT INTO financial_statement
           (id, company_id, symbol, fiscal_year, revenue, net_income, eps, roe, debt, equity,
            cash_flow, shares_outstanding, source, source_type, source_url, retrieved_at, confidence)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           company_id = VALUES(company_id), revenue = VALUES(revenue), net_income = VALUES(net_income),
           eps = VALUES(eps), roe = VALUES(roe), debt = VALUES(debt), equity = VALUES(equity),
           cash_flow = VALUES(cash_flow), shares_outstanding = VALUES(shares_outstanding),
           source = VALUES(source), source_type = VALUES(source_type), source_url = VALUES(source_url),
           retrieved_at = VALUES(retrieved_at), confidence = VALUES(confidence)`,
        params,
      );
    } else {
      await db.query(
        `INSERT INTO financial_statement
           (id, company_id, symbol, fiscal_year, revenue, net_income, eps, roe, debt, equity,
            cash_flow, shares_outstanding, source, source_type, source_url, retrieved_at, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (symbol, fiscal_year) DO UPDATE SET
           company_id = EXCLUDED.company_id, revenue = EXCLUDED.revenue, net_income = EXCLUDED.net_income,
           eps = EXCLUDED.eps, roe = EXCLUDED.roe, debt = EXCLUDED.debt, equity = EXCLUDED.equity,
           cash_flow = EXCLUDED.cash_flow, shares_outstanding = EXCLUDED.shares_outstanding,
           source = EXCLUDED.source, source_type = EXCLUDED.source_type, source_url = EXCLUDED.source_url,
           retrieved_at = EXCLUDED.retrieved_at, confidence = EXCLUDED.confidence`,
        params,
      );
    }
  }

  for (const a of store.analyses ?? []) {
    const id = `${a.symbol}-${a.asOf}`;
    const payload = JSON.stringify(a);
    if (mysql) {
      await db.query(
        `INSERT INTO analysis_result (id, symbol, as_of, payload)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
        [id, a.symbol, toSqlDateOnly(a.asOf), payload],
      );
    } else {
      await db.query(
        `INSERT INTO analysis_result (id, symbol, as_of, payload)
         VALUES ($1,$2,$3,$4::jsonb)
         ON CONFLICT (symbol, as_of) DO UPDATE SET payload = EXCLUDED.payload`,
        [id, a.symbol, a.asOf, payload],
      );
    }
  }

  for (const r of store.recommendations ?? []) {
    const params = [
      r.id,
      toSqlDateOnly(r.date),
      r.symbol,
      r.price,
      r.score,
      r.confidence,
      r.dataQuality,
      r.intrinsicValue,
      r.marginOfSafety,
      r.status,
      r.rulesVersion,
      JSON.stringify(r.reasons ?? []),
      JSON.stringify(r.risks ?? []),
      r.targetPrice,
      r.idealEntryPrice,
      r.maximumEntryPrice,
    ];
    if (mysql) {
      await db.query(
        `INSERT INTO recommendation_snapshot
           (id, date, symbol, price, score, confidence, data_quality, intrinsic_value, margin_of_safety,
            status, rules_version, reasons, risks, target_price, ideal_entry_price, maximum_entry_price)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           date = VALUES(date), symbol = VALUES(symbol), price = VALUES(price), score = VALUES(score),
           confidence = VALUES(confidence), data_quality = VALUES(data_quality),
           intrinsic_value = VALUES(intrinsic_value), margin_of_safety = VALUES(margin_of_safety),
           status = VALUES(status), rules_version = VALUES(rules_version),
           reasons = VALUES(reasons), risks = VALUES(risks),
           target_price = VALUES(target_price), ideal_entry_price = VALUES(ideal_entry_price),
           maximum_entry_price = VALUES(maximum_entry_price)`,
        params,
      );
    } else {
      await db.query(
        `INSERT INTO recommendation_snapshot
           (id, date, symbol, price, score, confidence, data_quality, intrinsic_value, margin_of_safety,
            status, rules_version, reasons, risks, target_price, ideal_entry_price, maximum_entry_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date, symbol = EXCLUDED.symbol, price = EXCLUDED.price, score = EXCLUDED.score,
           confidence = EXCLUDED.confidence, data_quality = EXCLUDED.data_quality,
           intrinsic_value = EXCLUDED.intrinsic_value, margin_of_safety = EXCLUDED.margin_of_safety,
           status = EXCLUDED.status, rules_version = EXCLUDED.rules_version,
           reasons = EXCLUDED.reasons, risks = EXCLUDED.risks,
           target_price = EXCLUDED.target_price, ideal_entry_price = EXCLUDED.ideal_entry_price,
           maximum_entry_price = EXCLUDED.maximum_entry_price`,
        params,
      );
    }
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
  const mysql = dialect === "mysql";
  await db.query(
    mysql
      ? `INSERT INTO listing_snapshot (id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count)
         VALUES (?,?,NOW(3),?,?,?,?,?,?)`
      : `INSERT INTO listing_snapshot (id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count)
         VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7,$8)`,
    [id, input.asOf, input.source, input.sourceType, input.sourceUrl, fingerprint, input.changed ? 1 : 0, input.items.length],
  );
  for (const item of input.items) {
    await db.query(
      mysql
        ? `INSERT INTO listing_snapshot_item (id, snapshot_id, symbol, name, last_close) VALUES (?,?,?,?,?)`
        : `INSERT INTO listing_snapshot_item (id, snapshot_id, symbol, name, last_close) VALUES ($1,$2,$3,$4,$5)`,
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
  const mysql = dialect === "mysql";
  const res = await (await getSql()).query(
    mysql
      ? `SELECT id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count
         FROM listing_snapshot ORDER BY retrieved_at DESC LIMIT ?`
      : `SELECT id, as_of, retrieved_at, source, source_type, source_url, fingerprint, changed, item_count
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

function toSqlDate(value: string): string {
  // MySQL DATETIME prefers 'YYYY-MM-DD HH:MM:SS.mmm'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} 00:00:00.000`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 23).replace("T", " ");
}

function toSqlDateOnly(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function parseJsonField<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
}

function rowToProvenance(r: Record<string, unknown>): Provenance {
  const retrievedAt = r.retrieved_at
    ? new Date(String(r.retrieved_at)).toISOString()
    : new Date().toISOString();
  // market_quote has reference_date; dividend / financial_statement do not — fall back to retrieved day.
  const referenceDate = r.reference_date
    ? new Date(String(r.reference_date)).toISOString().slice(0, 10)
    : retrievedAt.slice(0, 10);
  return {
    source: String(r.source ?? "unknown"),
    sourceType: String(r.source_type ?? "MANUAL") as Provenance["sourceType"],
    sourceUrl: r.source_url != null && r.source_url !== "" ? String(r.source_url) : null,
    retrievedAt,
    referenceDate,
    confidence: Number(r.confidence ?? 50),
  };
}

function rowToQuote(r: Record<string, unknown>): MarketQuote {
  return {
    id: String(r.id),
    symbol: String(r.symbol),
    date: new Date(String(r.date)).toISOString().slice(0, 10),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
    adjustedClose: Number(r.adjusted_close),
    provenance: rowToProvenance(r),
  };
}

function rowToDividend(r: Record<string, unknown>): Dividend {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    symbol: String(r.symbol),
    exerciseYear: Number(r.exercise_year),
    grossAmount: Number(r.gross_amount),
    netAmount: Number(r.net_amount),
    currency: "XOF",
    announcementDate: r.announcement_date
      ? new Date(String(r.announcement_date)).toISOString().slice(0, 10)
      : null,
    paymentDate: r.payment_date ? new Date(String(r.payment_date)).toISOString().slice(0, 10) : null,
    provenance: rowToProvenance(r),
  };
}

function nullableNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowToFinancial(r: Record<string, unknown>): FinancialStatement {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    symbol: String(r.symbol),
    fiscalYear: Number(r.fiscal_year),
    revenue: nullableNum(r.revenue),
    netIncome: nullableNum(r.net_income),
    eps: nullableNum(r.eps),
    roe: nullableNum(r.roe),
    debt: nullableNum(r.debt),
    equity: nullableNum(r.equity),
    cashFlow: nullableNum(r.cash_flow),
    sharesOutstanding: nullableNum(r.shares_outstanding),
    provenance: rowToProvenance(r),
  };
}

function rowToAnalysis(r: Record<string, unknown>): AnalysisResult {
  const payload = parseJsonField<AnalysisResult>(r.payload);
  const asOf = r.as_of
    ? new Date(String(r.as_of)).toISOString().slice(0, 10)
    : String(payload?.asOf ?? "");
  return {
    ...payload,
    symbol: String(r.symbol ?? payload?.symbol ?? ""),
    asOf,
  };
}

function rowToRecommendation(r: Record<string, unknown>): RecommendationSnapshot {
  return {
    id: String(r.id),
    date: new Date(String(r.date)).toISOString().slice(0, 10),
    symbol: String(r.symbol),
    price: Number(r.price),
    score: Number(r.score),
    confidence: Number(r.confidence),
    dataQuality: Number(r.data_quality),
    intrinsicValue: nullableNum(r.intrinsic_value),
    marginOfSafety: nullableNum(r.margin_of_safety),
    status: r.status as RecommendationSnapshot["status"],
    rulesVersion: String(r.rules_version),
    reasons: parseJsonField<string[]>(r.reasons) ?? [],
    risks: parseJsonField<string[]>(r.risks) ?? [],
    targetPrice: nullableNum(r.target_price),
    idealEntryPrice: nullableNum(r.ideal_entry_price),
    maximumEntryPrice: nullableNum(r.maximum_entry_price),
  };
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

function rowToHolding(r: Record<string, unknown>): PortfolioHolding {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    symbol: String(r.symbol),
    quantity: Number(r.quantity),
    avgCost: Number(r.avg_cost),
    purchasedAt: r.purchased_at ? new Date(String(r.purchased_at)).toISOString().slice(0, 10) : null,
    note: r.note ? String(r.note) : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function rowToTransaction(r: Record<string, unknown>): PortfolioTransaction {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    symbol: String(r.symbol),
    side: r.side === "SELL" ? "SELL" : "BUY",
    quantity: Number(r.quantity),
    unitPrice: Number(r.unit_price),
    tradedAt: r.traded_at ? new Date(String(r.traded_at)).toISOString().slice(0, 10) : null,
    note: r.note ? String(r.note) : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
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
