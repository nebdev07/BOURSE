/**
 * Crée l'utilisateur MySQL applicatif brvm_app (à lancer une fois en root).
 * Usage:
 *   set MYSQL_ROOT_PASSWORD=...   (vide OK en Laragon)
 *   set BRVM_APP_PASSWORD=...     (obligatoire)
 *   node scripts/create-mysql-app-user.mjs
 */
import mysql from "mysql2/promise";

const host = process.env.MYSQL_HOST ?? "127.0.0.1";
const port = Number(process.env.MYSQL_PORT ?? 3306);
const rootUser = process.env.MYSQL_ROOT_USER ?? "root";
const rootPassword = process.env.MYSQL_ROOT_PASSWORD ?? "";
const database = process.env.MYSQL_DATABASE ?? "db_bourse";
const appUser = process.env.BRVM_APP_USER ?? "brvm_app";
const appPassword = process.env.BRVM_APP_PASSWORD ?? "";

if (!appPassword || appPassword.length < 12) {
  console.error("Définir BRVM_APP_PASSWORD (min. 12 caractères).");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host,
  port,
  user: rootUser,
  password: rootPassword,
  multipleStatements: true,
});

await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.query(`CREATE USER IF NOT EXISTS '${appUser}'@'localhost' IDENTIFIED BY ?`, [appPassword]);
await conn.query(`CREATE USER IF NOT EXISTS '${appUser}'@'%' IDENTIFIED BY ?`, [appPassword]);
await conn.query(`ALTER USER '${appUser}'@'localhost' IDENTIFIED BY ?`, [appPassword]);
await conn.query(`ALTER USER '${appUser}'@'%' IDENTIFIED BY ?`, [appPassword]);
await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES ON \`${database}\`.* TO '${appUser}'@'localhost'`);
await conn.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES ON \`${database}\`.* TO '${appUser}'@'%'`);
await conn.query("FLUSH PRIVILEGES");
await conn.end();

console.log(`OK utilisateur ${appUser} sur ${database}`);
console.log(`DATABASE_URL=mysql://${appUser}:${encodeURIComponent(appPassword)}@${host}:${port}/${database}`);
