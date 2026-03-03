import Decimal from "decimal.js";

/**
 * Constantes de negócio da Caixinha Comunitária.
 * Centralizado aqui para evitar magic numbers espalhados no código.
 */
export const CAIXINHA_CONFIG = {
  /** Cota mensal fixa por participante */
  MONTHLY_QUOTA: new Decimal("200.00"),

  /** Taxa de juros mensal sobre a dívida atual */
  INTEREST_RATE: new Decimal("0.10"),

  /** Teto máximo de empréstimo por participante */
  MAX_LOAN_AMOUNT: new Decimal("999999.99"),

  /** Nome padrão da caixinha */
  NAME: "Caixinha Comunitária",
} as const;

/**
 * Calcula o pagamento mensal total de um participante.
 * total = cota_fixa + (dívida_atual * taxa_juros)
 */
export function calcMonthlyPayment(currentDebt: Decimal) {
  const interest = currentDebt.mul(CAIXINHA_CONFIG.INTEREST_RATE);
  const total = CAIXINHA_CONFIG.MONTHLY_QUOTA.add(interest);
  return { interest, total };
}
