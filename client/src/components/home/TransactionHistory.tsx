// client/src/components/home/HistoricoSection.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Clock, TrendingUp, Users, AlertTriangle,
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export function HistoricoSection() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const { data: snapshot, isLoading } = trpc.caixinha.getMonthSnapshot.useQuery({ month: monthStr });

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const paidRate = snapshot && snapshot.totalParticipants > 0
    ? Math.round((snapshot.paidCount / snapshot.totalParticipants) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Cabeçalho + navegador */}
      <div className="bg-[#0F1117] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Histórico por Mês</p>
          <p className="text-white font-black text-2xl">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[100px]">
            <p className="text-white font-black">{MONTH_NAMES[selectedMonth - 1]}</p>
            <p className="text-gray-400 text-sm">{selectedYear}</p>
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : snapshot && snapshot.totalParticipants > 0 ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Arrecadado', value: formatCurrency(snapshot.totalCollected), icon: TrendingUp, color: '#00C853', bg: '#dcfce7' },
              { label: 'Pagos', value: String(snapshot.paidCount), icon: CheckCircle2, color: '#00C853', bg: '#dcfce7' },
              { label: 'Pendentes', value: String(snapshot.unpaidCount), icon: XCircle, color: '#EF4444', bg: '#fee2e2' },
              { label: 'Com Multa', value: String(snapshot.lateCount), icon: AlertTriangle, color: '#F59E0B', bg: '#fef3c7' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: stat.bg }}>
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Barra adimplência */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Taxa de Adimplência
              </p>
              <span className="text-2xl font-black" style={{
                color: paidRate >= 80 ? '#00C853' : paidRate >= 50 ? '#F59E0B' : '#EF4444',
              }}>{paidRate}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${paidRate}%`,
                backgroundColor: paidRate >= 80 ? '#00C853' : paidRate >= 50 ? '#F59E0B' : '#EF4444',
              }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 font-bold">
              <span>{snapshot.paidCount} pagos</span>
              <span>{snapshot.totalParticipants} total</span>
            </div>
          </div>

          {/* Listas lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                <h3 className="font-bold text-gray-800">Pagos ({snapshot.paidParticipants.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {snapshot.paidParticipants.length === 0 ? (
                  <p className="px-5 py-8 text-center text-gray-400 text-sm">Nenhum pagamento</p>
                ) : snapshot.paidParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-green-700">{p.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(p.paidLate === true || p.paidLate === 1) && (
                        <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Multa
                        </span>
                      )}
                      <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-gray-800">Pendentes ({snapshot.unpaidParticipants.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {snapshot.unpaidParticipants.length === 0 ? (
                  <p className="px-5 py-8 text-center text-gray-400 text-sm">Todos pagaram! 🎉</p>
                ) : snapshot.unpaidParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-red-700">{p.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                      {formatCurrency(parseFloat(p.currentDebt?.toString() || '0'))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-gray-100 rounded-full p-8 mb-4">
            <ChevronLeft className="w-10 h-10 text-gray-300" />
          </div>
          <p className="font-bold text-gray-500">Nenhum dado para {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
          <p className="text-sm text-gray-400 mt-1">Navegue pelos meses para ver o histórico</p>
        </div>
      )}
    </div>
  );
}
