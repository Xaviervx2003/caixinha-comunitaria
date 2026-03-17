import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
import { History, TrendingUp, TrendingDown, Users, CheckCircle, XCircle } from 'lucide-react';

export function HistoricoSection() {
  const { data: monthlyHistory = [], isLoading } = trpc.caixinha.getMonthlySummaryHistory.useQuery({ limit: 24 }) as { data: any[]; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando historico...</p>
        </div>
      </div>
    );
  }

  if (monthlyHistory.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
          <div className="bg-gray-100 rounded-full p-6 mb-4"><History className="w-12 h-12 text-gray-400" /></div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhum historico ainda</h3>
          <p className="text-gray-500 text-sm">Os ciclos fechados aparecerao aqui.</p>
        </div>
      </div>
    );
  }

  const monthNames: Record<string, string> = {
    '01': 'Janeiro','02': 'Fevereiro','03': 'Marco','04': 'Abril',
    '05': 'Maio','06': 'Junho','07': 'Julho','08': 'Agosto',
    '09': 'Setembro','10': 'Outubro','11': 'Novembro','12': 'Dezembro',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="bg-[#00C853]/10 text-[#00C853] p-2 rounded-lg"><History className="w-5 h-5" /></div>
        <div>
          <h2 className="font-black text-gray-800 uppercase tracking-tight">Historico por Mes</h2>
          <p className="text-xs text-gray-500 font-bold">{monthlyHistory.length} ciclo(s) fechado(s)</p>
        </div>
      </div>
      <div className="space-y-3">
        {monthlyHistory.slice().reverse().map((snapshot: any) => {
          const [year, month] = (snapshot.month || '').split('-');
          const monthLabel = monthNames[month] ?? month;
          const totalArrecadado = parseFloat(snapshot.totalArrecadado || snapshot.totalFees || '0');
          const totalRendimentos = parseFloat(snapshot.totalRendimentos || snapshot.totalInterest || '0');
          const contasAReceber = parseFloat(snapshot.contasAReceber || snapshot.totalDebts || '0');
          const totalParticipants = snapshot.totalParticipants ?? 0;
          const inadimplentes = snapshot.inadimplentes ?? (snapshot.inadimplenciaSegmentada ? (snapshot.inadimplenciaSegmentada.membros ?? 0) + (snapshot.inadimplenciaSegmentada.externosComDivida ?? 0) : 0);
          return (
            <div key={snapshot.month} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-800 text-base">{monthLabel}</span>
                  <span className="text-gray-400 font-bold text-sm">{year}</span>
                </div>
                <span className="text-xs font-bold text-[#00C853] bg-green-50 border border-green-200 px-2 py-1 rounded-full">Fechado</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-[#00C853]" /><p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Arrecadado</p></div>
                  <p className="text-base font-black text-gray-800">{formatCurrency(totalArrecadado)}</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /><p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Rendimentos</p></div>
                  <p className="text-base font-black text-gray-800">{formatCurrency(totalRendimentos)}</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1"><TrendingDown className="w-3.5 h-3.5 text-orange-500" /><p className="text-xs text-gray-400 font-bold uppercase tracking-wide">A Receber</p></div>
                  <p className="text-base font-black text-gray-800">{formatCurrency(contasAReceber)}</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-gray-400" /><p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Participantes</p></div>
                  <p className="text-base font-black text-gray-800">{totalParticipants > 0 ? `${totalParticipants}${inadimplentes > 0 ? ` (${inadimplentes} inad.)` : ''}` : '-'}</p>
                </div>
              </div>
              {totalParticipants > 0 && inadimplentes > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-red-50 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-bold">{inadimplentes} participante(s) inadimplente(s)</p>
                </div>
              )}
              {totalParticipants > 0 && inadimplentes === 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-green-50 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00C853] shrink-0" />
                  <p className="text-xs text-green-700 font-bold">100% dos participantes pagaram</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
