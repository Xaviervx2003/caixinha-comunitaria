// client/src/components/MonthlyReportPDF.tsx
// Gera relatório mensal usando window.print() — sem dependência extra
 
import { formatCurrency } from '@/lib/format-currency';
 
interface ReportParticipant {
  id: number;
  name: string;
  currentDebt: string | number;
  totalLoan: string | number;
  monthlyPayments?: any[];
}
 
interface ReportTransaction {
  id: number;
  participantId: number;
  type: string;
  amount: string | number;
  description?: string;
  month?: string;
}
 
interface MonthlyReportPDFProps {
  participants: ReportParticipant[];
  transactions: ReportTransaction[];
  month: string; // "YYYY-MM"
  caixinhaName?: string;
}
 
const MONTH_NAMES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};
 
export function generateMonthlyReportPDF({
  participants,
  transactions,
  month,
  caixinhaName = 'Caixinha Comunitária',
}: MonthlyReportPDFProps) {
  const [year, monthNum] = month.split('-');
  const monthName = MONTH_NAMES[monthNum] || monthNum;
 
  const monthTransactions = transactions.filter(t => t.month === month);
  const payments = monthTransactions.filter(t => t.type === 'payment');
  const amortizations = monthTransactions.filter(t => t.type === 'amortization');
 
  const totalCollected = payments.reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);
  const totalAmortized = amortizations.reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);
  const totalDebts = participants.reduce((acc, p) => acc + parseFloat(p.currentDebt.toString()), 0);
 
  const paidIds = new Set(payments.map(p => p.participantId));
  const paidParticipants = participants.filter(p => paidIds.has(p.id));
  const unpaidParticipants = participants.filter(p => !paidIds.has(p.id));
 
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${monthName}/${year} — ${caixinhaName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; background: white; padding: 32px; font-size: 13px; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #000; }
    .header h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .header .date { text-align: right; font-size: 11px; color: #666; }
 
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { border: 2px solid #000; padding: 12px; }
    .summary-card .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
    .summary-card .value { font-size: 18px; font-weight: 900; margin-top: 4px; }
    .summary-card.green .value { color: #00a844; }
    .summary-card.red .value { color: #cc2200; }
    .summary-card.blue .value { color: #1a56db; }
 
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 6px 10px; background: #000; color: #fff; margin-bottom: 0; }
    
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 7px 10px; text-align: left; border: 1px solid #ddd; }
    td { padding: 7px 10px; border: 1px solid #eee; font-size: 12px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    
    .badge-paid { color: #00a844; font-weight: bold; }
    .badge-unpaid { color: #cc2200; font-weight: bold; }
    .badge-late { color: #d97706; font-weight: bold; }
 
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #999; }
 
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
 
  <div class="header">
    <div>
      <h1>${caixinhaName}</h1>
      <div class="subtitle">Relatório Mensal — ${monthName} de ${year}</div>
    </div>
    <div class="date">
      Gerado em: ${new Date().toLocaleDateString('pt-BR')}<br/>
      Período: ${monthName}/${year}
    </div>
  </div>
 
  <div class="summary-grid">
    <div class="summary-card green">
      <div class="label">Total Arrecadado</div>
      <div class="value">${formatCurrency(totalCollected)}</div>
    </div>
    <div class="summary-card blue">
      <div class="label">Amortizações</div>
      <div class="value">${formatCurrency(totalAmortized)}</div>
    </div>
    <div class="summary-card red">
      <div class="label">Dívida Total Atual</div>
      <div class="value">${formatCurrency(totalDebts)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Adimplência</div>
      <div class="value">${participants.length > 0 ? Math.round((paidParticipants.length / participants.length) * 100) : 0}%</div>
    </div>
  </div>
 
  <div class="section">
    <h2>Participantes — Status do Mês</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nome</th>
          <th>Saldo Devedor</th>
          <th>Empréstimo Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${participants.map((p, i) => {
          const isPaid = paidIds.has(p.id);
          return `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${p.name}</strong></td>
            <td>${formatCurrency(parseFloat(p.currentDebt.toString()))}</td>
            <td>${formatCurrency(parseFloat(p.totalLoan.toString()))}</td>
            <td class="${isPaid ? 'badge-paid' : 'badge-unpaid'}">${isPaid ? '✓ PAGO' : '✗ PENDENTE'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
 
  ${monthTransactions.length > 0 ? `
  <div class="section">
    <h2>Transações do Mês</h2>
    <table>
      <thead>
        <tr>
          <th>Participante</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${monthTransactions.map(t => {
          const p = participants.find(p => p.id === t.participantId);
          const typeLabel = t.type === 'payment' ? 'Pagamento' : t.type === 'amortization' ? 'Amortização' : t.type === 'loan' ? 'Empréstimo' : 'Estorno';
          return `
          <tr>
            <td>${p?.name || 'Desconhecido'}</td>
            <td>${typeLabel}</td>
            <td><strong>${formatCurrency(parseFloat(t.amount.toString()))}</strong></td>
            <td>${t.description || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}
 
  <div class="footer">
    <span>${caixinhaName} — Sistema de Gestão de Caixinha Comunitária</span>
    <span>Relatório gerado automaticamente • ${new Date().toLocaleString('pt-BR')}</span>
  </div>
 
</body>
</html>`;
 
  // Abre janela de impressão
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Permita pop-ups para gerar o PDF.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}