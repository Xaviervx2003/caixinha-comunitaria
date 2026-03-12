// server/routers/auth.ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../_core/trpc'; 

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(({ input, ctx }) => {
      // A senha oficial fica no seu ficheiro .env. Exemplo: APP_SECRET_PASSWORD="sua-senha-aqui"
      // Se a variável não for encontrada no .env, usa 'admin123' provisoriamente
      const correctPassword = process.env.APP_SECRET_PASSWORD || 'admin123';
      
      if (input.password !== correctPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta!' });
      }

      // Carimba o navegador com um Cookie super seguro (válido por 30 dias)
      ctx.res.cookie('auth_token', 'caixinha_autenticada_2026', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30, 
      });

      return { success: true };
    }),
    
  me: publicProcedure.query(({ ctx }) => {
    // Verifica se o utilizador tem o carimbo de autenticação
    const cookies = ctx.req.headers.cookie;
    const isAuthenticated = cookies?.includes('auth_token=caixinha_autenticada_2026');

    if (isAuthenticated) {
      return { id: 1, role: 'Admin' };
    }
    return null; 
  }),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('auth_token');
    return { success: true };
  })
});