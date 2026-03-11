/**
 * client/src/lib/finance.ts
 * Utilitários de cálculo financeiro para o frontend.
 * Usa Decimal.js (já instalado no projeto) para evitar
 * anomalias de ponto flutuante do JavaScript.
 */

import Decimal from 'decimal.js';

export const MONTHLY_FEE = 200;
export const INTEREST_RATE = 0.10; // 10% ao mês sobre dívida ativa

/** Juros do mês = dívida × 10% */
export function calculateMonthlyInterest(currentDebt: string | number): number {
  const debt = new Decimal(currentDebt ?? 0);
  if (debt.isNaN() || debt.lte(0)) return 0;
  return debt
    .mul(INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/** Total mensal = R$200 + juros */
export function calculateMonthlyTotal(currentDebt: string | number): number {
  return new Decimal(MONTHLY_FEE)
    .add(calculateMonthlyInterest(currentDebt))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/** Percentual amortizado = (emprestado - devendo) / emprestado */
export function calculateProgress(
  totalLoan: string | number,
  currentDebt: string | number
): number {
  const total = new Decimal(totalLoan ?? 0);
  const current = new Decimal(currentDebt ?? 0);
  if (total.lte(0)) return 0;
  const paid = total.sub(current);
  const pct = paid.div(total).mul(100).toDecimalPlaces(1).toNumber();
  return Math.min(100, Math.max(0, pct));
}

/** Parse seguro que nunca retorna NaN */
export function safeNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = new Decimal(value);
  return n.isNaN() ? 0 : n.toNumber();
}