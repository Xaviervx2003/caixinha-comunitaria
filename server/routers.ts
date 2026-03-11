// server/routers.ts
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  calcMonthlyPayment,
  calcLateMonthlyPayment,
  calcNextMonthEstimate,
  isLatePayment,
} from "./businessLogic";
import Decimal from "decimal.js";
import {
  participants,
  transactions,
  monthlyPayments,
  auditLog,
  caixinhaMetadata,
} from "../drizzle/schema";

async function getCaixinhaOrThrow(db: Awaited<ReturnType<typeof getDb>>, userId: number) {
  const [caixinha] = await db
    .select()
    .from(caixinhaMetadata)
    .where(eq(caixinhaMetadata.ownerId, userId))
    .limit(1);

  if (!caixinha) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Caixinha não encontrada para este usuário.",
    });
  }
  return caixinha;
}

async function getParticipantOrThrow(
  db: Awaited<ReturnType<typeof getDb>>,
  participantId: number,
  caixinhaId: number
) {
  const [p] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.id, participantId),
        eq(participants.caixinhaId, caixinhaId)
      )
    )
    .limit(1);

  if (!p) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Participante não encontrado.",
    });
  }
  return p;
}

const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Formato inválido. Use "YYYY-MM"');

const participantIdSchema = z.number().int().positive();

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  caixinha: router({
    getOrCreateCaixinha: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();

      const [existing] = await db
        .select()
        .from(caixinhaMetadata)
        .where(eq(caixinhaMetadata.ownerId, ctx.user.id))
        .limit(1);

      if (existing) return existing;

      try {
        await db.insert(caixinhaMetadata).values({
          ownerId: ctx.user.id,
          name: "Minha Caixinha",
        });
      } catch (e: any) {
        if (e?.errno !== 1062) throw e;
      }

      const [created] = await db
        .select()
        .from(caixinhaMetadata)
        .where(eq(caixinhaMetadata.ownerId, ctx.user.id))
        .limit(1);

      return created;
    }),

    // 🔥 O NOVO BALANCETE BLINDADO
    getBalancete: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      // 1. Puxa TODAS as transações
      const allTx = await db
        .select({ tx: transactions })
        .from(transactions)
        .innerJoin(participants, eq(participants.id, transactions.participantId))
        .where(eq(participants.caixinhaId, caixinha.id));

      let caixaLivre = new Decimal(0);
      let totalRendimentos = new Decimal(0);

      // 2. Faz a matemática MANUALMENTE linha por linha (Impossível falhar)
      for (const row of allTx) {
        const tx = row.tx;
        // Garante que é um número positivo, não importa como foi salvo
        const amount = new Decimal(tx.amount).abs(); 

        if (tx.type === 'payment' || tx.type === 'amortization') {
          caixaLivre = caixaLivre.add(amount);
        } else if (tx.type === 'loan' || tx.type === 'reversal') {
          caixaLivre = caixaLivre.sub(amount); // Aqui o estorno DESAPARECE com o dinheiro!
        }

        if (tx.type === 'payment') {
          totalRendimentos = totalRendimentos.add(amount.sub(200));
        } else if (tx.type === 'reversal') {
          totalRendimentos = totalRendimentos.sub(amount.sub(200));
        }
      }

      // 3. Contas a receber
      const allParticipants = await db
        .select()
        .from(participants)
        .where(eq(participants.caixinhaId, caixinha.id));

      let contasAReceber = new Decimal(0);
      for (const p of allParticipants) {
        contasAReceber = contasAReceber.add(new Decimal(p.currentDebt));
      }
      const totalParticipants = allParticipants.length;

      // 4. Inadimplência do Mês
      const now = new Date();
      const currentMonthFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const currentYear = now.getFullYear();

      const [{ pagosNesteMes }] = await db
        .select({ pagosNesteMes: sql<number>`COUNT(*)` })
        .from(monthlyPayments)
        .innerJoin(participants, eq(participants.id, monthlyPayments.participantId))
        .where(
          and(
            eq(participants.caixinhaId, caixinha.id),
            eq(monthlyPayments.month, currentMonthFormatted),
            eq(monthlyPayments.year, currentYear),
            eq(monthlyPayments.paid, true)
          )
        );

      const patrimonioTotal = caixaLivre.add(contasAReceber);

      return {
        caixaLivre: caixaLivre.toFixed(2),
        contasAReceber: contasAReceber.toFixed(2),
        patrimonioTotal: patrimonioTotal.toFixed(2),
        totalRendimentos: totalRendimentos.toFixed(2),
        inadimplencia: Math.max(0, totalParticipants - Number(pagosNesteMes)),
        mesAtual: currentMonthFormatted,
      };
    }),

    listParticipants: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      const rows = await db
        .select()
        .from(participants)
        .leftJoin(monthlyPayments, eq(monthlyPayments.participantId, participants.id))
        .where(eq(participants.caixinhaId, caixinha.id));

      const grouped = rows.reduce((acc: Record<number, any>, row) => {
        const id = row.participants.id;
        if (!acc[id]) acc[id] = { ...row.participants, monthlyPayments: [] };
        if (row.monthlyPayments) acc[id].monthlyPayments.push(row.monthlyPayments);
        return acc;
      }, {});

      return Object.values(grouped);
    }),

    getMonthlyPayments: protectedProcedure
      .input(z.object({ participantId: participantIdSchema }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        return db
          .select()
          .from(monthlyPayments)
          .where(eq(monthlyPayments.participantId, input.participantId));
      }),

    getTransactions: protectedProcedure
      .input(z.object({ participantId: participantIdSchema }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        return db
          .select()
          .from(transactions)
          .where(eq(transactions.participantId, input.participantId));
      }),

    getAllTransactions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      return db
        .select({
          id: transactions.id,
          participantId: transactions.participantId,
          type: transactions.type,
          amount: transactions.amount,
          balanceBefore: transactions.balanceBefore,
          balanceAfter: transactions.balanceAfter,
          month: transactions.month,
          year: transactions.year,
          description: transactions.description,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .innerJoin(participants, eq(participants.id, transactions.participantId))
        .where(eq(participants.caixinhaId, caixinha.id));
    }),

    getAuditLog: protectedProcedure
      .input(
        z.object({
          participantId: participantIdSchema.optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        if (input.participantId) {
          await getParticipantOrThrow(db, input.participantId, caixinha.id);
          return db
            .select()
            .from(auditLog)
            .where(eq(auditLog.participantId, input.participantId))
            .limit(input.limit);
        }

        return db
          .select({
            id: auditLog.id,
            participantId: auditLog.participantId,
            participantName: auditLog.participantName,
            action: auditLog.action,
            month: auditLog.month,
            year: auditLog.year,
            amount: auditLog.amount,
            description: auditLog.description,
            createdAt: auditLog.createdAt,
          })
          .from(auditLog)
          .innerJoin(participants, eq(participants.id, auditLog.participantId))
          .where(eq(participants.caixinhaId, caixinha.id))
          .limit(input.limit);
      }),
      getNextMonthEstimate: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      // Participantes com dívida ativa
      const activeParticipants = await db
        .select({
          id: participants.id,
          name: participants.name,
          currentDebt: participants.currentDebt,
        })
        .from(participants)
        .where(eq(participants.caixinhaId, caixinha.id));

      const estimate = calcNextMonthEstimate(activeParticipants);

      // Próximo mês formatado
      const now = new Date();
      const nextMonth = now.getMonth() === 11
        ? `${now.getFullYear() + 1}-01`
        : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`;

      // Data de vencimento (dia dueDay do próximo mês)
      const dueDay = caixinha.paymentDueDay ?? 5;
      const [y, m] = nextMonth.split("-").map(Number);
      const dueDate = new Date(y, m - 1, dueDay);

      return {
        ...estimate,
        nextMonth,
        dueDate: dueDate.toISOString().split("T")[0],
        dueDay,
        startDate: caixinha.startDate ?? null,
        caixinhaName: caixinha.name,
      };
    }),
    updateCaixinhaSettings: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255).optional(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          paymentDueDay: z.number().int().min(1).max(28).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        const updateValues: Record<string, any> = {};
        if (input.name !== undefined) updateValues.name = input.name;
        if (input.startDate !== undefined) updateValues.startDate = new Date(input.startDate);
        if (input.paymentDueDay !== undefined) updateValues.paymentDueDay = input.paymentDueDay;

        await db
          .update(caixinhaMetadata)
          .set(updateValues)
          .where(eq(caixinhaMetadata.id, caixinha.id));

        return { success: true };
      }),

    addParticipant: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Nome obrigatório").max(255),
          email: z.string().email("Email inválido").max(320).optional(),
          totalLoan: z.coerce.number().nonnegative().max(999999.99).default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        return db.transaction(async (tx) => {
          const result = await tx.insert(participants).values({
            caixinhaId: caixinha.id,
            name: input.name,
            email: input.email ?? null,
            totalLoan: input.totalLoan.toString(),
            currentDebt: input.totalLoan.toString(),
          });

          await tx.insert(auditLog).values({
            participantId: Number(result[0].insertId),
            participantName: input.name,
            action: "participant_created",
            description: `Participante criado com empréstimo inicial de R$ ${input.totalLoan.toFixed(2)}`,
          });

          return { success: true };
        });
      }),

    addLoan: protectedProcedure
      .input(
        z.object({
          participantId: participantIdSchema,
          amount: z.coerce.number().positive("Valor deve ser positivo").max(999999.99),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        return db.transaction(async (tx) => {
          const [p] = await tx
            .select()
            .from(participants)
            .where(
              and(
                eq(participants.id, input.participantId),
                eq(participants.caixinhaId, caixinha.id)
              )
            )
            .for("update")
            .limit(1);

          if (!p) throw new TRPCError({ code: "NOT_FOUND" });

          const balanceBefore = new Decimal(p.currentDebt);
          const loanAmount = new Decimal(input.amount);
          const newTotalLoan = new Decimal(p.totalLoan).add(loanAmount);
          const balanceAfter = balanceBefore.add(loanAmount);

          await tx
            .update(participants)
            .set({
              totalLoan: newTotalLoan.toFixed(2),
              currentDebt: balanceAfter.toFixed(2),
            })
            .where(eq(participants.id, input.participantId));

          await tx.insert(transactions).values({
            participantId: input.participantId,
            type: "loan",
            amount: loanAmount.toFixed(2),
            balanceBefore: balanceBefore.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
            description: `Empréstimo adicional de R$ ${loanAmount.toFixed(2)}`,
          });

          await tx.insert(auditLog).values({
            participantId: input.participantId,
            participantName: p.name,
            action: "loan_added",
            amount: loanAmount.toFixed(2),
            description: `Empréstimo adicional de R$ ${loanAmount.toFixed(2)}`,
          });

          return { success: true };
        });
      }),

    registerPayment: protectedProcedure
      .input(
        z.object({
          participantId: participantIdSchema,
          month: monthSchema,
          year: z.number().int().min(2020).max(2100),
          idempotencyKey: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        if (input.idempotencyKey) {
          const [existing] = await db
            .select()
            .from(transactions)
            .innerJoin(participants, eq(participants.id, transactions.participantId))
            .where(
              and(
                eq(transactions.idempotencyKey, input.idempotencyKey),
                eq(participants.caixinhaId, caixinha.id)
              )
            )
            .limit(1);
          if (existing) return { success: true, isLate: false };
        }

        return db.transaction(async (tx) => {
          const [p] = await tx
            .select()
            .from(participants)
            .where(
              and(
                eq(participants.id, input.participantId),
                eq(participants.isActive, true)
              )
            )
            .for("update")
            .limit(1);

          if (!p) throw new TRPCError({ code: "NOT_FOUND" });

          const existingPayment = await tx
            .select()
            .from(monthlyPayments)
            .where(
              and(
                eq(monthlyPayments.participantId, input.participantId),
                eq(monthlyPayments.month, input.month),
                eq(monthlyPayments.year, input.year)
              )
            )
            .limit(1);

          if (existingPayment.length > 0 && existingPayment[0].paid === true) {
            throw new TRPCError({ code: "CONFLICT", message: "Mês já pago." });
          }

          // ✅ Detecta atraso com base no dueDay da caixinha
          const paymentDate = new Date();
          const late = isLatePayment(input.month, paymentDate, caixinha.paymentDueDay ?? 5);

          const currentDebt = new Decimal(p.currentDebt);
          const calc = late
            ? calcLateMonthlyPayment(currentDebt)
            : { ...calcMonthlyPayment(currentDebt), isLate: false, lateFee: new Decimal(0), lateInterest: new Decimal(0), totalLateCharge: new Decimal(0) };

          const now = new Date();

          if (existingPayment.length > 0) {
            await tx
              .update(monthlyPayments)
              .set({ paid: true, paidLate: late, paidAt: now })
              .where(eq(monthlyPayments.id, existingPayment[0].id));
          } else {
            await tx.insert(monthlyPayments).values({
              participantId: input.participantId,
              month: input.month,
              year: input.year,
              paid: true,
              paidLate: late,
              paidAt: now,
            });
          }

          const description = late
            ? `Cota R$ 200,00 + Juros R$ ${calc.interest.toFixed(2)} + Multa R$ ${calc.lateFee?.toFixed(2)} + Mora R$ ${calc.lateInterest?.toFixed(2)} (PAGAMENTO EM ATRASO)`
            : `Cota R$ 200,00 + Juros R$ ${calc.interest.toFixed(2)}`;

          try {
            await tx.insert(transactions).values({
              participantId: input.participantId,
              type: "payment",
              amount: calc.total.toFixed(2),
              balanceBefore: currentDebt.toFixed(2),
              balanceAfter: currentDebt.toFixed(2),
              month: input.month,
              year: input.year,
              description,
              idempotencyKey: input.idempotencyKey,
            });
          } catch (e: any) {
            if (e?.errno === 1062) return { success: true, isLate: late };
            throw e;
          }

          await tx.insert(auditLog).values({
            participantId: input.participantId,
            participantName: p.name,
            action: "payment_marked",
            month: input.month,
            year: input.year,
            amount: calc.total.toFixed(2),
            description,
          });

          return { success: true, isLate: late, total: calc.total.toFixed(2) };
        });
      }),

    registerAmortization: protectedProcedure
      .input(
        z.object({
          participantId: participantIdSchema,
          amount: z.coerce.number().positive("Valor deve ser positivo").max(999999.99),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        return db.transaction(async (tx) => {
          const [p] = await tx
            .select()
            .from(participants)
            .where(
              and(
                eq(participants.id, input.participantId),
                eq(participants.caixinhaId, caixinha.id)
              )
            )
            .for("update")
            .limit(1);

          if (!p) throw new TRPCError({ code: "NOT_FOUND" });

          const currentDebt = new Decimal(p.currentDebt);

          if (new Decimal(input.amount).gt(currentDebt)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Amortização de R$ ${input.amount.toFixed(2)} excede a dívida atual de R$ ${currentDebt.toFixed(2)}.`,
            });
          }

          const amountDecimal = new Decimal(input.amount);
          const balanceAfter = currentDebt.sub(amountDecimal);

          await tx
            .update(participants)
            .set({ currentDebt: balanceAfter.toFixed(2) })
            .where(eq(participants.id, input.participantId));

          await tx.insert(transactions).values({
            participantId: input.participantId,
            type: "amortization",
            amount: amountDecimal.toFixed(2),
            balanceBefore: currentDebt.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
            description: `Amortização de R$ ${amountDecimal.toFixed(2)}`,
          });

          await tx.insert(auditLog).values({
            participantId: input.participantId,
            participantName: p.name,
            action: "amortization_added",
            amount: amountDecimal.toFixed(2),
            description: `Dívida reduzida de R$ ${currentDebt.toFixed(2)} para R$ ${balanceAfter.toFixed(2)}`,
          });

          return { success: true };
        });
      }),

    unmarkPayment: protectedProcedure
      .input(
        z.object({
          paymentId: z.number().int().positive(),
          participantId: participantIdSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        return db.transaction(async (tx) => {
          const [p] = await tx
            .select()
            .from(participants)
            .where(
              and(
                eq(participants.id, input.participantId),
                eq(participants.caixinhaId, caixinha.id)
              )
            )
            .for("update")
            .limit(1);

          if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Participante não encontrado." });

          const [payment] = await tx
            .select()
            .from(monthlyPayments)
            .where(eq(monthlyPayments.id, input.paymentId))
            .limit(1);

          if (!payment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Pagamento não encontrado." });
          }

          await tx
            .update(monthlyPayments)
            .set({ paid: false })
            .where(eq(monthlyPayments.id, input.paymentId));

          const [originalTx] = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.participantId, input.participantId),
                eq(transactions.type, "payment"),
                eq(transactions.month, payment.month),
                eq(transactions.year, payment.year)
              )
            )
            .limit(1);

          const currentDebt = new Decimal(p.currentDebt);
          let reversalAmountStr = "200.00"; 
          
          if (originalTx) {
            reversalAmountStr = new Decimal(originalTx.amount).abs().toFixed(2);
          } else {
             const { total } = calcMonthlyPayment(currentDebt);
             reversalAmountStr = total.toFixed(2);
          }

          await tx.delete(transactions).where(
  and(
    eq(transactions.participantId, input.participantId),
    eq(transactions.type, "payment"),
    eq(transactions.month, payment.month),
    eq(transactions.year, payment.year)
  )
);

          await tx.insert(auditLog).values({
            participantId: input.participantId,
            participantName: p.name,
            action: "payment_unmarked",
            month: payment.month,
            year: payment.year,
            description: `Pagamento de ${payment.month}/${payment.year} desmarcado (estorno gerado)`,
          });

          return { success: true };
        });
      }),

    updateParticipantName: protectedProcedure
      .input(z.object({ participantId: participantIdSchema, newName: z.string().min(1).max(255) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        await db.update(participants).set({ name: input.newName }).where(eq(participants.id, input.participantId));
        return { success: true };
      }),

    deleteParticipant: protectedProcedure
      .input(z.object({ participantId: participantIdSchema }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        return db.transaction(async (tx) => {
          await tx.delete(auditLog).where(eq(auditLog.participantId, input.participantId));
          await tx.delete(monthlyPayments).where(eq(monthlyPayments.participantId, input.participantId));
          await tx.delete(transactions).where(eq(transactions.participantId, input.participantId));
          await tx.delete(participants).where(eq(participants.id, input.participantId));

          return { success: true };
        });
      }),

    resetMonth: protectedProcedure
      .input(z.object({ month: monthSchema, year: z.number().int().min(2020).max(2100) }).optional())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        const now = new Date();
        const month = input?.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const year = input?.year ?? now.getFullYear();

        return db.transaction(async (tx) => {
          const payments = await tx
            .select({ mp: monthlyPayments, participant: participants })
            .from(monthlyPayments)
            .innerJoin(participants, eq(participants.id, monthlyPayments.participantId))
            .where(
              and(
                eq(participants.caixinhaId, caixinha.id),
                eq(monthlyPayments.month, month),
                eq(monthlyPayments.year, year),
                eq(monthlyPayments.paid, true)
              )
            );

          if (payments.length === 0) return { success: true, reset: 0 };

          for (const { mp, participant } of payments) {
            await tx.update(monthlyPayments).set({ paid: false }).where(eq(monthlyPayments.id, mp.id));

            const [originalTx] = await tx
              .select()
              .from(transactions)
              .where(
                and(
                  eq(transactions.participantId, mp.participantId),
                  eq(transactions.type, "payment"),
                  eq(transactions.month, month),
                  eq(transactions.year, year)
                )
              )
              .limit(1);

            const currentDebt = new Decimal(participant.currentDebt);
            let reversalAmountStr = "200.00";
            
            if (originalTx) {
              reversalAmountStr = new Decimal(originalTx.amount).abs().toFixed(2);
            } else {
               const { total } = calcMonthlyPayment(currentDebt);
               reversalAmountStr = total.toFixed(2);
            }

            await tx.insert(transactions).values({
              participantId: mp.participantId,
              type: "reversal",
              amount: reversalAmountStr,
              balanceBefore: currentDebt.toFixed(2),
              balanceAfter: currentDebt.toFixed(2),
              month,
              year,
              description: `Estorno de pagamento (reset mês): ${month}/${year}`,
            });

            await tx.insert(auditLog).values({
              participantId: mp.participantId,
              participantName: participant.name,
              action: "payment_unmarked",
              month,
              year,
              description: `Pagamento de ${month}/${year} desmarcado (reset do mês)`,
            });
          }
          return { success: true, reset: payments.length };
        });
      }),

    updateParticipantLoan: protectedProcedure
      .input(z.object({ participantId: participantIdSchema, newTotalLoan: z.coerce.number().nonnegative().max(999999.99) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        await db.update(participants).set({ totalLoan: new Decimal(input.newTotalLoan).toFixed(2) }).where(eq(participants.id, input.participantId));
        return { success: true };
      }),

    updateParticipantDebt: protectedProcedure
      .input(z.object({ participantId: participantIdSchema, newCurrentDebt: z.coerce.number().nonnegative().max(999999.99) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

        return db.transaction(async (tx) => {
          const [p] = await tx
            .select()
            .from(participants)
            .where(and(eq(participants.id, input.participantId), eq(participants.caixinhaId, caixinha.id)))
            .for("update")
            .limit(1);

          if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Participante não encontrado." });

          const balanceBefore = new Decimal(p.currentDebt);
          const balanceAfter = new Decimal(input.newCurrentDebt);

          await tx.update(participants).set({ currentDebt: balanceAfter.toFixed(2) }).where(eq(participants.id, input.participantId));

          await tx.insert(auditLog).values({
            participantId: input.participantId,
            participantName: p.name,
            action: "amortization_added",
            amount: balanceBefore.sub(balanceAfter).abs().toFixed(2),
            description: `Saldo ajustado manualmente: R$ ${balanceBefore.toFixed(2)} → R$ ${balanceAfter.toFixed(2)}`,
          });

          return { success: true };
        });
      }),

    updateParticipantEmail: protectedProcedure
      .input(z.object({ participantId: participantIdSchema, email: z.string().email("Email inválido").max(320).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
        await getParticipantOrThrow(db, input.participantId, caixinha.id);

        await db.update(participants).set({ email: input.email ?? null }).where(eq(participants.id, input.participantId));
        return { success: true };
      }),

  }), 
});

export type AppRouter = typeof appRouter;