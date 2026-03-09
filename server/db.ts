import { eq } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";

const POOL_CONFIG = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true, // ✅ necessário para db:migrate no TiDB Cloud
} as const;

let _db: MySql2Database | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb(): Promise<MySql2Database> {
  if (_db) return _db;

  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[Database] DATABASE_URL nao encontrada no .env!");
    throw new Error("DATABASE_URL missing");
  }
  url = url.replace(/^['"]|['"]$/g, "");

  _pool = mysql.createPool({ ...POOL_CONFIG, uri: url });

  try {
    const conn = await _pool.getConnection();
    await conn.ping();
    conn.release();
  } catch (error) {
    _pool = null;
    _db = null;
    console.error("[Database] Falha ao conectar no TiDB:", error);
    throw error;
  }

  _db = drizzle(_pool as any) as MySql2Database;
  console.log("[Database] Conexao com TiDB Cloud estabelecida!");

  if (process.env.NODE_ENV === "development") {
    try {
      await _db
        .insert(users)
        .values({
          id: 1,
          openId: "mock-user-local",
          name: "Dev User",
          email: "dev@local.com",
          loginMethod: "mock",
          role: "user",
          lastSignedIn: new Date(),
        })
        .onDuplicateKeyUpdate({ set: { lastSignedIn: new Date() } });
      console.log("[Database] Usuario dev garantido (id=1)");
    } catch (error) {
      console.warn("[Database] Nao foi possivel criar usuario dev:", error);
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!user.openId) throw new Error("User openId is required");

  const values: InsertUser = {
    openId: user.openId,
    lastSignedIn: new Date(),
  };
  const updateSet: Partial<InsertUser> = {
    lastSignedIn: new Date(),
  };

  if (user.name !== undefined) {
    values.name = user.name;
    updateSet.name = user.name;
  }
  if (user.email !== undefined) {
    values.email = user.email;
    updateSet.email = user.email;
  }
  if (user.loginMethod !== undefined) {
    values.loginMethod = user.loginMethod;
    updateSet.loginMethod = user.loginMethod;
  }

  try {
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Falha ao upsert usuario:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0] ?? undefined;
}