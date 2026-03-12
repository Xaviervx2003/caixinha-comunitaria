import { AlertTriangle, TrendingDown, DollarSign, Percent, CheckCircle2, User } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';

interface Debtor {
  id: number;
  name: string;
  totalLoan: number;
  currentDebt: number;
  monthlyInterest: number;
  role?: 'member' | 'external';
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
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-800 tracking-tight">Tudo Quitado!</h3>
        <p className="text-gray-500 font-medium mt-2">Não há nenhum empréstimo em aberto na caixinha no momento.</p>
      </div>
    );
  }

  const totalDevido = sortedDebtors.reduce((acc, d) => acc + parseFloat(d.currentDebt.toString()), 0);
  const totalJuros = sortedDebtors.reduce((acc, d) => acc + parseFloat(d.currentDebt.toString()) * 0.1, 0);
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" /> Devedores Ativos
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Acompanhamento de saldos e rendimentos esperados.</p>
        </div>
        <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {sortedDebtors.length} pendente{sortedDebtors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Capital na Rua</p>
            <p className="text-3xl font-black text-red-500 tracking-tighter">{formatCurrency(totalDevido)}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Juros a Receber</p>
            <p className="text-3xl font-black text-amber-500 tracking-tighter">{formatCurrency(totalJuros)}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Percent className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="grid gap-5">
        {sortedDebtors.map((debtor, index) => {
          const debtAmount = parseFloat(debtor.currentDebt.toString());
          const loanAmount = parseFloat(debtor.totalLoan.toString());
          const paidAmount = loanAmount - debtAmount;
          const progressPercent = loanAmount > 0
            ? Math.min(100, Math.max(0, (paidAmount / loanAmount) * 100))
            : 0;
          
          const isExternal = debtor.role === 'external';
          const monthlyInterest = debtAmount * 0.1;
          const monthlyTotal = isExternal ? monthlyInterest : 200 + monthlyInterest;

          // Cores para o top 3 maiores devedores
          const rankColors = ['bg-red-500 text-white', 'bg-orange-400 text-white', 'bg-amber-400 text-white'];
          const rankClass = index < 3 ? rankColors[index] : 'bg-gray-100 text-gray-500';
          const progressColor = progressPercent > 50 ? 'bg-emerald-500' : progressPercent > 25 ? 'bg-amber-400' : 'bg-red-500';

          return (
            <div key={debtor.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group hover:border-gray-300 transition-colors">
              
              {/* Etiqueta de Tomador Externo */}
              {isExternal && (
                 <span className="absolute top-4 right-4 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10">
                   Tomador Externo
                 </span>
              )}

              <div className="p-5 sm:p-6">
                {/* Header do card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${rankClass}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{debtor.name}</h3>
                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" /> ID: {debtor.id}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Saldo Devedor Atual</p>
                    <p className="text-2xl font-black text-red-500 tracking-tighter">{formatCurrency(debtAmount)}</p>
                  </div>
                </div>

                {/* Progresso (Visão Executiva) */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Evolução do Pagamento</span>
                    <span className="text-sm font-black text-gray-700">
                      {progressPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-medium text-emerald-600">Amortizado: {formatCurrency(paidAmount)}</span>
                    <span className="text-xs font-medium text-gray-400">Total Inicial: {formatCurrency(loanAmount)}</span>
                  </div>
                </div>

                {/* Mensalidade Estimada */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Fatura Estimada ({mesAtual})
                  </p>
                  
                  <div className={`grid ${isExternal ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                    
                    {!isExternal && (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cota Base</p>
                        <p className="text-sm font-black text-gray-700">{formatCurrency(200)}</p>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Juros (10%)</p>
                      <p className="text-sm font-black text-amber-600">{formatCurrency(monthlyInterest)}</p>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-3 text-center shadow-md">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                      <p className="text-sm font-black text-emerald-400">{formatCurrency(monthlyTotal)}</p>
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