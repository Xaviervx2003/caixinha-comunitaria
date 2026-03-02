import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ConfirmationModal';

interface MonthsGridProps {
  participantId: number;
  monthlyPayments?: any[];
  year?: number;
  onUnmarkPayment?: (paymentId: number) => void;
}

const MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function MonthsGrid({ participantId, monthlyPayments = [], year: initialYear, onUnmarkPayment }: MonthsGridProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear ?? currentYear);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [monthToUnmark, setMonthToUnmark] = useState<{ id: number; month: string; year: number } | null>(null);
  const minYear = 2020;
  const maxYear = currentYear + 2;

  const paidMonthsForYear = useMemo(() => {
    const paid = new Set<string>();
    monthlyPayments.forEach((payment: any) => {
      if ((payment.paid === 1 || payment.paid === true) && payment.year === selectedYear) {
        paid.add(payment.month.toLowerCase());
      }
    });
    return paid;
  }, [monthlyPayments, selectedYear]);

  const handlePreviousYear = () => {
    if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const handleUnmarkClick = (paymentId: number, monthFull: string, year: number) => {
    setMonthToUnmark({ id: paymentId, month: monthFull, year });
    setIsConfirmOpen(true);
  };

  const handleConfirmUnmark = async () => {
    if (monthToUnmark && onUnmarkPayment) {
      await onUnmarkPayment(monthToUnmark.id);
      setIsConfirmOpen(false);
      setMonthToUnmark(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase text-gray-600">Meses Pagos</p>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePreviousYear}
              disabled={selectedYear <= minYear}
              className="h-8 w-8 p-0 bg-white border-2 border-black rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-black uppercase min-w-[60px] text-center">{selectedYear}</span>
            
            <Button
              onClick={handleNextYear}
              disabled={selectedYear >= maxYear}
              className="h-8 w-8 p-0 bg-white border-2 border-black rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {MONTHS.map((monthShort, index) => {
            const monthFull = MONTH_NAMES[index];
            const isPaid = paidMonthsForYear.has(monthFull);
            const paymentRecord = monthlyPayments.find((p: any) => 
              p.month.toLowerCase() === monthFull && p.year === selectedYear
            );
            
            return (
              <div
                key={monthShort}
                className={`
                  aspect-square flex items-center justify-center text-xs font-black uppercase
                  border-2 border-black rounded-none
                  transition-all ${isPaid ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                  ${isPaid 
                    ? 'bg-[#00C853] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]' 
                    : 'bg-gray-200 text-gray-500 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                  }
                `}
                title={isPaid ? `${monthFull}/${selectedYear} - Pago (clique para desmarcar)` : `${monthFull}/${selectedYear} - Não pago`}
                onClick={() => {
                  if (isPaid && paymentRecord) {
                    handleUnmarkClick(paymentRecord.id, monthFull, selectedYear);
                  }
                }}
              >
                {monthShort}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unmark Payment Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Desmarcar Pagamento"
        description={monthToUnmark ? `Tem certeza que deseja desmarcar ${monthToUnmark.month}/${monthToUnmark.year}? O mês voltará a aparecer como não pago.` : ''}
        confirmText="Desmarcar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleConfirmUnmark}
        onCancel={() => {
          setIsConfirmOpen(false);
          setMonthToUnmark(null);
        }}
      />
    </div>
  );
}
