import { formatCurrency } from '@/lib/format-currency';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, Wallet, AlertCircle } from 'lucide-react';
import { isLatePayment } from '@/lib/finance';
import { MonthlyPaymentRecord } from './ParticipantCard'; // Importando a Interface limpa do cartão

// 🌟 DICA 12: UNIÕES DISCRIMINADAS (O TypeScript só permite estas 4 exatas palavras agora)
export type TransactionType = 'payment' | 'amortization' | 'loan' | 'reversal';

export interface TxRow {
  id: number | string;
  type: TransactionType; // Deixou de ser um 'string' genérico!
  amount: number | string;
  month?: string | null;
  createdAt?: string | Date | null;
}

interface TransactionHistoryProps {
  transactions?: TxRow[];
  participantId?: number;
  monthlyPayments?: MonthlyPaymentRecord[]; // Removido o 'any[]'
  onUnmarkPayment?: (paymentId: number) => void;
}

const TYPE_CONFIG: Record<TransactionType, { label: string; icon: any; color: string; bg: string }> = {
  payment:      { label: 'Pagamento Mensal',  icon: Wallet,          color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
  amortization: { label: 'Amortização',       icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  loan:         { label: 'Empréstimo',        icon: ArrowUpCircle,   color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
  reversal:     { label: 'Estorno',           icon: ArrowUpCircle,   color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

export function TransactionHistory({
  transactions = [],
}: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300">
        <p className="text-sm font-bold uppercase">Nenhuma transação registrada</p>
      </div>
    );
  }

  // Tratamento seguro para as datas
  const getTime = (dateValue: string | Date | null | undefined) => 
    dateValue ? new Date(dateValue).getTime() : 0;

  const sorted = [...transactions].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

  return (
    <ScrollArea className="h-80 w-full border border-gray-200 rounded-lg">
      <div className="divide-y divide-gray-100">
        {sorted.map((t) => {
          const cfg = TYPE_CONFIG[t.type];
          const Icon = cfg.icon;
          
          const date = t.createdAt ? new Date(t.createdAt) : new Date(NaN);
          const validDate = !isNaN(date.getTime());

          const parsedAmount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;

          // Etiqueta de Atraso
          const isLate = t.type === 'payment' && t.month && validDate 
            ? isLatePayment(t.month, date) 
            : false;

          return (
            <div key={t.id} className={`flex items-center gap-3 p-3 ${cfg.bg} border-l-4 rounded-none`}>
              <div className={`${cfg.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black uppercase">{cfg.label}</p>
                  
                  {/* BADGE DE MULTA */}
                  {isLate && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700 uppercase border border-red-200 shadow-sm animate-in zoom-in duration-200">
                      <AlertCircle className="w-2.5 h-2.5 stroke-[3]" />
                      Com Multa
                    </span>
                  )}
                </div>
                
                {t.month && (
                  <p className="text-xs text-gray-500 font-semibold">{t.month}</p>
                )}
                <p className="text-xs text-gray-400">
                  {validDate
                    ? format(date, "dd 'de' MMM 'de' yyyy, HH:mm", { locale: ptBR })
                    : '—'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-base font-black ${cfg.color}`}>
                  {t.type === 'loan' ? '+' : t.type === 'reversal' ? '' : '-'}{formatCurrency(parsedAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}