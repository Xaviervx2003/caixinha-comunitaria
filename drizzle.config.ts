import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config(); // ✅ carrega o .env antes de ler DATABASE_URL

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const url = new URL(connectionString);

export default defineConfig({
  schema: "drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",              // ✅ explícito
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: true,
    } as any, // 🔒 Injeta SSL nativo escapando bugs do parser de URL do mysql2
  },
});