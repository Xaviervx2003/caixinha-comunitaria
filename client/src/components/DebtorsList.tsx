import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  // Filter and sort debtors by current debt (highest first)
  const sortedDebtors = debtors
    .filter((d) => parseFloat(d.currentDebt.toString()) > 0)
    .sort((a, b) => parseFloat(b.currentDebt.toString()) - parseFloat(a.currentDebt.toString()));

  if (sortedDebtors.length === 0) {
    return (
      <div className="bg-[#00C853] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-white text-center">
        <div className="text-4xl font-black mb-2">✓</div>
        <p className="font-bold uppercase">Ninguém deve dinheiro!</p>
        <p className="text-sm opacity-90 mt-2">Todos os empréstimos foram quitados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-[#FF3D00]" />
        <h2 className="text-2xl font-black uppercase">Quem Deve</h2>
        <Badge className="bg-[#FF3D00] text-white border-2 border-black rounded-none font-bold">
          {sortedDebtors.length} devedor{sortedDebtors.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      <div className="grid gap-3">
        {sortedDebtors.map((debtor) => {
          const debtAmount = parseFloat(debtor.currentDebt.toString());
          const loanAmount = parseFloat(debtor.totalLoan.toString());
          const paidAmount = loanAmount - debtAmount;
          const progressPercent = (paidAmount / loanAmount) * 100;
          const monthlyInterest = debtAmount * 0.1;

          return (
            <div
              key={debtor.id}
              className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black uppercase text-lg">{debtor.name}</h3>
                  <p className="text-xs text-gray-500 font-bold">ID: {debtor.id}</p>
                </div>
                <Badge className="bg-[#FF3D00] text-white border-2 border-black rounded-none font-bold text-sm">
                  DEVENDO
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase">Emprestado</p>
                  <p className="text-xl font-black text-gray-800">R$ {loanAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FF3D00] uppercase">Saldo Devedor</p>
                  <p className="text-xl font-black text-[#FF3D00]">R$ {debtAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <p className="text-xs font-bold text-gray-600">Progresso de Amortização</p>
                  <p className="text-xs font-bold text-gray-600">{progressPercent.toFixed(1)}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 border-2 border-black">
                  <div
                    className="h-full bg-[#00C853] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Monthly Payment Info */}
              <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded-none">
                <p className="text-xs font-bold text-gray-600 uppercase mb-2">Mensalidade de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Cota</p>
                    <p className="font-black text-sm">R$ 200</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Juros (10%)</p>
                    <p className="font-black text-sm text-[#FF9800]">R$ {monthlyInterest.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">Total</p>
                    <p className="font-black text-sm text-[#FF3D00]">R$ {(200 + monthlyInterest).toFixed(2)}</p>
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
