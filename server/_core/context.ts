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
  // Criamos o seu passe livre definitivo direto no servidor!
  const mockUser = {
    id: 1,
    name: "João Victor",
    email: "joao@caixinha.local",
  } as unknown as User;

  return {
    req: opts.req,
    res: opts.res,
    user: mockUser, // O servidor agora sempre vai ver você logado
  };
}