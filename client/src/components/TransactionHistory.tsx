import { formatCurrency } from '@/lib/format-currency';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { MonthsGrid } from './MonthsGrid';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TransactionHistoryProps {
  transactions?: any[];
  participantId?: number;
  monthlyPayments?: any[];
  onUnmarkPayment?: (paymentId: number) => void;
}

export function TransactionHistory({ transactions = [], participantId, monthlyPayments = [], onUnmarkPayment }: TransactionHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollUp = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 100, behavior: 'smooth' });
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300">
        <p className="text-sm font-bold uppercase">Nenhuma transação registrada</p>
      </div>
    );
  }

  // Ordenar transações por data (mais recentes primeiro)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      {participantId && monthlyPayments.length > 0 && (
        <MonthsGrid participantId={participantId} monthlyPayments={monthlyPayments} year={2026} onUnmarkPayment={onUnmarkPayment} />
      )}
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-xs font-black uppercase text-gray-600">Histórico de Transações</span>
          <div className="flex gap-1">
            <Button
              onClick={scrollUp}
              size="sm"
              className="h-6 w-6 p-0 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none active:translate-y-[2px] active:shadow-none transition-all rounded-none"
              title="Scroll para cima"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              onClick={scrollDown}
              size="sm"
              className="h-6 w-6 p-0 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none active:translate-y-[2px] active:shadow-none transition-all rounded-none"
              title="Scroll para baixo"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[350px] w-full pr-4 border-2 border-black rounded-none" ref={scrollRef}>
          <div className="space-y-3">
          {sortedTransactions.map((t) => {
            const transactionDate = new Date(t.createdAt);
            const isValidDate = !isNaN(transactionDate.getTime());
            
            return (
              <div key={t.id} className="flex items-center justify-between p-3 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3 flex-1">
                  {t.type === 'payment' && <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                  {t.type === 'amortization' && <ArrowDownCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                  {t.type === 'loan' && <ArrowUpCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase text-gray-500">
                      {isValidDate 
                        ? format(transactionDate, "dd 'de' MMM 'de' yyyy, HH:mm", { locale: ptBR })
                        : 'Data inválida'
                      }
                    </p>
                    <p className="text-sm font-bold text-black leading-tight">
                      {t.type === 'payment' && 'Pagamento Mensal'}
                      {t.type === 'amortization' && 'Amortização'}
                      {t.type === 'loan' && 'Empréstimo'}
                      {t.month && ` - ${t.month}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="block text-lg font-black text-black">
                    {formatCurrency(parseFloat(t.amount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
