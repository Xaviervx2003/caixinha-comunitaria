export type PaymentStatus = 'paid' | 'partial' | 'late' | 'clean';

import Decimal from "decimal.js";

export interface Transaction {
  id: string;
  type: 'loan' | 'payment' | 'amortization' | 'reversal';
  amount: number;
  date: string;
  description?: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string; // URL or initials
  totalLoan: number; // Valor total original emprestado
  currentDebt: number; // Saldo devedor atual (Principal)
  monthlyFeePaid: boolean; // Se pagou a cota fixa do mês
  interestPaid: boolean; // Se pagou os juros do mês
  lastPaymentDate?: string;
  transactions: Transaction[];
}

export const FIXED_FEE = 200; // Cota fixa mensal
export const INTEREST_RATE = 0.10; // 10%

// Calcula o valor de juros do mês atual baseado no saldo devedor
export const calculateMonthlyInterest = (currentDebt: number): number => {
  return new Decimal(currentDebt)
    .mul(INTEREST_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
};

// Calcula o total a pagar no mês (Cota + Juros)
export const calculateMonthlyTotal = (currentDebt: number): number => {
  return new Decimal(FIXED_FEE)
    .add(calculateMonthlyInterest(currentDebt))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
};

// Determina o status do participante para as cores
export const getParticipantStatus = (participant: Participant): 'green' | 'yellow' | 'red' => {
  // VERDE: Sem dívidas (Saldo Devedor = 0)
  // Nota: Se não tem dívida, assume-se que paga apenas a cota. 
  // Se a cota não foi paga, tecnicamente seria vermelho, mas a regra diz:
  // "VERDE: Se o participante não possui dívidas (Saldo Devedor = 0)."
  if (participant.currentDebt <= 0) return 'green';

  // AMARELO: Tem empréstimo, mas juros do mês pagos (Cota pode ou não ter sido paga? 
  // A regra diz: "AMARELO: Se o participante tem empréstimo, mas o valor de juros do mês já foi pago.")
  // Vamos assumir que se pagou os juros, está amarelo.
  if (participant.interestPaid) return 'yellow';

  // VERMELHO: Tem empréstimo e não pagou (Cota + Juros)
  return 'red';
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateProgress = (totalLoan: number, currentDebt: number): number => {
  if (totalLoan === 0) return 100;
  const paid = totalLoan - currentDebt;
  const percentage = (paid / totalLoan) * 100;
  return Math.min(100, Math.max(0, percentage));
};

// Calcula o total de cotas pagas no mês
export const calculateTotalMonthlyFees = (participants: Participant[]): number => {
  return participants.reduce((acc, p) => {
    if (p.monthlyFeePaid) return acc + FIXED_FEE;
    return acc;
  }, 0);
};

// Calcula o total de juros pagos no mês
export const calculateTotalMonthlyInterest = (participants: Participant[]): number => {
  return participants.reduce((acc, p) => {
    if (p.interestPaid) return acc + calculateMonthlyInterest(p.currentDebt);
    return acc;
  }, 0);
};

// Calcula o total arrecadado (cotas + juros)
export const calculateTotalFund = (participants: Participant[]): number => {
  return calculateTotalMonthlyFees(participants) + calculateTotalMonthlyInterest(participants);
};
