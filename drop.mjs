import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

const tables = [
  "auditLog",
  "caixinhaShares", 
  "monthlySummary",
  "monthlyPayments",
  "transactions",
  "participants",
  "caixinhaMetadata",
  "users",
];

for (const t of tables) {
  await conn.execute(`DROP TABLE IF EXISTS \`${t}\``);
  console.log("Dropped:", t);
}

await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log("Pronto!");