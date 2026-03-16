import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const cookies = opts.req.headers.cookie || '';
  const isAuthenticated = cookies.includes('auth_token=caixinha_autenticada_2026');

  const mockUser: User = {
    id: 1,
    openId: "mock-user-local",
    name: "Admin",
    email: "admin@local.com",
    loginMethod: "mock",
    role: "admin", // Must be admin so they have full access in development/production as currently intended
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    req: opts.req,
    res: opts.res,
    user: isAuthenticated ? mockUser : null,
  };
}