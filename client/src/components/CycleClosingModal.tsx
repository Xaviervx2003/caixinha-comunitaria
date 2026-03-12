import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format-currency';
import { Award, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Download, PiggyBank } from 'lucide-react';
import { Participant, Transaction } from './home/types';

interface CycleClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  allTransactions: Transaction[];
}

export function CycleClosingModal({ isOpen, onClose, participants, allTransactions }: CycleClosingModalProps) {
  
  // ── 1. MATEMÁTICA DO FECHAMENTO ──
  let totalCapital = 0;
  let totalProfit = 0;

  const statsMap = new Map<number, { capital: number; isExternal: boolean; debt: number; name: string }>();

  participants.forEach(p => {
    statsMap.set(p.id, {
      name: p.name,
      isExternal: p.role === 'external',
      debt: parseFloat(p.currentDebt.toString()),
      capital: 0,
    });
  });

  allTransactions.forEach(t => {
    if (t.type === 'payment') {
      const p = statsMap.get(t.participantId);
      if (!p) return;

      const amount = parseFloat(t.amount.toString());
      if (p.isExternal) {
        // Externos só pagam juros/lucro
        totalProfit += amount;
      } else {
        // Membros pagam Cota (Capital) + Juros (Lucro)
        const quota = Math.min(amount, 200);
        const interest = amount - quota;
        p.capital += quota;
        totalCapital += quota;
        totalProfit += interest;
      }
    }
  });

  // ── 2. PROCESSAR RESULTADOS POR MEMBRO ──
  const results = Array.from(statsMap.values())
    .filter(p => !p.isExternal || p.debt > 0) // Esconde externos sem dívida
    .map(p => {
      if (p.isExternal) {
        return { ...p, profitShare: 0, sharePercent: 0, grossTarget: 0, netPayout: -p.debt };
      }

      const sharePercent = totalCapital > 0 ? (p.capital / totalCapital) : 0;
      const profitShare = totalProfit * sharePercent;
      const grossTarget = p.capital + profitShare;
      const netPayout = grossTarget - p.debt;

      return { ...p, profitShare, sharePercent: sharePercent * 100, grossTarget, netPayout };
    })
    .sort((a, b) => b.netPayout - a.netPayout); // Ordena quem recebe mais primeiro

  // ── 3. RENDERIZAÇÃO ──
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0A0A] border border-white/10 shadow-2xl rounded-2xl w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto text-white">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
            <Award className="w-8 h-8 text-amber-400" /> Fechamento de Ciclo
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-medium">
            Cálculo oficial de dividendos e distribuição de lucros.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do Cofre */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
               Capital Base
            </p>
            <p className="text-xl font-black text-white">{formatCurrency(totalCapital)}</p>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Lucro Total
            </p>
            <p className="text-xl font-black text-amber-400">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
              <PiggyBank className="w-3 h-3" /> Total Final
            </p>
            <p className="text-xl font-black text-emerald-400">{formatCurrency(totalCapital + totalProfit)}</p>
          </div>
        </div>

        {/* Lista de Membros */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Distribuição por Participante</h3>
          
          {results.map((r, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-lg text-white flex items-center gap-2">
                  {r.name}
                  {r.isExternal && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">Externo</span>}
                </span>
                
                {/* O Veredicto: Recebe ou Paga? */}
                {r.netPayout >= 0 ? (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Recebe (PIX)</span>
                    <span className="text-xl font-black text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-5 h-5" /> {formatCurrency(r.netPayout)}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Ainda Deve à Caixinha</span>
                    <span className="text-xl font-black text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-5 h-5" /> {formatCurrency(Math.abs(r.netPayout))}
                    </span>
                  </div>
                )}
              </div>

              {!r.isExternal && (
                <div className="flex items-center justify-between bg-black/40 rounded-lg p-3 text-xs font-medium text-gray-400">
                  <div className="flex flex-col">
                    <span>Investido: <span className="text-white font-bold">{formatCurrency(r.capital)}</span></span>
                    <span className="text-amber-400">+ Lucro ({r.sharePercent.toFixed(1)}%): <span className="font-bold">{formatCurrency(r.profitShare)}</span></span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
                  <div className="flex flex-col text-right">
                    <span>Bruto: <span className="text-white font-bold">{formatCurrency(r.grossTarget)}</span></span>
                    <span className="text-red-400">- Dívida Ativa: <span className="font-bold">{formatCurrency(r.debt)}</span></span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </DialogContent>
    </Dialog>
  );
}