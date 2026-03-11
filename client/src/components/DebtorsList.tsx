import { AlertTriangle, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { calculateMonthlyInterest, calculateMonthlyTotal, calculateProgress } from '@/lib/finance';

interface Debtor {
  id: number;
  name: string;
  totalLoan: number;
  currentDebt: number;
  monthlyInterest: number;
}

interface DebtorsListProps {
  debtors: Debtor[];
}

export function DebtorsList({ debtors }: DebtorsListProps) {
  const sortedDebtors = debtors
    .filter((d) => parseFloat(d.currentDebt.toString()) > 0)
    .sort((a, b) => parseFloat(b.currentDebt.toString()) - parseFloat(a.currentDebt.toString()));

  if (sortedDebtors.length === 0) {
    return (
      <div className="bg-[#00C853] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-10 text-white text-center">
        <div className="text-6xl font-black mb-3">✓</div>
        <p className="text-xl font-black uppercase tracking-widest">Tudo Quitado!</p>
        <p className="text-sm opacity-80 mt-2 font-medium">Nenhum empréstimo em aberto.</p>
      </div>
    );
  }

  const totalDevido = sortedDebtors.reduce((acc, d) => acc + parseFloat(d.currentDebt.toString()), 0);
  const totalJuros = sortedDebtors.reduce((acc, d) => acc + parseFloat(d.currentDebt.toString()) * 0.1, 0);
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF3D00] border-2 border-black p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Quem Deve</h2>
          <span className="bg-[#FF3D00] text-white border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {sortedDebtors.length} devedor{sortedDebtors.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-[#FF3D00]" />
            <span className="text-xs font-black uppercase text-gray-400">Total Devido</span>
          </div>
          <p className="text-2xl font-black text-[#FF3D00]">{formatCurrency(totalDevido)}</p>
        </div>
        <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-[#FFD600]" />
            <span className="text-xs font-black uppercase text-gray-400">Juros Esperados</span>
          </div>
          <p className="text-2xl font-black text-[#FFD600]">{formatCurrency(totalJuros)}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {sortedDebtors.map((debtor, index) => {
          const debtAmount = parseFloat(debtor.currentDebt.toString());
          const loanAmount = parseFloat(debtor.totalLoan.toString());
          const paidAmount = loanAmount - debtAmount;
          const progressPercent = loanAmount > 0
            ? Math.min(100, Math.max(0, (paidAmount / loanAmount) * 100))
            : 0;
          const monthlyInterest = debtAmount * 0.1;
          const monthlyTotal = 200 + monthlyInterest;
          const rankColor = index === 0 ? '#FF3D00' : index === 1 ? '#FF9800' : '#FFD600';
          const progressColor = progressPercent > 50 ? '#00C853' : progressPercent > 25 ? '#FFD600' : '#FF3D00';

          return (
            <div key={debtor.id} className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {/* Barra de ranking no topo */}
              <div className="h-1.5" style={{ backgroundColor: rankColor }} />

              <div className="p-5">
                {/* Header do card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xl font-black border-2 border-black w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: rankColor, color: index < 2 ? 'white' : 'black' }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black uppercase text-lg leading-none">{debtor.name}</h3>
                      <span className="text-xs font-mono text-gray-400">ID: {debtor.id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-gray-400">Saldo Devedor</p>
                    <p className="text-2xl font-black text-[#FF3D00]">{formatCurrency(debtAmount)}</p>
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-black uppercase text-gray-500">Amortização</span>
                    <span className="text-xs font-black" style={{ color: progressColor }}>
                      {progressPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 border-2 border-black relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${progressPercent}%`, backgroundColor: progressColor }}
                    />
                    {progressPercent > 12 && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: 'white', mixBlendMode: 'difference' }}>
                        {formatCurrency(paidAmount)} pago
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">R$0</span>
                    <span className="text-xs text-gray-400">{formatCurrency(loanAmount)} total</span>
                  </div>
                </div>

                {/* Mensalidade */}
                <div className="border-2 border-black overflow-hidden">
                  <div className="px-3 py-2 bg-black">
                    <p className="text-xs font-black uppercase text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Mensalidade — <span className="capitalize">{mesAtual}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 divide-x-2 divide-black bg-gray-50">
                    <div className="p-3 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cota</p>
                      <p className="text-base font-black">{formatCurrency(200)}</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Juros 10%</p>
                      <p className="text-base font-black text-[#FF9800]">{formatCurrency(monthlyInterest)}</p>
                    </div>
                    <div className="p-3 text-center bg-black">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total</p>
                      <p className="text-base font-black text-[#00C853]">{formatCurrency(monthlyTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
