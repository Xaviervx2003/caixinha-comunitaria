// server/businessLogic.ts
import Decimal from "decimal.js";

export const CAIXINHA_CONFIG = {
  MONTHLY_QUOTA: new Decimal("200.00"),
  INTEREST_RATE: new Decimal("0.10"),       // 10% juros sobre dívida ativa
  LATE_FEE_RATE: new Decimal("0.02"),       // 2% de multa por atraso sobre a cota
  LATE_INTEREST_RATE: new Decimal("0.01"),  // 1% de juros de mora por mês sobre a cota
  DEFAULT_DUE_DAY: 5,                       // dia 5 do mês seguinte
  MAX_LOAN_AMOUNT: new Decimal("999999.99"),
} as const;

// ─────────────────────────────────────────────────────
// Pagamento mensal normal
// total = R$200 (cota) + (dívida × 10%)
// ─────────────────────────────────────────────────────
export function calcMonthlyPayment(currentDebt: Decimal) {
  const interest = currentDebt
    .mul(CAIXINHA_CONFIG.INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const total = CAIXINHA_CONFIG.MONTHLY_QUOTA
    .add(interest)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { interest, total };
}

// ─────────────────────────────────────────────────────
// Verifica se o pagamento está em atraso
// O vencimento é até o dia `dueDay` do mês SEGUINTE ao mês de referência
//
// Exemplo: mês de referência "2026-03" → vence em 2026-04-05
// ─────────────────────────────────────────────────────
export function isLatePayment(
  paymentMonth: string,   // "YYYY-MM"
  paymentDate: Date,
  dueDay: number = CAIXINHA_CONFIG.DEFAULT_DUE_DAY
): boolean {
  const [year, month] = paymentMonth.split("-").map(Number);

  // Mês seguinte
  const dueYear  = month === 12 ? year + 1 : year;
  const dueMonth = month === 12 ? 1 : month + 1;

  // Último momento válido: dueDay do mês seguinte às 23:59:59
  const dueDate = new Date(dueYear, dueMonth - 1, dueDay, 23, 59, 59);

  return paymentDate > dueDate;
}

// ─────────────────────────────────────────────────────
// Calcula juros + multa por atraso aplicados SOBRE A COTA (R$200)
// multa  = 2% × R$200 = R$4,00  (aplicada uma vez)
// mora   = 1% × R$200 = R$2,00  (por mês de atraso — aqui: 1 mês)
// ─────────────────────────────────────────────────────
export function calcLatePaymentFee(): {
  lateFee: Decimal;
  lateInterest: Decimal;
  totalLateCharge: Decimal;
} {
  const lateFee = CAIXINHA_CONFIG.MONTHLY_QUOTA
    .mul(CAIXINHA_CONFIG.LATE_FEE_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const lateInterest = CAIXINHA_CONFIG.MONTHLY_QUOTA
    .mul(CAIXINHA_CONFIG.LATE_INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const totalLateCharge = lateFee
    .add(lateInterest)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { lateFee, lateInterest, totalLateCharge };
}

// ─────────────────────────────────────────────────────
// Pagamento com atraso: soma os encargos ao total normal
// ─────────────────────────────────────────────────────
export function calcLateMonthlyPayment(currentDebt: Decimal) {
  const { interest, total: normalTotal } = calcMonthlyPayment(currentDebt);
  const { lateFee, lateInterest, totalLateCharge } = calcLatePaymentFee();

  const total = normalTotal
    .add(totalLateCharge)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    interest,          // juros sobre dívida ativa (10%)
    lateFee,           // multa 2% sobre cota
    lateInterest,      // mora 1% sobre cota
    totalLateCharge,   // lateFee + lateInterest
    total,             // total final com encargos
    isLate: true,
  };
}

// ─────────────────────────────────────────────────────
// Estimativa de caixa para o PRÓXIMO mês
//
// Calcula quanto a caixinha deve receber no próximo ciclo,
// assumindo que TODOS os participantes com dívida paguem.
//
// Retorna:
//   estimatedQuotas   — soma das cotas (R$200 × qtd participantes)
//   estimatedInterest — soma dos juros (10% × dívida de cada um)
//   estimatedTotal    — total esperado
//   perParticipant    — breakdown por participante
// ─────────────────────────────────────────────────────
export function calcNextMonthEstimate(
  activeParticipants: Array<{ id: number; name: string; currentDebt: string }>
) {
  let estimatedQuotas   = new Decimal(0);
  let estimatedInterest = new Decimal(0);

  const perParticipant = activeParticipants.map((p) => {
    const debt = new Decimal(p.currentDebt);
    const { interest, total } = calcMonthlyPayment(debt);

    estimatedQuotas   = estimatedQuotas.add(CAIXINHA_CONFIG.MONTHLY_QUOTA);
    estimatedInterest = estimatedInterest.add(interest);

    return {
      id: p.id,
      name: p.name,
      currentDebt: debt.toFixed(2),
      quota: CAIXINHA_CONFIG.MONTHLY_QUOTA.toFixed(2),
      interest: interest.toFixed(2),
      total: total.toFixed(2),
    };
  });

  const estimatedTotal = estimatedQuotas.add(estimatedInterest);

  return {
    estimatedQuotas:   estimatedQuotas.toFixed(2),
    estimatedInterest: estimatedInterest.toFixed(2),
    estimatedTotal:    estimatedTotal.toFixed(2),
    participantCount:  activeParticipants.length,
    perParticipant,
  };
}

// ─────────────────────────────────────────────────────
// Calcula a data de vencimento de um mês de referência
// Retorna um objeto Date: dia 5 do mês seguinte (por padrão)
// ─────────────────────────────────────────────────────
export function calcDueDate(
  paymentMonth: string,   // "YYYY-MM"
  dueDay: number = CAIXINHA_CONFIG.DEFAULT_DUE_DAY
): Date {
  const [year, month] = paymentMonth.split("-").map(Number);
  const dueYear  = month === 12 ? year + 1 : year;
  const dueMonth = month === 12 ? 1 : month + 1;
  return new Date(dueYear, dueMonth - 1, dueDay, 23, 59, 59);
}