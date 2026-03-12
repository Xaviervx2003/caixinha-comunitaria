import Decimal from "decimal.js";

// ─────────────────────────────────────────────────────
// 1. CONFIGURAÇÃO GLOBAL (Única Fonte da Verdade)
// ─────────────────────────────────────────────────────
export const CAIXINHA_CONFIG = {
  /** Cota mensal fixa por participante (Membros) */
  MONTHLY_QUOTA: new Decimal("200.00"),

  /** Taxa de juros mensal sobre a dívida ativa (10%) */
  INTEREST_RATE: new Decimal("0.10"),

  /** Multa por atraso (2% sobre a cota) */
  LATE_FEE_RATE: new Decimal("0.02"),

  /** Juros de mora por mês de atraso (1% sobre a cota) */
  LATE_INTEREST_RATE: new Decimal("0.01"),

  /** Dia padrão de vencimento */
  DEFAULT_DUE_DAY: 5,

  /** Teto máximo de empréstimo */
  MAX_LOAN_AMOUNT: new Decimal("999999.99"),

  /** Nome padrão */
  NAME: "Caixinha Comunitária",
} as const;

// ─────────────────────────────────────────────────────
// 2. LÓGICA CORE (Matemática de Negócio)
// ─────────────────────────────────────────────────────

/**
 * Calcula o pagamento mensal total.
 * Para Membros: Cota + Juros
 * Para Externos: Apenas Juros
 */
export function calcMonthlyPayment(currentDebt: Decimal, role: 'member' | 'external' = 'member') {
  const interest = currentDebt
    .mul(CAIXINHA_CONFIG.INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Se for externo, a cota é zero.
  const quota = role === 'external' ? new Decimal(0) : CAIXINHA_CONFIG.MONTHLY_QUOTA;

  const total = quota.add(interest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { quota, interest, total };
}

/**
 * Calcula taxas de atraso baseadas na cota.
 * Nota: Tomadores externos geralmente não pagam taxas fixas de cota,
 * mas a função está pronta caso precise aplicar sobre valor zero.
 */
export function calcLatePaymentFee(role: 'member' | 'external' = 'member') {
  const baseValue = role === 'external' ? new Decimal(0) : CAIXINHA_CONFIG.MONTHLY_QUOTA;

  const lateFee = baseValue
    .mul(CAIXINHA_CONFIG.LATE_FEE_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const lateInterest = baseValue
    .mul(CAIXINHA_CONFIG.LATE_INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalLateCharge = lateFee.add(lateInterest).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { lateFee, lateInterest, totalLateCharge };
}

/**
 * Calcula o vencimento: Dia 5 do mês seguinte ao mês de referência
 */
export function calcDueDate(paymentMonth: string, dueDay: number = CAIXINHA_CONFIG.DEFAULT_DUE_DAY): Date {
  const [year, month] = paymentMonth.split("-").map(Number);
  const dueYear = month === 12 ? year + 1 : year;
  const dueMonth = month === 12 ? 1 : month + 1;
  return new Date(dueYear, dueMonth - 1, dueDay, 23, 59, 59);
}

/**
 * Verifica se o pagamento está atrasado
 */
export function isLatePayment(paymentMonth: string, paymentDate: Date, dueDay: number = CAIXINHA_CONFIG.DEFAULT_DUE_DAY): boolean {
  const dueDate = calcDueDate(paymentMonth, dueDay);
  return paymentDate > dueDate;
}

// ─────────────────────────────────────────────────────
// 3. ADAPTADORES PARA O FRONTEND (Evita erros de renderização)
// ─────────────────────────────────────────────────────

export function safeNumber(value: string | number | null | undefined): number {
  if (!value || value === '') return 0;
  const n = new Decimal(value);
  return n.isNaN() ? 0 : n.toNumber();
}

export function calculateMonthlyInterest(currentDebt: string | number): number {
  const debt = new Decimal(currentDebt ?? 0);
  if (debt.lte(0)) return 0;
  return debt.mul(CAIXINHA_CONFIG.INTEREST_RATE).toNumber();
}

export function calculateMonthlyTotal(currentDebt: string | number, role: 'member' | 'external' = 'member'): number {
  const debt = new Decimal(currentDebt ?? 0);
  const { total } = calcMonthlyPayment(debt, role);
  return total.toNumber();
}