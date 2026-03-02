import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { participants, transactions, monthlyPayments, auditLog } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendPaymentConfirmationEmail } from "./email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  caixinha: router({
    listParticipants: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns momentos.");
      const participantsList = await db.select().from(participants);
      
      const enrichedParticipants = await Promise.all(
        participantsList.map(async (participant) => {
          const payments = await db.select().from(monthlyPayments)
            .where(eq(monthlyPayments.participantId, participant.id));
          return {
            ...participant,
            monthlyPayments: payments,
          };
        })
      );
      
      return enrichedParticipants;
    }),

    addParticipant: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        totalLoan: z.number().min(0).default(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const newParticipant = {
          name: input.name,
          email: input.email || null,
          totalLoan: input.totalLoan.toString(),
          currentDebt: input.totalLoan.toString(),
        };
        const result = await db.insert(participants).values(newParticipant);
        return result;
      }),

    updateParticipantEmail: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        await db.update(participants)
          .set({ email: input.email || null })
          .where(eq(participants.id, input.participantId));
        return { success: true, message: "Email atualizado com sucesso!" };
      }),

    addLoan: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        amount: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        const p = participant[0];
        const newTotalLoan = parseFloat(p.totalLoan.toString()) + input.amount;
        const newCurrentDebt = parseFloat(p.currentDebt.toString()) + input.amount;
        await db.update(participants)
          .set({
            totalLoan: newTotalLoan.toString(),
            currentDebt: newCurrentDebt.toString(),
          })
          .where(eq(participants.id, input.participantId));
        const transaction = {
          participantId: input.participantId,
          type: "loan" as const,
          amount: input.amount.toString(),
          description: `Emprestimo adicional de R$ ${input.amount.toFixed(2)}`,
        };
        await db.insert(transactions).values(transaction);
        return { success: true };
      }),

    registerPayment: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        month: z.string(),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        const p = participant[0];
        const currentDebt = parseFloat(p.currentDebt.toString());
        const monthlyInterest = currentDebt * 0.10;
        const totalPayment = 200 + monthlyInterest;
        
        // Check if payment for this month/year already exists and is already paid
        const existingPayment = await db.select().from(monthlyPayments)
          .where(and(
            eq(monthlyPayments.participantId, input.participantId),
            eq(monthlyPayments.month, input.month),
            eq(monthlyPayments.year, input.year)
          ))
          .limit(1);
        
        if (existingPayment.length > 0 && existingPayment[0].paid === 1) {
          // Mês já foi pago - não permitir pagamento duplicado
          throw new Error(`Este mês (${input.month}/${input.year}) já foi pago. Não é permitido pagar o mesmo mês duas vezes.`);
        }
        
        if (existingPayment.length > 0) {
          // Atualizar pagamento existente (estava pendente)
          await db.update(monthlyPayments)
            .set({ paid: 1 })
            .where(eq(monthlyPayments.id, existingPayment[0].id));
        } else {
          // Criar novo registro de pagamento
          await db.insert(monthlyPayments).values({
            participantId: input.participantId,
            month: input.month,
            year: input.year,
            paid: 1,
          });
        }

        // Registrar transação
        const transaction = {
          participantId: input.participantId,
          type: "payment" as const,
          amount: totalPayment.toString(),
          month: input.month,
          year: input.year,
          description: `Pagamento mensal (Cota R$ 200 + Juros R$ ${monthlyInterest.toFixed(2)})`,
        };
        await db.insert(transactions).values(transaction);
        
        // Log auditoria
        await db.insert(auditLog).values({
          participantId: input.participantId,
          participantName: p.name,
          action: "payment_marked",
          month: input.month,
          year: input.year,
          amount: totalPayment.toString(),
          description: `Pagamento marcado como pago`,
        });
        
        // Enviar email de confirmacao (nao bloqueia se falhar)
        if (p.email) {
          sendPaymentConfirmationEmail({
            participantName: p.name,
            participantEmail: p.email,
            amount: totalPayment,
            paymentType: 'monthly',
            month: input.month,
            year: input.year.toString(),
            totalDebt: currentDebt,
            caixinhaName: 'Caixinha Comunitaria',
          }).catch(err => console.error('Failed to send email:', err));
        }
        
        return { success: true, message: `Pagamento de ${input.month}/${input.year} registrado com sucesso!` };
      }),

    unmarkPayment: protectedProcedure
      .input(z.object({
        paymentId: z.number(),
        participantId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const payment = await db.select().from(monthlyPayments)
          .where(eq(monthlyPayments.id, input.paymentId))
          .limit(1);
        
        if (payment.length === 0) throw new Error("Payment not found");
        
        const p = payment[0];
        const participant = await db.select().from(participants)
          .where(eq(participants.id, input.participantId))
          .limit(1);
        
        if (participant.length === 0) throw new Error("Participant not found");
        
        // Desmarcar pagamento
        await db.update(monthlyPayments)
          .set({ paid: 0 })
          .where(eq(monthlyPayments.id, input.paymentId));
        
        // Deletar transação correspondente para recalcular totais
        await db.delete(transactions)
          .where(and(
            eq(transactions.participantId, input.participantId),
            eq(transactions.type, "payment"),
            eq(transactions.month, p.month),
            eq(transactions.year, p.year)
          ));
        
        // Log auditoria
        await db.insert(auditLog).values({
          participantId: input.participantId,
          participantName: participant[0].name,
          action: "payment_unmarked",
          month: p.month,
          year: p.year,
          description: `Pagamento desmarcado como pago`,
        });
        
        return { success: true, message: `Pagamento de ${p.month}/${p.year} foi desmarcado. (Transações deletadas)` };
      }),

    registerAmortization: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        amount: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        const p = participant[0];
        const currentDebt = parseFloat(p.currentDebt.toString());
        
        // Validar se o valor de amortização não ultrapassa a dívida atual
        if (input.amount > currentDebt) {
          throw new Error(`Valor de amortização (R$ ${input.amount.toFixed(2)}) não pode ser maior que a dívida atual (R$ ${currentDebt.toFixed(2)}).`);
        }
        
        const newCurrentDebt = Math.max(0, currentDebt - input.amount);
        await db.update(participants)
          .set({
            currentDebt: newCurrentDebt.toString(),
          })
          .where(eq(participants.id, input.participantId));
        const transaction = {
          participantId: input.participantId,
          type: "amortization" as const,
          amount: input.amount.toString(),
          description: `Amortizacao de R$ ${input.amount.toFixed(2)}`,
        };
        await db.insert(transactions).values(transaction);
        
        // Log auditoria
        await db.insert(auditLog).values({
          participantId: input.participantId,
          participantName: p.name,
          action: "amortization_added",
          amount: input.amount.toString(),
          description: `Amortização de R$ ${input.amount.toFixed(2)} registrada`,
        });
        
        return { success: true };
      }),

    resetMonth: protectedProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const allPayments = await db.select().from(monthlyPayments);
      for (const payment of allPayments) {
        await db.update(monthlyPayments)
          .set({ paid: 0 })
          .where(eq(monthlyPayments.id, payment.id));
      }
      return { success: true };
    }),

    getMonthlyPayments: protectedProcedure
      .input(z.object({
        participantId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns momentos.");
        const result = await db.select().from(monthlyPayments).where(eq(monthlyPayments.participantId, input.participantId));
        return result;
      }),

    getTransactions: protectedProcedure
      .input(z.object({
        participantId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns momentos.");
        const result = await db.select().from(transactions).where(eq(transactions.participantId, input.participantId));
        return result;
      }),

    getAllTransactions: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns momentos.");
      const result = await db.select().from(transactions);
      return result;
    }),

    getAuditLog: protectedProcedure
      .input(z.object({
        participantId: z.number().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível. Tente novamente em alguns momentos.");
        
        if (input.participantId) {
          const result = await db.select().from(auditLog)
            .where(eq(auditLog.participantId, input.participantId))
            .orderBy(auditLog.createdAt)
            .limit(input.limit);
          return result;
        }
        
        const result = await db.select().from(auditLog)
          .orderBy(auditLog.createdAt)
          .limit(input.limit);
        return result;
      }),

    updateMonthlyPayment: protectedProcedure
      .input(z.object({
        paymentId: z.number(),
        month: z.string(),
        year: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(monthlyPayments)
          .set({
            month: input.month,
            year: input.year,
          })
          .where(eq(monthlyPayments.id, input.paymentId));
        return { success: true };
      }),

    updateParticipantLoan: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        newTotalLoan: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        const p = participant[0];
        const currentDebt = parseFloat(p.currentDebt.toString());
        const oldTotalLoan = parseFloat(p.totalLoan.toString());
        const difference = input.newTotalLoan - oldTotalLoan;
        const newCurrentDebt = Math.max(0, currentDebt + difference);
        await db.update(participants)
          .set({
            totalLoan: input.newTotalLoan.toString(),
            currentDebt: newCurrentDebt.toString(),
          })
          .where(eq(participants.id, input.participantId));
        return { success: true };
      }),

    updateParticipantDebt: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        newCurrentDebt: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        await db.update(participants)
          .set({
            currentDebt: input.newCurrentDebt.toString(),
          })
          .where(eq(participants.id, input.participantId));
        return { success: true };
      }),

    updateParticipantName: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        newName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const participant = await db.select().from(participants).where(eq(participants.id, input.participantId)).limit(1);
        if (participant.length === 0) throw new Error("Participant not found");
        await db.update(participants)
          .set({
            name: input.newName,
          })
          .where(eq(participants.id, input.participantId));
        return { success: true };
      }),

    deleteParticipant: protectedProcedure
      .input(z.object({
        participantId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(transactions).where(eq(transactions.participantId, input.participantId));
        await db.delete(monthlyPayments).where(eq(monthlyPayments.participantId, input.participantId));
        await db.delete(participants).where(eq(participants.id, input.participantId));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
