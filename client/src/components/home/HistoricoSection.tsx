// client/src/components/home/HistoricoSection.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Clock, TrendingUp, Users, AlertTriangle,
} from 'lucide-react';

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
  const rateColor = paidRate >= 80 ? '#00C853' : paidRate >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Seletor de Mês */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-3xl font-black text-gray-900">{MONTH_NAMES[selectedMonth - 1]}</p>
            <p className="text-lg text-gray-500 font-bold">{selectedYear}</p>
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : snapshot ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Arrecadado', value: formatCurrency(snapshot.totalCollected), icon: TrendingUp, color: '#00C853', bg: '#dcfce7' },
              { label: 'Participantes', value: String(snapshot.totalParticipants), icon: Users, color: '#8B5CF6', bg: '#ede9fe' },
              { label: 'Pagos', value: String(snapshot.paidCount), icon: CheckCircle2, color: '#00C853', bg: '#dcfce7' },
              { label: 'Pendentes', value: String(snapshot.unpaidCount), icon: AlertTriangle, color: '#EF4444', bg: '#fee2e2' },
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

          {/* Barra Adimplência */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">Taxa de Adimplência</p>
              <span className="text-2xl font-black" style={{ color: rateColor }}>{paidRate}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${paidRate}%`, backgroundColor: rateColor }} />
            </div>
            {snapshot.lateCount > 0 && (
              <p className="text-xs text-orange-500 font-bold mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {snapshot.lateCount} pagamento{snapshot.lateCount > 1 ? 's' : ''} com multa
              </p>
            )}
          </div>

          {/* Listas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">
                  Pagos ({snapshot.paidParticipants.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {snapshot.paidParticipants.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm font-bold">Nenhum pagamento</p>
                ) : snapshot.paidParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <span className="text-xs font-black text-green-600">{p.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                    </div>
                    {(p.paidLate === true || (p.paidLate as any) === 1) ? (
                      <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Multa
                      </span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#00C853]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">
                  Pendentes ({snapshot.unpaidParticipants.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {snapshot.unpaidParticipants.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm font-bold">Todos pagaram! 🎉</p>
                ) : snapshot.unpaidParticipants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                        <span className="text-xs font-black text-red-500">{p.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-red-500">
                      {formatCurrency(parseFloat(p.currentDebt?.toString() || '0'))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20 text-center">
          <p className="text-gray-400 font-bold text-lg">Nenhum dado para este mês</p>
          <p className="text-gray-300 text-sm mt-1">Registre pagamentos para ver o snapshot</p>
        </div>
      )}
    </div>
  );
}
