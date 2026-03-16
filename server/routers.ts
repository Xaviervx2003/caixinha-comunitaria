// server/routers.ts
import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

// Importa os submódulos
import { authProcedures } from "./routers/auth";          // 🟢 FIX: novo auth com JWT
import { dashboardProcedures } from "./routers/dashboard";
import { participantsProcedures } from "./routers/participants";
import { transactionsProcedures } from "./routers/transactions";

// ─────────────────────────────────────────────────────────
// ROUTER PRINCIPAL DA APLICAÇÃO
// ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // 🟢 FIX: authProcedures com JWT + bcrypt (substitui o auth com senha hardcoded)
  auth: router({
    ...authProcedures,
  }),

  caixinha: router({
    ...dashboardProcedures,
    ...participantsProcedures,
    ...transactionsProcedures,
  }),
});

export type AppRouter = typeof appRouter;
