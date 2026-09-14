import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";

const root = process.cwd();
const host = process.env.MYSQL_HOST ?? "127.0.0.1";
const port = Number(process.env.MYSQL_PORT ?? 3306);
const user = process.env.MYSQL_USER ?? "root";
const password = process.env.MYSQL_PASSWORD ?? "";
const database = process.env.MYSQL_DATABASE ?? "db_bourse";

function splitSql(sql) {
  return sql
    .replace(/^--.*$/gm, "")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${database}\``);

  const dir = join(root, "prisma/migrations/mysql");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    for (const statement of splitSql(sql)) {
      try {
        await conn.query(statement);
        console.log(`OK  ${file}: ${statement.slice(0, 60).replace(/\s+/g, " ")}…`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (/already exists|Duplicate key name/i.test(msg)) {
          console.log(`SKIP ${file}: ${msg}`);
          continue;
        }
        throw error;
      }
    }
  }

  const [tables] = await conn.query("SHOW TABLES");
  console.log(`\nSchéma appliqué sur ${database}. Tables:`, tables);
  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
