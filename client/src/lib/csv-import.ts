/**
 * Utilitário para importar dados da Caixinha Comunitária a partir de CSV
 */

export interface ImportedParticipant {
  name: string;
  totalLoan: number;
  currentDebt: number;
}

export interface ImportedTransaction {
  participantId?: number;
  participantName: string;
  type: 'payment' | 'amortization' | 'loan';
  amount: number;
  month?: string;
  year?: number;
  date: string;
}

export interface ImportedMonthlyPayment {
  participantId?: number;
  participantName: string;
  month: string;
  year: number;
  paid: boolean;
}

// Parser CSV simples
function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n');
  const result: string[][] = [];
  let currentLine: string[] = [];
  let insideQuotes = false;
  let currentField = '';

  for (const line of lines) {
    if (!line.trim()) continue;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentLine.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }

    currentLine.push(currentField.trim());
    if (currentLine.some(f => f.length > 0)) {
      result.push(currentLine);
    }
    currentLine = [];
    currentField = '';
  }

  return result;
}

// Extrair participantes do CSV
export function extractParticipantsFromCSV(csvContent: string): ImportedParticipant[] {
  const lines = parseCSV(csvContent);
  const participants: ImportedParticipant[] = [];

  // Encontrar seção de PARTICIPANTES
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0]?.includes('PARTICIPANTES')) {
      startIndex = i + 1; // Pular header
    }
    if (startIndex !== -1 && (lines[i][0]?.includes('TRANSAÇÕES') || lines[i][0]?.includes('HISTÓRICO'))) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = lines.length;

  // Processar linhas de participantes
  for (let i = startIndex + 1; i < endIndex; i++) {
    const line = lines[i];
    if (line.length >= 4 && line[1]) {
      const name = line[1];
      const totalLoan = parseFloat(line[2]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
      const currentDebt = parseFloat(line[3]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

      if (name && !isNaN(totalLoan)) {
        participants.push({
          name,
          totalLoan,
          currentDebt,
        });
      }
    }
  }

  return participants;
}

// Extrair transações do CSV
export function extractTransactionsFromCSV(csvContent: string): ImportedTransaction[] {
  const lines = parseCSV(csvContent);
  const transactions: ImportedTransaction[] = [];

  // Encontrar seção de TRANSAÇÕES
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0]?.includes('TRANSAÇÕES')) {
      startIndex = i + 1; // Pular header
    }
    if (startIndex !== -1 && (lines[i][0]?.includes('HISTÓRICO') || lines[i][0]?.includes('RESUMO'))) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = lines.length;

  // Processar linhas de transações
  for (let i = startIndex + 1; i < endIndex; i++) {
    const line = lines[i];
    if (line.length >= 5 && line[2]) {
      const participantId = line[1] ? parseInt(line[1]) : undefined;
      const participantName = line[2];
      const typeStr = line[3]?.toLowerCase() || '';
      let type: 'payment' | 'amortization' | 'loan' = 'amortization';
      
      if (typeStr.includes('pagamento')) type = 'payment';
      else if (typeStr.includes('empréstimo')) type = 'loan';
      else if (typeStr.includes('amortização')) type = 'amortization';
      
      const amount = parseFloat(line[4]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
      const month = line[5] || '';
      const year = line[6] ? parseInt(line[6]) : undefined;
      const date = line[7] || new Date().toISOString();

      if (participantName && !isNaN(amount)) {
        transactions.push({
          participantId,
          participantName,
          type,
          amount,
          month: month || undefined,
          year,
          date,
        });
      }
    }
  }

  return transactions;
}

// Extrair pagamentos mensais do CSV
export function extractMonthlyPaymentsFromCSV(csvContent: string): ImportedMonthlyPayment[] {
  const lines = parseCSV(csvContent);
  const monthlyPayments: ImportedMonthlyPayment[] = [];

  // Encontrar seção de HISTÓRICO DE PAGAMENTOS MENSAIS
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i][0]?.includes('HISTÓRICO')) {
      startIndex = i + 1; // Pular header
    }
    if (startIndex !== -1 && lines[i][0]?.includes('RESUMO')) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = lines.length;

  // Processar linhas de pagamentos mensais
  for (let i = startIndex + 1; i < endIndex; i++) {
    const line = lines[i];
    if (line.length >= 6 && line[2]) {
      const participantId = line[1] ? parseInt(line[1]) : undefined;
      const participantName = line[2];
      const month = line[3];
      const year = parseInt(line[4]);
      const status = line[5]?.toLowerCase() || '';
      const paid = status.includes('pago');

      if (participantName && month && !isNaN(year)) {
        monthlyPayments.push({
          participantId,
          participantName,
          month,
          year,
          paid,
        });
      }
    }
  }

  return monthlyPayments;
}

// Validar arquivo CSV
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'O arquivo deve ser um CSV válido' };
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    return { valid: false, error: 'O arquivo é muito grande (máximo 10MB)' };
  }

  return { valid: true };
}

// Ler arquivo CSV
export async function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    reader.readAsText(file, 'utf-8');
  });
}

// Processar importação completa
export async function processCSVImport(file: File): Promise<{
  participants: ImportedParticipant[];
  transactions: ImportedTransaction[];
  monthlyPayments: ImportedMonthlyPayment[];
}> {
  const validation = validateCSVFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const csvContent = await readCSVFile(file);
  const participants = extractParticipantsFromCSV(csvContent);
  const transactions = extractTransactionsFromCSV(csvContent);
  const monthlyPayments = extractMonthlyPaymentsFromCSV(csvContent);

  if (participants.length === 0 && transactions.length === 0) {
    throw new Error('Nenhum dado válido encontrado no arquivo');
  }

  return { participants, transactions, monthlyPayments };
}
