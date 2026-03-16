// server/routers/participants.ts
import { protectedProcedure, adminProcedure } from "../_core/trpc";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { participants, monthlyPayments, auditLog, transactions } from "../../drizzle/schema";
import { getCaixinhaOrThrow, getParticipantOrThrow, participantIdSchema } from "./helpers";
import { z } from "zod";
import Decimal from "decimal.js";
import { TRPCError } from "@trpc/server";

export const participantsProcedures = {

  // ── Leitura — protectedProcedure correto ──────────────────────────────────
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

  // ── Adicionar participante — protectedProcedure (admin pode delegar) ──────
  addParticipant: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().max(320).optional(),
      totalLoan: z.coerce.number().nonnegative().max(999999.99).default(0),
      role: z.enum(["member", "external"]).default("member"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      return db.transaction(async (tx) => {
        const [result] = await tx.insert(participants).values({
          caixinhaId: caixinha.id,
          name: input.name,
          email: input.email ?? null,
          totalLoan: input.totalLoan.toFixed(2),
          currentDebt: input.totalLoan.toFixed(2),
          role: input.role,
        });

        const newId = (result as any).insertId as number;

        // Se já entrar devendo, cria o histórico financeiro inicial
        if (input.totalLoan > 0) {
          await tx.insert(transactions).values({
            participantId: newId,
            type: "loan",
            amount: input.totalLoan.toFixed(2),
            balanceBefore: "0.00",
            balanceAfter: input.totalLoan.toFixed(2),
            description: "Empréstimo Inicial",
          });

          await tx.insert(auditLog).values({
            participantId: newId,
            participantName: input.name,
            action: "loan_added",
            amount: input.totalLoan.toFixed(2),
            description: `Empréstimo inicial de R$ ${input.totalLoan.toFixed(2)}`,
          });
        }

        await tx.insert(auditLog).values({
          participantId: newId,
          participantName: input.name,
          action: "participant_created",
          description: `Participante adicionado como ${input.role === "external" ? "Tomador Externo" : "Membro"}`,
        });

        return { success: true, participantId: newId };
      });
    }),

  // 🟢 FIX: adminProcedure — renomear é operação administrativa
  updateParticipantName: adminProcedure
    .input(z.object({
      participantId: participantIdSchema,
      newName: z.string().min(1).max(255),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
      await getParticipantOrThrow(db, input.participantId, caixinha.id);
      await db
        .update(participants)
        .set({ name: input.newName })
        .where(eq(participants.id, input.participantId));
      return { success: true };
    }),

  // protectedProcedure — email é dado do próprio participante, menos sensível
  updateParticipantEmail: protectedProcedure
    .input(z.object({
      participantId: participantIdSchema,
      email: z.string().email().max(320).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
      await getParticipantOrThrow(db, input.participantId, caixinha.id);
      await db
        .update(participants)
        .set({ email: input.email ?? null })
        .where(eq(participants.id, input.participantId));
      return { success: true };
    }),

  // 🟢 FIX: adminProcedure — edição de limite financeiro
  updateParticipantLoan: adminProcedure
    .input(z.object({
      participantId: participantIdSchema,
      newTotalLoan: z.coerce.number().nonnegative().max(999999.99),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      return db.transaction(async (tx) => {
        const [p] = await tx
          .select()
          .from(participants)
          .where(and(
            eq(participants.id, input.participantId),
            eq(participants.caixinhaId, caixinha.id),
          ))
          .for("update")
          .limit(1);
        if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Participante não encontrado." });

        const newLoanAmount = new Decimal(input.newTotalLoan);
        const oldLoanAmount = new Decimal(p.totalLoan);

        if (newLoanAmount.equals(oldLoanAmount)) return { success: true };

        await tx
          .update(participants)
          .set({ totalLoan: newLoanAmount.toFixed(2) })
          .where(eq(participants.id, input.participantId));

        // 🟢 FIX: só auditLog — não cria registro em transactions
        // totalLoan é o limite histórico, não o saldo devedor atual.
        // Movimentos reais de dívida usam addLoan/registerAmortization.
        await tx.insert(auditLog).values({
          participantId: input.participantId,
          participantName: p.name,
          action: "loan_updated", // 🟢 FIX: action correta no enum
          amount: newLoanAmount.sub(oldLoanAmount).abs().toFixed(2),
          description: `Limite de empréstimo total ajustado: R$ ${oldLoanAmount.toFixed(2)} → R$ ${newLoanAmount.toFixed(2)}`,
        });

        return { success: true };
      });
    }),

  // 🟢 FIX: adminProcedure — edição direta de saldo devedor
  updateParticipantDebt: adminProcedure
    .input(z.object({
      participantId: participantIdSchema,
      newCurrentDebt: z.coerce.number().nonnegative().max(999999.99),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);

      return db.transaction(async (tx) => {
        const [p] = await tx
          .select()
          .from(participants)
          .where(and(
            eq(participants.id, input.participantId),
            eq(participants.caixinhaId, caixinha.id),
          ))
          .for("update")
          .limit(1);
        if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Participante não encontrado." });

        const balanceBefore = new Decimal(p.currentDebt);
        const balanceAfter = new Decimal(input.newCurrentDebt);

        if (balanceBefore.equals(balanceAfter)) return { success: true };

        await tx
          .update(participants)
          .set({ currentDebt: balanceAfter.toFixed(2) })
          .where(eq(participants.id, input.participantId));

        await tx.insert(auditLog).values({
          participantId: input.participantId,
          participantName: p.name,
          action: "debt_updated", // 🟢 FIX: action correta no enum
          amount: balanceBefore.sub(balanceAfter).abs().toFixed(2),
          description: `Saldo devedor ajustado manualmente: R$ ${balanceBefore.toFixed(2)} → R$ ${balanceAfter.toFixed(2)}`,
        });

        return { success: true };
      });
    }),

  // 🟢 FIX: adminProcedure — deletar é irreversível
  deleteParticipant: adminProcedure
    .input(z.object({ participantId: participantIdSchema }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const caixinha = await getCaixinhaOrThrow(db, ctx.user.id);
      const p = await getParticipantOrThrow(db, input.participantId, caixinha.id);

      return db.transaction(async (tx) => {
        // 🟢 FIX: registra no auditLog ANTES de deletar
        // O schema tem onDelete: "set null" no auditLog, então o registro
        // ficará com participantId = null mas participantName preservado.
        await tx.insert(auditLog).values({
          participantId: input.participantId,
          participantName: (p as any).name,
          action: "participant_deleted",
          description: `Participante removido permanentemente`,
        });

        await tx.delete(monthlyPayments).where(eq(monthlyPayments.participantId, input.participantId));
        await tx.delete(transactions).where(eq(transactions.participantId, input.participantId));
        await tx.delete(participants).where(eq(participants.id, input.participantId));

        return { success: true };
      });
    }),
};
