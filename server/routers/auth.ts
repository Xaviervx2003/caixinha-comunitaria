// server/routers/auth.ts
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { JwtPayload } from "../_core/context";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Constantes de cookie â€” centralizadas aqui
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias em segundos

function buildCookieOptions(maxAge: number) {
  return [
    `${COOKIE_NAME}=${maxAge > 0 ? "" : ""}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",                                                    // JS nÃ£o acessa o cookie
    "SameSite=Lax",                                             // proteÃ§Ã£o CSRF
    process.env.NODE_ENV === "production" ? "Secure" : "",        // HTTPS em prod
  ]
    .filter(Boolean)
    .join("; ");
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Rotas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authProcedures = {

  // â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  login: publicProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const secret = process.env.JWT_SECRET;
      const passwordHash = process.env.ADMIN_PASSWORD_HASH;

      if (!secret || !passwordHash) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "ConfiguraÃ§Ã£o do servidor incompleta.",
        });
      }

      // ComparaÃ§Ã£o segura com bcrypt (resistente a timing attacks)
      const isValid = await bcrypt.compare(input.password, passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha incorreta.",
        });
      }

      // Busca (ou cria) o usuÃ¡rio admin no banco
      const db = await getDb();
      let [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (!adminUser) {
        // Primeira execuÃ§Ã£o: cria o admin automaticamente
        const [inserted] = await db.insert(users).values({
          openId: "admin-local",
          name: "Admin",
          email: process.env.ADMIN_EMAIL || "admin@caixinha.local",
          loginMethod: "password",
          role: "admin",
          lastSignedIn: new Date(),
        });
        const insertId = (inserted as any).insertId as number;
        [adminUser] = await db.select().from(users).where(eq(users.id, insertId)).limit(1);
      } else {
        // Atualiza o lastSignedIn
        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, adminUser.id));
      }

      // Gera o JWT
      const payload: JwtPayload = {
        sub: adminUser.id,
        role: adminUser.role as "admin",
      };

      const token = jwt.sign(payload, secret, { expiresIn: "7d" });

      // Define o cookie HttpOnly
      ctx.res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${token}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
      );

      return { success: true, name: adminUser.name };
    }),

  // â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  logout: publicProcedure.mutation(({ ctx }) => {
    // Apaga o cookie com Max-Age=0
    ctx.res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
    );
    return { success: true };
  }),

  // â”€â”€ Me (quem estÃ¡ logado) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      role: ctx.user.role,
    };
  }),
};
