import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle, TrendingDown, Wallet, History, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';

interface ParticipantCardProps {
  participant: any;
  onPayment?: () => void;
  onAmortize?: () => void;
  onAddLoan?: () => void;
  onViewHistory?: () => void;
  onRegisterPayment?: (id: string) => void;
  onEditLoan?: () => void;
  onEditDebt?: () => void;
  onEditName?: () => void;
  onEditEmail?: () => void;
  onDelete?: () => void;
  onViewChart?: () => void;
}

export function ParticipantCard({ participant, onPayment, onAmortize, onAddLoan, onViewHistory, onRegisterPayment, onEditLoan, onEditDebt, onEditName, onEditEmail, onDelete, onViewChart }: ParticipantCardProps) {
  const status = getParticipantStatus(participant);
  const progress = calculateProgress(participant.totalLoan, participant.currentDebt);
  const monthlyInterest = calculateMonthlyInterest(participant.currentDebt);
  const monthlyTotal = calculateMonthlyTotal(participant.currentDebt);

  // Use monthly payments from participant data (already fetched by listParticipants)
  const monthlyPayments = participant.monthlyPayments || [];
  const [isExpanded, setIsExpanded] = useState(true);

  const statusColors = {
    green: 'bg-[#00C853] border-[#00C853] text-white',
    yellow: 'bg-[#FFD600] border-[#FFD600] text-black',
    red: 'bg-[#FF3D00] border-[#FF3D00] text-white',
  };

  const statusText = {
    green: 'EM DIA',
    yellow: 'JUROS PAGOS',
    red: 'PENDENTE',
  };

  const StatusIcon = {
    green: CheckCircle2,
    yellow: AlertCircle,
    red: XCircle,
  }[status];

  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [monthToUnmark, setMonthToUnmark] = useState<{ id: number; month: string; year: number } | null>(null);
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  const utils = trpc.useUtils();
  const unmarkPaymentMutation = trpc.caixinha.unmarkPayment.useMutation({
    onSuccess: (data) => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getMonthlyPayments.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      if (data.message) {
        showSuccessToast(data.message);
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Erro ao desmarcar pagamento';
      showErrorToast(errorMessage);
    },
  });

  const handleUnmarkClick = (paymentId: number, monthFull: string, year: number) => {
    setMonthToUnmark({ id: paymentId, month: monthFull, year });
    setIsConfirmOpen(true);
  };

  const handleConfirmUnmark = async () => {
    if (monthToUnmark && monthToUnmark.id) {
      await unmarkPaymentMutation.mutate({ paymentId: monthToUnmark.id, participantId: participant.id });
      setIsConfirmOpen(false);
      setMonthToUnmark(null);
    }
  };

  const minYear = 2020;
  const maxYear = currentYear + 2;

  // Get paid months for selected year
  const paidMonthsForYear = monthlyPayments
    .filter((p: any) => p.year === selectedYear && p.paid === 1)
    .map((p: any) => p.month);

  return (
    <div className="relative bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Header - Clickable to toggle expand */}
      <div 
        className="flex justify-between items-start gap-2 cursor-pointer group"
        onClick={toggleExpand}
      >
        <div className="flex-1">
          <h3 className="text-xl font-bold text-black uppercase tracking-tight group-hover:text-gray-700 transition-colors">{participant.name}</h3>
          {!isExpanded && (
            <span className="text-sm font-bold text-[#FF3D00]">
              Dívida: {formatCurrency(participant.currentDebt)}
            </span>
          )}
          {isExpanded && (
            <span className="text-xs font-mono text-gray-500">ID: {participant.id}</span>
          )}
        </div>
        {isExpanded && (
          <Badge className={cn("rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold px-3 py-1 whitespace-nowrap", statusColors[status])}>
            <StatusIcon className="w-4 h-4 mr-2" />
            {statusText[status]}
          </Badge>
        )}
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="text-red-600 hover:text-red-800 font-bold text-lg hover:bg-red-50 rounded p-1 transition-colors flex-shrink-0"
            title="Deletar participante"
          >
            ✕
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Debt Info */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase text-gray-600">Emprestado</span>
              <span className="text-lg font-black text-black">{formatCurrency(participant.totalLoan)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase text-gray-600">Saldo Devedor</span>
              <span className="text-lg font-black text-[#FF3D00]">{formatCurrency(participant.currentDebt)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase text-gray-600">Mensalidade</span>
              <span className="text-sm font-bold text-black">{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {parseFloat(participant.totalLoan) > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-gray-600">Progresso</span>
                <span className="text-xs font-bold text-gray-600">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 border-2 border-black">
                <div
                  className="h-full bg-[#00C853] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Monthly Payments Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-600">Meses Pagos</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectedYear > minYear && setSelectedYear(selectedYear - 1);
                  }}
                  disabled={selectedYear <= minYear}
                  className="h-6 w-6 flex items-center justify-center bg-white border border-black rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ano anterior"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-xs font-black min-w-[40px] text-center">{selectedYear}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectedYear < maxYear && setSelectedYear(selectedYear + 1);
                  }}
                  disabled={selectedYear >= maxYear}
                  className="h-6 w-6 flex items-center justify-center bg-white border border-black rounded-none hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próximo ano"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {MONTHS.map((month) => {
                const isPaid = paidMonthsForYear.includes(month);
                const paymentRecord = monthlyPayments.find((p: any) => 
                  p.month.toLowerCase() === month && p.year === selectedYear
                );
                return (
                  <div
                    key={month}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPaid && paymentRecord) {
                        handleUnmarkClick(paymentRecord.id, month, selectedYear);
                      }
                    }}
                    className={cn(
                      "h-8 flex items-center justify-center text-xs font-bold rounded-none border-2 border-black transition-all",
                      isPaid 
                        ? "bg-[#00C853] text-white cursor-pointer hover:opacity-80" 
                        : "bg-gray-100 text-gray-400 cursor-default"
                    )}
                    title={isPaid ? `${month}/${selectedYear} - Pago (clique para desmarcar)` : `${month}/${selectedYear}`}
                  >
                    {isPaid && <Check className="w-3 h-3" />}
                    {!isPaid && month.slice(0, 1).toUpperCase()}
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

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onPayment?.() || onRegisterPayment?.(participant.id);
              }}
              className="w-full bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-12"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Pagar Mensal
            </Button>
            
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onAmortize?.();
              }}
              disabled={participant.currentDebt <= 0}
              variant="outline"
              className="w-full bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-12 hover:bg-gray-50"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Amortizar
            </Button>
          </div>

          <div className="flex gap-2 mt-2">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory?.();
              }}
              variant="ghost"
              className="flex-1 text-gray-500 hover:text-black hover:bg-gray-100 font-bold uppercase text-xs h-8"
            >
              <History className="w-3 h-3 mr-2" />
              Histórico
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewChart?.();
              }}
              variant="ghost"
              className="flex-1 text-gray-500 hover:text-black hover:bg-gray-100 font-bold uppercase text-xs h-8"
            >
              <TrendingDown className="w-3 h-3 mr-2" />
              Gráfico
            </Button>
          </div>

          {/* Edit Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t-2 border-gray-200">
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onEditName?.();
              }}
              className="w-full bg-blue-500 text-white border-2 border-blue-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-10"
            >
              Editar Nome
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onEditEmail?.();
              }}
              className="w-full bg-cyan-500 text-white border-2 border-cyan-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-10"
            >
              Editar Email
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onEditLoan?.();
              }}
              className="w-full bg-purple-500 text-white border-2 border-purple-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-10"
            >
              Editar Empréstimo
            </Button>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onEditDebt?.();
              }}
              className="w-full bg-orange-500 text-white border-2 border-orange-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all rounded-none font-bold uppercase text-xs h-10"
            >
              Editar Saldo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function getParticipantStatus(participant: any): 'green' | 'yellow' | 'red' {
  const debt = parseFloat(participant.currentDebt);
  if (debt === 0) return 'green';
  if (participant.interestPaid) return 'yellow';
  return 'red';
}

function calculateProgress(totalLoan: any, currentDebt: any): number {
  const total = parseFloat(totalLoan);
  const current = parseFloat(currentDebt);
  if (total === 0) return 0;
  return Math.round(((total - current) / total) * 100);
}

function calculateMonthlyInterest(currentDebt: any): number {
  return parseFloat(currentDebt) * 0.10;
}

function calculateMonthlyTotal(currentDebt: any): number {
  return 200 + calculateMonthlyInterest(currentDebt);
}
