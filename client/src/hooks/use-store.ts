import { useState, useEffect } from 'react';
import { Participant, Transaction, calculateMonthlyTotal, calculateTotalFund, calculateTotalMonthlyFees, calculateTotalMonthlyInterest } from '@/lib/finance';

const STORAGE_KEY = 'caixinha-comunitaria-data-v1';

const INITIAL_DATA: Participant[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    totalLoan: 1000,
    currentDebt: 600,
    monthlyFeePaid: false,
    interestPaid: true, // Amarelo
    transactions: [],
  },
  {
    id: '2',
    name: 'Ana Souza',
    totalLoan: 0,
    currentDebt: 0,
    monthlyFeePaid: true,
    interestPaid: true, // Verde
    transactions: [],
  },
  {
    id: '3',
    name: 'Roberto Dias',
    totalLoan: 2000,
    currentDebt: 2000,
    monthlyFeePaid: false,
    interestPaid: false, // Vermelho
    transactions: [],
  },
];

export interface StoreData {
  participants: Participant[];
  totalFees: number;
  totalInterest: number;
  totalFund: number;
}

export function useStore() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }, [participants]);

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const registerPayment = (id: string, type: 'monthly' | 'amortization', amount: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== id) return p;

      const updates: Partial<Participant> = {};
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: type === 'monthly' ? 'payment' : 'amortization',
        amount,
        date: new Date().toISOString(),
        description: type === 'monthly' ? 'Pagamento Mensal (Cota + Juros)' : 'Amortização de Dívida'
      };
      
      if (type === 'monthly') {
        if (amount === 0) {
          newTransaction.amount = calculateMonthlyTotal(p.currentDebt);
        }
        updates.interestPaid = true;
        updates.monthlyFeePaid = true;
      } else if (type === 'amortization') {
        updates.currentDebt = Math.max(0, p.currentDebt - amount);
      }

      return {
        ...p,
        ...updates,
        transactions: [newTransaction, ...p.transactions]
      };
    }));
  };

  const addParticipant = (name: string, totalLoan: number = 0) => {
    const newParticipant: Participant = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      totalLoan,
      currentDebt: totalLoan,
      monthlyFeePaid: false,
      interestPaid: false,
      transactions: []
    };
    setParticipants(prev => [...prev, newParticipant]);
    return newParticipant;
  };

  const resetMonth = () => {
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        monthlyFeePaid: false,
        interestPaid: false
      }))
    );
  };

  const getTotalFund = (): StoreData => {
    return {
      participants,
      totalFees: calculateTotalMonthlyFees(participants),
      totalInterest: calculateTotalMonthlyInterest(participants),
      totalFund: calculateTotalFund(participants)
    };
  };

  return {
    participants,
    updateParticipant,
    registerPayment,
    addParticipant,
    resetMonth,
    getTotalFund
  };
}
