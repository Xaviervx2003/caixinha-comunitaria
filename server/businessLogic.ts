// server/businessLogic.ts
import Decimal from "decimal.js";

export const CAIXINHA_CONFIG = {
  MONTHLY_QUOTA: new Decimal("200.00"),
  INTEREST_RATE: new Decimal("0.10"),
  MAX_LOAN_AMOUNT: new Decimal("999999.99"),
} as const;

/**
 * Calcula o pagamento mensal total de um participante.
 * total = cota_fixa (R$200) + (dívida_atual × 10%)
 *
 * ✅ Arredondamento ROUND_HALF_UP explícito em ambos os valores
 * para evitar divergência entre frontend e backend em dívidas
 * que não são múltiplos de 10 (ex: R$153,33 × 0,10 = R$15,333...)
 */
export function calcMonthlyPayment(currentDebt: Decimal) {
  const interest = currentDebt
    .mul(CAIXINHA_CONFIG.INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const total = CAIXINHA_CONFIG.MONTHLY_QUOTA
    .add(interest)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { interest, total };
}