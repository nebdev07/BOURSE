import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const sql = readFileSync(join(root, "prisma/migrations/0001_init.sql"), "utf8");
const dir = process.env.PGLITE_DATA_DIR ?? join(root, ".postgres", "pglite");
const db = new PGlite(dir);
await db.waitReady;
for (const statement of sql.replace(/^--.*$/gm, "").split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
  await db.exec(statement + ";");
}
const tables = await db.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
console.log(`PostgreSQL (PGlite) prêt dans ${dir}`);
console.log(`${tables.rows.length} tables :`, tables.rows.map((r) => r.tablename).join(", "));
await db.close();
