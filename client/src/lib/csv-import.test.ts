import { describe, it, expect } from 'vitest';
import { 
  extractParticipantsFromCSV, 
  extractTransactionsFromCSV,
  extractMonthlyPaymentsFromCSV 
} from './csv-import';

describe('CSV Import', () => {
  const sampleCSV = `CAIXINHA COMUNITÁRIA - BACKUP DE DADOS
Data de Exportação: 01/01/2026 12:00:00
Versão: 2.1

=== PARTICIPANTES ===
"ID","Nome","Empréstimo Total","Saldo Devedor","Data de Criação"
"1","João Silva","1000.00","500.00","01/01/2026 10:00:00"

=== TRANSAÇÕES ===
"ID","Participante ID","Participante","Tipo","Valor","Mês","Ano","Data"
"1","1","João Silva","Pagamento Mensal","250.00","janeiro","2026","15/01/2026 10:00:00"

=== HISTÓRICO DE PAGAMENTOS MENSAIS ===
"ID","Participante ID","Participante","Mês","Ano","Status","Data"
"1","1","João Silva","janeiro","2026","Pago","15/01/2026 10:00:00"`;

  it('should extract participants from CSV', () => {
    const participants = extractParticipantsFromCSV(sampleCSV);
    
    expect(participants.length).toBeGreaterThan(0);
    expect(participants[0].name).toBe('João Silva');
    expect(participants[0].totalLoan).toBe(1000);
    expect(participants[0].currentDebt).toBe(500);
  });

  it('should extract transactions from CSV', () => {
    const transactions = extractTransactionsFromCSV(sampleCSV);
    
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].participantName).toBe('João Silva');
    expect(transactions[0].type).toBe('payment');
    expect(transactions[0].amount).toBe(250);
    expect(transactions[0].month).toBe('janeiro');
    expect(transactions[0].year).toBe(2026);
  });

  it('should extract monthly payments from CSV', () => {
    const monthlyPayments = extractMonthlyPaymentsFromCSV(sampleCSV);
    
    expect(monthlyPayments.length).toBeGreaterThan(0);
    expect(monthlyPayments[0].participantName).toBe('João Silva');
    expect(monthlyPayments[0].month).toBe('janeiro');
    expect(monthlyPayments[0].year).toBe(2026);
    expect(monthlyPayments[0].paid).toBe(true);
  });

  it('should handle empty CSV sections', () => {
    const emptyCSV = `CAIXINHA COMUNITÁRIA - BACKUP DE DADOS
=== PARTICIPANTES ===
=== TRANSAÇÕES ===
=== HISTÓRICO DE PAGAMENTOS MENSAIS ===
=== RESUMO FINANCEIRO ===`;

    const participants = extractParticipantsFromCSV(emptyCSV);
    const transactions = extractTransactionsFromCSV(emptyCSV);
    const monthlyPayments = extractMonthlyPaymentsFromCSV(emptyCSV);

    expect(participants.length).toBe(0);
    expect(transactions.length).toBe(0);
    expect(monthlyPayments.length).toBe(0);
  });

  it('should parse CSV with different month names', () => {
    const csvWithMonths = `=== TRANSAÇÕES ===
"ID","Participante ID","Participante","Tipo","Valor","Mês","Ano","Data"
"1","1","João","Pagamento Mensal","250.00","fevereiro","2026","15/02/2026 10:00:00"
"2","1","João","Amortização","100.00","março","2026","20/03/2026 10:00:00"`;

    const transactions = extractTransactionsFromCSV(csvWithMonths);
    
    expect(transactions.length).toBe(2);
    expect(transactions[0].month).toBe('fevereiro');
    expect(transactions[1].month).toBe('março');
    expect(transactions[1].type).toBe('amortization');
  });
});
