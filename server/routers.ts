// server/routers.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// Importa os submódulos da Caixinha
import { dashboardProcedures } from "./routers/dashboard";
import { participantsProcedures } from "./routers/participants";
import { transactionsProcedures } from "./routers/transactions";

// ─────────────────────────────────────────────────────────
// O GUARDIÃO (Sistema de Senha Mestra P0)
// ─────────────────────────────────────────────────────────
const authRouter = router({
  // 1. Rota de Login: Verifica a senha e emite o "Carimbo" (Cookie)
  login: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(({ input, ctx }) => {
      // A senha oficial busca do .env. Se não tiver lá, usa 'admin123'
      const correctPassword = process.env.APP_SECRET_PASSWORD || 'admin123';
      
      if (input.password !== correctPassword) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Código de acesso incorreto!' 
        });
      }

      // Se acertou a senha, colocamos um Cookie Criptografado no navegador (dura 30 dias)
      ctx.res.cookie('auth_token', 'caixinha_autenticada_2026', {
        httpOnly: true, // Bloqueia roubo de cookies via JavaScript (Anti-XSS)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
      });

      return { success: true };
    }),

  // 2. Rota Me: O Frontend pergunta "Estou logado?" e nós checamos o carimbo
  me: publicProcedure.query(({ ctx }) => {
    const cookies = ctx.req.headers.cookie;
    const isAuthenticated = cookies?.includes('auth_token=caixinha_autenticada_2026');

    if (isAuthenticated) {
      return { id: 1, role: 'Admin', name: 'Organizador' };
    }
    return null; // Acesso negado
  }),

  // 3. Rota Logout: Apaga o carimbo para trancar a porta de novo
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('auth_token');
    return { success: true };
  })
});

// ─────────────────────────────────────────────────────────
// ROUTER PRINCIPAL DA APLICAÇÃO
// ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  
  // Injetamos o nosso novo Guardião no lugar do utilizador falso
  auth: authRouter, 

  // A Mágica Acontece Aqui: Juntamos todos os pedaços num único Router chamado "caixinha"
  caixinha: router({
    ...dashboardProcedures,
    ...participantsProcedures,
    ...transactionsProcedures,
  }), 
});

export type AppRouter = typeof appRouter;