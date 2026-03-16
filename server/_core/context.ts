import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export type JwtPayload = {
  sub: number;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
};

function extractCookie(cookieHeader: string = "", name: string): string | null {
  const match = cookieHeader.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyToken(token: string): JwtPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) { console.error("[auth] JWT_SECRET nao definido."); return null; }
  try { return jwt.verify(token, secret) as unknown as JwtPayload; } catch { return null; }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const token = extractCookie(opts.req.headers.cookie, "auth_token");
  if (!token) return { req: opts.req, res: opts.res, user: null };
  const payload = verifyToken(token);
  if (!payload?.sub) return { req: opts.req, res: opts.res, user: null };
  try {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    return { req: opts.req, res: opts.res, user: user ?? null };
  } catch (err) {
    console.error("[auth] Erro ao buscar usuario:", err);
    return { req: opts.req, res: opts.res, user: null };
  }
}
