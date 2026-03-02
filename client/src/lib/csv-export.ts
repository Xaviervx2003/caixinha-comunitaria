/**
 * Utilitário para exportar dados da Caixinha Comunitária para CSV
 */

interface ParticipantData {
  id: number;
  name: string;
  totalLoan: string;
  currentDebt: string;
  createdAt?: string;
}

interface TransactionData {
  id: number;
  participantId: number;
  participantName: string;
  type: string;
  amount: string;
  month?: string;
  year?: number;
  createdAt: string;
}

interface MonthlyPaymentData {
  id: number;
  participantId: number;
  participantName: string;
  month: string;
  year: number;
  paid: number;
  createdAt: string;
}

// Converter array para CSV
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(h => `"${h}"`).join(',');
  
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escapar aspas duplas e envolver em aspas se contiver vírgula
      const stringValue = String(value || '').replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

// Formatar data
function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
}

// Exportar dados completos
export function exportToCSV(
  participants: ParticipantData[],
  transactions: TransactionData[],
  monthlyPayments: MonthlyPaymentData[]
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `caixinha-backup-${timestamp}.csv`;

  // Preparar dados de participantes
  const participantsData = participants.map(p => ({
    'ID': p.id,
    'Nome': p.name,
    'Empréstimo Total': parseFloat(p.totalLoan).toFixed(2),
    'Saldo Devedor': parseFloat(p.currentDebt).toFixed(2),
    'Data de Criação': formatDate(p.createdAt),
  }));

  // Preparar dados de transações com mês e ano
  const transactionsData = transactions.map(t => ({
    'ID': t.id,
    'Participante ID': t.participantId,
    'Participante': t.participantName,
    'Tipo': t.type === 'payment' ? 'Pagamento Mensal' : (t.type === 'loan' ? 'Empréstimo' : 'Amortização'),
    'Valor': parseFloat(t.amount).toFixed(2),
    'Mês': t.month || '',
    'Ano': t.year || '',
    'Data': formatDate(t.createdAt),
  }));

  // Preparar dados de pagamentos mensais
  const monthlyData = monthlyPayments.map(m => ({
    'ID': m.id,
    'Participante ID': m.participantId,
    'Participante': m.participantName,
    'Mês': m.month,
    'Ano': m.year,
    'Status': m.paid === 1 ? 'Pago' : 'Pendente',
    'Data': formatDate(m.createdAt),
  }));

  // Criar conteúdo do arquivo
  let csvContent = 'CAIXINHA COMUNITÁRIA - BACKUP DE DADOS\n';
  csvContent += `Data de Exportação: ${formatDate(new Date())}\n`;
  csvContent += `Versão: 2.1\n\n`;

  csvContent += '=== PARTICIPANTES ===\n';
  csvContent += arrayToCSV(participantsData) + '\n\n';

  csvContent += '=== TRANSAÇÕES ===\n';
  csvContent += arrayToCSV(transactionsData) + '\n\n';

  csvContent += '=== HISTÓRICO DE PAGAMENTOS MENSAIS ===\n';
  csvContent += arrayToCSV(monthlyData) + '\n\n';

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

  csvContent += '=== RESUMO FINANCEIRO ===\n';
  csvContent += `"Cotas Arrecadadas","${totalFees.toFixed(2)}"\n`;
  csvContent += `"Juros Arrecadados","${totalInterest.toFixed(2)}"\n`;
  csvContent += `"Total Arrecadado","${totalCollected.toFixed(2)}"\n`;
  csvContent += `"Total em Dívidas","${totalDebts.toFixed(2)}"\n`;

  // Criar blob e download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar apenas participantes
export function exportParticipantsToCSV(participants: ParticipantData[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `participantes-${timestamp}.csv`;

  const data = participants.map(p => ({
    'ID': p.id,
    'Nome': p.name,
    'Empréstimo Total': parseFloat(p.totalLoan).toFixed(2),
    'Saldo Devedor': parseFloat(p.currentDebt).toFixed(2),
  }));

  const csvContent = arrayToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar apenas transações
export function exportTransactionsToCSV(transactions: TransactionData[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `transacoes-${timestamp}.csv`;

  const data = transactions.map(t => ({
    'ID': t.id,
    'Participante ID': t.participantId,
    'Participante': t.participantName,
    'Tipo': t.type === 'payment' ? 'Pagamento Mensal' : (t.type === 'loan' ? 'Empréstimo' : 'Amortização'),
    'Valor': parseFloat(t.amount).toFixed(2),
    'Mês': t.month || '',
    'Ano': t.year || '',
    'Data': formatDate(t.createdAt),
  }));

  const csvContent = arrayToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
