// client/src/components/MonthSnapshotModal.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format-currency';
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface MonthSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthSnapshotModal({ isOpen, onClose }: MonthSnapshotModalProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const { data: snapshot, isLoading } = trpc.caixinha.getMonthSnapshot.useQuery(
    { month: monthStr },
    { enabled: isOpen }
  );

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const nextMonth = () => {
    const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
  const paidRate = snapshot ? Math.round((snapshot.paidCount / snapshot.totalParticipants) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl w-full sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900">Snapshot Histórico</DialogTitle>
        </DialogHeader>

        {/* Seletor de mês */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
          <button onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900">{MONTH_NAMES[selectedMonth - 1]}</p>
            <p className="text-sm text-gray-500 font-medium">{selectedYear}</p>
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : snapshot ? (
          <div className="space-y-4">

            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#00C853]/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[#00C853]">{snapshot.paidCount}</p>
                <p className="text-xs font-bold text-gray-600 uppercase">Pagos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-red-500">{snapshot.unpaidCount}</p>
                <p className="text-xs font-bold text-gray-600 uppercase">Devedores</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-orange-500">{snapshot.lateCount}</p>
                <p className="text-xs font-bold text-gray-600 uppercase">Com Multa</p>
              </div>
            </div>

            {/* Total arrecadado */}
            <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#00C853]" />
                <span className="text-white font-bold text-sm">Total Arrecadado</span>
              </div>
              <span className="text-[#00C853] font-black text-xl">{formatCurrency(snapshot.totalCollected)}</span>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Taxa de adimplência</span>
                <span>{paidRate}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${paidRate}%`,
                    backgroundColor: paidRate >= 80 ? '#00C853' : paidRate >= 50 ? '#FFD600' : '#FF3D00'
                  }}
                />
              </div>
            </div>

            {/* Quem pagou */}
            {snapshot.paidParticipants.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#00C853]" /> Pagos ({snapshot.paidParticipants.length})
                </h3>
                <div className="space-y-1">
                  {snapshot.paidParticipants.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                      <div className="flex items-center gap-2">
                        {(p.paidLate === true || (p.paidLate as any) === 1) && (
                          <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Com multa
                          </span>
                        )}
                        <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quem não pagou */}
            {snapshot.unpaidParticipants.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" /> Não pagos ({snapshot.unpaidParticipants.length})
                </h3>
                <div className="space-y-1">
                  {snapshot.unpaidParticipants.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                      <span className="text-xs font-bold text-red-500">
                        Dívida: {formatCurrency(parseFloat(p.currentDebt?.toString() || '0'))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <p className="font-bold">Nenhum dado para este mês</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
