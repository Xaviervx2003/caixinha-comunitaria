import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { participants } from "../../drizzle/schema";

/** Tipo da instância Drizzle com MySQL2 — espelha o db.ts original */
type DB = ReturnType<typeof drizzle>;

/**
 * Busca um participante pelo ID ou lança TRPCError NOT_FOUND.
 * Centraliza o padrão repetitivo de busca + validação que estava
 * duplicado em 8+ procedures no router original.
 */
export async function getParticipantOrThrow(db: DB, participantId: number) {
  const result = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1);

  if (result.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Participante #${participantId} não encontrado.`,
    });
  }

  return result[0];
}
