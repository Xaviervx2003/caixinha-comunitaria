import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
import { TrendingUp, Users, DollarSign, PieChart } from 'lucide-react';
import { calculateCollectionsFromTransactions, CAIXINHA_CONFIG } from '@shared/finance';

export function LucrosSection() {
  const { data: participants = [], isLoading: loadingP } = trpc.caixinha.listParticipants.useQuery(undefined) as { data: any[]; isLoading: boolean };
  const { data: allTransactions = [], isLoading: loadingT } = trpc.caixinha.getAllTransactions.useQuery(undefined) as { data: any[]; isLoading: boolean };
  const { data: balancete } = trpc.caixinha.getBalancete.useQuery(undefined) as { data: any };
  const isLoading = loadingP || loadingT;

  const participantRoles = useMemo(
    () => Object.fromEntries(participants.map((p) => [p.id, (p.role ?? 'member') as 'member' | 'external'])) as Record<number, 'member' | 'external'>,
    [participants]
  );

  const { totalInterest } = useMemo(() => {
    const cols = calculateCollectionsFromTransactions(
      allTransactions.map((t) => ({ participantId: t.participantId, type: t.type, amount: t.amount })),
      participantRoles,
    );
    return { totalInterest: cols.totalInterest };
  }, [allTransactions, participantRoles]);

  const members = useMemo(() => participants.filter((p) => (p.role ?? 'member') === 'member'), [participants]);
  const totalRendimentos = balancete ? parseFloat(balancete.totalRendimentos || '0') : totalInterest;
  const distribuicaoPorMembro = members.length > 0 ? totalRendimentos / members.length : 0;
  const totalLoanMembers = useMemo(() => members.reduce((acc, p) => acc + parseFloat(p.totalLoan?.toString() || '0'), 0), [members]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Calculando distribuicao...</p>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200">
          <div className="bg-gray-100 rounded-full p-6 mb-4"><TrendingUp className="w-12 h-12 text-gray-400" /></div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Sem membros cadastrados</h3>
          <p className="text-gray-500 text-sm">Adicione membros para calcular a distribuicao.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <div className="bg-[#00C853]/10 text-[#00C853] p-2 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
        <div>
          <h2 className="font-black text-gray-800 uppercase tracking-tight">Distribuicao de Lucros</h2>
          <p className="text-xs text-gray-500 font-bold">Rendimentos acumulados do ciclo atual</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-[#00C853]" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Rendimentos</p></div>
          <p className="text-2xl font-black text-gray-800">{formatCurrency(totalRendimentos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Membros</p></div>
          <p className="text-2xl font-black text-gray-800">{members.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2"><PieChart className="w-4 h-4 text-purple-500" /><p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Por Membro</p></div>
          <p className="text-2xl font-black text-gray-800">{formatCurrency(distribuicaoPorMembro)}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Distribuicao Individual</h3>
          <p className="text-xs text-gray-400 mt-0.5">Igualitaria e proporcional ao emprestimo</p>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map((member) => {
            const memberLoan = parseFloat(member.totalLoan?.toString() || '0');
            const percLoan = totalLoanMembers > 0 ? memberLoan / totalLoanMembers : 0;
            const distribProp = totalRendimentos * percLoan;
            const currentDebt = parseFloat(member.currentDebt?.toString() || '0');
            return (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#00C853]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-[#00C853]">{member.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400">Emprestimo: {formatCurrency(memberLoan)}{currentDebt > 0 && <span className="text-orange-500 ml-2">Deve {formatCurrency(currentDebt)}</span>}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-400 font-bold mb-0.5">Igualitario</p>
                  <p className="text-sm font-black text-[#00C853]">{formatCurrency(distribuicaoPorMembro)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 font-bold mb-0.5">Proporcional</p>
                  <p className="text-sm font-black text-blue-600">{formatCurrency(distribProp)}</p>
                </div>
                <div className="w-20 shrink-0 hidden md:block">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00C853] rounded-full" style={{ width: `${Math.min(percLoan * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-0.5">{(percLoan * 100).toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400 font-bold">Total: {members.length} membros</p>
          <p className="text-xs font-black text-gray-700">Rendimentos: <span className="text-[#00C853]">{formatCurrency(totalRendimentos)}</span></p>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Externos nao participam da distribuicao de lucros.</p>
    </div>
  );
}
