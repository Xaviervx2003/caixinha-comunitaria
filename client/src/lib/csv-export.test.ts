import { describe, it, expect } from 'vitest';

describe('CSV Export - Data Preparation', () => {
  it('should prepare participant data correctly', () => {
    const participants = [
      {
        id: 1,
        name: 'João Silva',
        totalLoan: '1000.00',
        currentDebt: '500.00',
        createdAt: '2026-01-01',
      },
    ];

    // Simular preparação de dados
    const participantsData = participants.map(p => ({
      'ID': p.id,
      'Nome': p.name,
      'Empréstimo Total': parseFloat(p.totalLoan).toFixed(2),
      'Saldo Devedor': parseFloat(p.currentDebt).toFixed(2),
      'Data de Criação': p.createdAt,
    }));

    expect(participantsData.length).toBe(1);
    expect(participantsData[0]['Nome']).toBe('João Silva');
    expect(participantsData[0]['Empréstimo Total']).toBe('1000.00');
    expect(participantsData[0]['Saldo Devedor']).toBe('500.00');
  });

  it('should prepare transaction data with month and year', () => {
    const transactions = [
      {
        id: 1,
        participantId: 1,
        participantName: 'João Silva',
        type: 'payment',
        amount: '250.00',
        month: 'janeiro',
        year: 2026,
        createdAt: '2026-01-15',
      },
      {
        id: 2,
        participantId: 1,
        participantName: 'João Silva',
        type: 'amortization',
        amount: '100.00',
        month: 'fevereiro',
        year: 2026,
        createdAt: '2026-02-15',
      },
    ];

    const transactionsData = transactions.map(t => ({
      'ID': t.id,
      'Participante ID': t.participantId,
      'Participante': t.participantName,
      'Tipo': t.type === 'payment' ? 'Pagamento Mensal' : 'Amortização',
      'Valor': parseFloat(t.amount).toFixed(2),
      'Mês': t.month || '',
      'Ano': t.year || '',
      'Data': t.createdAt,
    }));

    expect(transactionsData.length).toBe(2);
    expect(transactionsData[0]['Tipo']).toBe('Pagamento Mensal');
    expect(transactionsData[0]['Mês']).toBe('janeiro');
    expect(transactionsData[0]['Ano']).toBe(2026);
    expect(transactionsData[1]['Tipo']).toBe('Amortização');
    expect(transactionsData[1]['Mês']).toBe('fevereiro');
  });

  it('should prepare monthly payment data correctly', () => {
    const monthlyPayments = [
      {
        id: 1,
        participantId: 1,
        participantName: 'João Silva',
        month: 'janeiro',
        year: 2026,
        paid: 1,
        createdAt: '2026-01-15',
      },
      {
        id: 2,
        participantId: 1,
        participantName: 'João Silva',
        month: 'fevereiro',
        year: 2026,
        paid: 0,
        createdAt: '2026-02-01',
      },
    ];

    const monthlyData = monthlyPayments.map(m => ({
      'ID': m.id,
      'Participante ID': m.participantId,
      'Participante': m.participantName,
      'Mês': m.month,
      'Ano': m.year,
      'Status': m.paid === 1 ? 'Pago' : 'Pendente',
      'Data': m.createdAt,
    }));

    expect(monthlyData.length).toBe(2);
    expect(monthlyData[0]['Status']).toBe('Pago');
    expect(monthlyData[1]['Status']).toBe('Pendente');
  });

  it('should calculate financial summary correctly', () => {
    const participants = [
      {
        id: 1,
        name: 'João Silva',
        totalLoan: '1000.00',
        currentDebt: '500.00',
      },
      {
        id: 2,
        name: 'Maria Santos',
        totalLoan: '2000.00',
        currentDebt: '1000.00',
      },
    ];

    const transactions = [
      {
        id: 1,
        participantId: 1,
        participantName: 'João Silva',
        type: 'payment',
        amount: '250.00',
      },
      {
        id: 2,
        participantId: 1,
        participantName: 'João Silva',
        type: 'amortization',
        amount: '100.00',
      },
    ];

    // Calcular totais
    const totalFees = transactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + 200, 0) +
      transactions
      .filter(t => t.type === 'amortization')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    const totalInterest = transactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + (parseFloat(t.amount) - 200), 0);

    const totalDebts = participants.reduce((acc, p) => acc + parseFloat(p.currentDebt), 0);
    const totalCollected = totalFees + totalInterest;

    expect(totalFees).toBe(300); // 200 (cota) + 100 (amortização)
    expect(totalInterest).toBe(50); // 250 - 200
    expect(totalDebts).toBe(1500); // 500 + 1000
    expect(totalCollected).toBe(350); // 300 + 50
  });
});
