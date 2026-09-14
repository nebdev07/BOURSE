/**
 * Applique prisma/migrations/mysql/*.sql au démarrage conteneur.
 * Utilise DATABASE_URL ou DB_* (même mapping que l’entrypoint).
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";

function buildUrl() {
  const existing = (process.env.DATABASE_URL ?? "").trim();
  if (existing) return existing;
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const name = process.env.DB_NAME;
  const password = process.env.DB_PASSWORD ?? "";
  const port = process.env.DB_PORT ?? "3306";
  if (!host || !user || !name) return "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(name)}`;
}

function parseMysqlUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
  };
}

function splitSql(sql) {
  return sql
    .replace(/^--.*$/gm, "")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const url = buildUrl();
  if (!url) {
    console.log("docker-apply-mysql-schema: pas de DATABASE_URL/DB_* — skip");
    return;
  }
  const cfg = parseMysqlUrl(url);
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    multipleStatements: true,
  });

  const dir = join(process.cwd(), "prisma/migrations/mysql");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const statement of splitSql(sql)) {
      try {
        await conn.query(statement);
        console.log(`OK  ${file}: ${statement.slice(0, 50).replace(/\s+/g, " ")}…`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (/already exists|Duplicate key name|Duplicate column/i.test(msg)) {
          console.log(`SKIP ${file}: ${msg}`);
          continue;
        }
        throw error;
      }
    }
  }

  await conn.end();
  console.log("docker-apply-mysql-schema: schéma OK");
}

main().catch((error) => {
  console.error("docker-apply-mysql-schema:", error);
  process.exit(1);
});
