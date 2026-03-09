import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { ParticipantCard } from '@/components/ParticipantCard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { AuditLog } from '@/components/AuditLog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, PiggyBank, AlertTriangle, RotateCcw, Download, Upload, TrendingUp, Calendar } from 'lucide-react';
import { getLoginUrl } from '@/const';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useLocalCache } from '@/hooks/use-local-cache';
import { exportToCSV } from '@/lib/csv-export';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { ImportedParticipant, ImportedTransaction } from '@/lib/csv-import';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { DebtorsList } from '@/components/DebtorsList';
import { formatCurrency } from '@/lib/format-currency';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { calculateMonthlyInterest } from "@/lib/finance";

type Participant = {
  id: number;
  name: string;
  email?: string | null;
  totalLoan: number | string;
  currentDebt: number | string;
  monthlyPayments?: { id: number; month: string; year: number; paid: boolean | number }[];
  createdAt?: string | Date | null;
};

type Transaction = {
  id: number;
  participantId: number;
  type: 'payment' | 'amortization' | string;
  amount: number | string;
  month?: string;
  year?: number;
  createdAt?: string | Date | null;
};

type AuditEntry = {
  id: number;
  participantId: number;
  participantName: string;
  action: string;
  description?: string;
  createdAt?: string | Date | null;
};

type Balancete = {
  caixaLivre: string;
  contasAReceber: string;
  patrimonioTotal: string;
  totalRendimentos: string;
  inadimplencia: number;
  mesAtual: string;
};

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { saveToCache, CACHE_KEYS } = useLocalCache();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: participants = [], isLoading } = trpc.caixinha.listParticipants.useQuery(undefined, {
    enabled: isAuthenticated,
  }) as { data: Participant[]; isLoading: boolean };

  const { data: allTransactions = [] } = trpc.caixinha.getAllTransactions.useQuery(undefined, {
    enabled: isAuthenticated,
  }) as { data: Transaction[] };

  const { data: auditLogEntries = [] } = trpc.caixinha.getAuditLog.useQuery({ limit: 50 }, {
    enabled: isAuthenticated,
  }) as { data: AuditEntry[] };

  const { data: nextMonthEstimate } = trpc.caixinha.getNextMonthEstimate.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: balancete } = trpc.caixinha.getBalancete.useQuery(undefined, {
    enabled: isAuthenticated,
  }) as { data: Balancete | undefined };

  // ── getOrCreateCaixinha ────────────────────────────────────────────────────
  const getOrCreateCaixinhaMutation = trpc.caixinha.getOrCreateCaixinha.useMutation({
    onSuccess: (data) => console.log('✅ Caixinha pronta:', data),
    onError: (error) => console.error('❌ Erro na caixinha:', error.message),
  });

  useEffect(() => {
    if (isAuthenticated) getOrCreateCaixinhaMutation.mutate();
  }, [isAuthenticated]);

  // ── Cache local ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (participants.length > 0) saveToCache(CACHE_KEYS.PARTICIPANTS, participants);
  }, [participants]);

  useEffect(() => {
    if (allTransactions.length > 0) saveToCache(CACHE_KEYS.TRANSACTIONS, allTransactions);
  }, [allTransactions]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addParticipantMutation = trpc.caixinha.addParticipant.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const addLoanMutation = trpc.caixinha.addLoan.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const paymentMutation = trpc.caixinha.registerPayment.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getMonthlyPayments.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
    onError: (error) => showErrorToast(error.message || 'Erro ao registrar pagamento'),
  });

  const amortizeMutation = trpc.caixinha.registerAmortization.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const resetMonthMutation = trpc.caixinha.resetMonth.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getMonthlyPayments.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const updateLoanMutation = trpc.caixinha.updateParticipantLoan.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const updateDebtMutation = trpc.caixinha.updateParticipantDebt.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  const updateNameMutation = trpc.caixinha.updateParticipantName.useMutation({
    onSuccess: () => utils.caixinha.listParticipants.invalidate(),
  });

  const updateEmailMutation = trpc.caixinha.updateParticipantEmail.useMutation({
    onSuccess: () => utils.caixinha.listParticipants.invalidate(),
  });

  const deleteParticipantMutation = trpc.caixinha.deleteParticipant.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getNextMonthEstimate.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      utils.caixinha.getBalancete.invalidate();
    },
  });

  // ── Modal states ───────────────────────────────────────────────────────────
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isAmortizeOpen, setIsAmortizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditLoanOpen, setIsEditLoanOpen] = useState(false);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isEstimateExpanded, setIsEstimateExpanded] = useState(false);
  const [chartParticipantId, setChartParticipantId] = useState<number | null>(null);

  // ── Form states ────────────────────────────────────────────────────────────
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newParticipantLoan, setNewParticipantLoan] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [amortizeAmount, setAmortizeAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editDebtAmount, setEditDebtAmount] = useState('');
  const [editNameValue, setEditNameValue] = useState('');
  const [editEmailValue, setEditEmailValue] = useState('');
  const [paymentMonth, setPaymentMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, '0')
  );
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const caixaLivre = balancete ? parseFloat(balancete.caixaLivre) : 0;
  const contasAReceber = balancete ? parseFloat(balancete.contasAReceber) : 0;
  const patrimonioTotal = balancete ? parseFloat(balancete.patrimonioTotal) : 0;
  const totalRendimentos = balancete ? parseFloat(balancete.totalRendimentos) : 0;
  const inadimplencia = balancete?.inadimplencia ?? 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) { showErrorToast('Nome do participante é obrigatório'); return; }
    try { await getOrCreateCaixinhaMutation.mutateAsync(); }
    catch { showErrorToast('Erro ao inicializar caixinha'); return; }
    try {
      await addParticipantMutation.mutateAsync({
        name: newParticipantName.trim(),
        email: newParticipantEmail.trim() || undefined,
        totalLoan: newParticipantLoan ? parseFloat(newParticipantLoan) : 0,
      });
      setIsAddParticipantOpen(false);
      setNewParticipantName(''); setNewParticipantEmail(''); setNewParticipantLoan('');
      showSuccessToast(`${newParticipantName} adicionado com sucesso!`);
    } catch { showErrorToast('Erro ao adicionar participante'); }
  };

  const handleAddLoan = async () => {
    if (!selectedParticipantId || !loanAmount) return;
    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) { showErrorToast('Valor inválido'); return; }
    try {
      await addLoanMutation.mutateAsync({ participantId: selectedParticipantId, amount });
      setIsAddLoanOpen(false); setLoanAmount('');
      showSuccessToast(`Empréstimo de ${formatCurrency(amount)} registrado!`);
    } catch { showErrorToast('Erro ao adicionar empréstimo'); }
  };

  const handlePayment = async () => {
    if (!selectedParticipantId) return;
    try {
      const monthFormatted = `${paymentYear}-${paymentMonth}`;
      await paymentMutation.mutateAsync({
        participantId: selectedParticipantId,
        month: monthFormatted,
        year: parseInt(paymentYear),
      });
      setIsPaymentOpen(false);
      const monthLabel = MONTHS.find(m => m.value === paymentMonth)?.label ?? paymentMonth;
      showSuccessToast(`Pagamento de ${monthLabel}/${paymentYear} registrado!`);
    } catch { showErrorToast('Erro ao registrar pagamento'); }
  };

  const handleAmortize = async () => {
    if (!selectedParticipantId || !amortizeAmount) return;
    const amount = parseFloat(amortizeAmount);
    if (isNaN(amount) || amount <= 0) { showErrorToast('Valor inválido'); return; }
    const currentDebt = selectedParticipant?.currentDebt ? parseFloat(selectedParticipant.currentDebt.toString()) : 0;
    if (amount > currentDebt) { showErrorToast('Valor maior que a dívida atual.'); return; }
    try {
      await amortizeMutation.mutateAsync({ participantId: selectedParticipantId, amount });
      setIsAmortizeOpen(false); setAmortizeAmount('');
      showSuccessToast(`Amortização de ${formatCurrency(amount)} registrada!`);
    } catch { showErrorToast('Erro ao registrar amortização'); }
  };

  const handleResetMonth = async () => {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await resetMonthMutation.mutateAsync({ month, year: now.getFullYear() });
      setIsResetConfirmOpen(false);
      showSuccessToast('Mês resetado com sucesso!');
    } catch { showErrorToast('Erro ao resetar mês'); }
  };

  const handleEditLoan = async () => {
    if (!selectedParticipantId || !editLoanAmount) return;
    const amount = parseFloat(editLoanAmount);
    if (isNaN(amount) || amount < 0) { showErrorToast('Valor inválido'); return; }
    try {
      await updateLoanMutation.mutateAsync({ participantId: selectedParticipantId, newTotalLoan: amount });
      setIsEditLoanOpen(false); setEditLoanAmount('');
      showSuccessToast('Empréstimo atualizado!');
    } catch { showErrorToast('Erro ao atualizar empréstimo'); }
  };

  const handleEditDebt = async () => {
    if (!selectedParticipantId || !editDebtAmount) return;
    const amount = parseFloat(editDebtAmount);
    if (isNaN(amount) || amount < 0) { showErrorToast('Valor inválido'); return; }
    try {
      await updateDebtMutation.mutateAsync({ participantId: selectedParticipantId, newCurrentDebt: amount });
      setIsEditDebtOpen(false); setEditDebtAmount('');
      showSuccessToast('Saldo devedor atualizado!');
    } catch { showErrorToast('Erro ao atualizar saldo'); }
  };

  const handleEditName = async () => {
    if (!selectedParticipantId || !editNameValue) return;
    try {
      await updateNameMutation.mutateAsync({ participantId: selectedParticipantId, newName: editNameValue });
      setIsEditNameOpen(false); setEditNameValue('');
      showSuccessToast('Nome atualizado!');
    } catch { showErrorToast('Erro ao atualizar nome'); }
  };

  const handleEditEmail = async () => {
    if (!selectedParticipantId) return;
    try {
      await updateEmailMutation.mutateAsync({ participantId: selectedParticipantId, email: editEmailValue || undefined });
      setIsEditEmailOpen(false); setEditEmailValue('');
      showSuccessToast('Email atualizado!');
    } catch { showErrorToast('Erro ao atualizar email'); }
  };

  const handleDeleteParticipant = async () => {
    if (!selectedParticipantId) return;
    try {
      await deleteParticipantMutation.mutateAsync({ participantId: selectedParticipantId });
      setIsDeleteConfirmOpen(false); setSelectedParticipantId(null);
      showSuccessToast('Participante deletado!');
    } catch { showErrorToast('Erro ao deletar participante'); }
  };

  const handleImportCSV = async (importedParticipants: ImportedParticipant[], _importedTransactions: ImportedTransaction[]) => {
    try {
      for (const p of importedParticipants) {
        await addParticipantMutation.mutateAsync({ name: p.name, totalLoan: p.totalLoan });
      }
    } catch {
      showErrorToast('Erro ao restaurar dados');
      throw new Error('Import failed');
    }
  };

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase mb-6">Caixinha Comunitária</h1>
          <p className="text-lg mb-8 text-gray-600">Faça login para gerenciar sua caixinha</p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase h-12 px-8"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto py-4 px-3 sm:px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gray-900 text-white p-2 rounded-lg shadow-sm">
              <PiggyBank className="w-6 sm:w-8 h-6 sm:h-8" />
            </div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight leading-tight text-gray-900">
              Caixinha Comunitária
            </h1>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-gray-600">{user?.name}</p>
            <span className="mt-1 inline-flex text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
              v2.0
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Dashboard (Balancete) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Caixa livre</h2>
              <PiggyBank className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(caixaLivre)}</p>
            <p className="mt-1 text-xs text-gray-500">Entradas - saídas (inclui estornos)</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contas a receber</h2>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(contasAReceber)}</p>
            <p className="mt-1 text-xs text-gray-500">Soma do saldo devedor atual</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Patrimônio total</h2>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(patrimonioTotal)}</p>
            <p className="mt-1 text-xs text-gray-500">Caixa + contas a receber</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rendimentos</h2>
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(totalRendimentos)}</p>
            <p className="mt-1 text-xs text-gray-500">
              Mês atual: <span className="font-medium text-gray-700">{balancete?.mesAtual ?? "—"}</span> · Inadimplentes:{" "}
              <span className="font-medium text-gray-700">{inadimplencia}</span>
            </p>
          </div>
        </section>

        {/* ── Estimativa Próximo Mês ─────────────────────────────────────── */}
        {nextMonthEstimate && (
          <section className="mb-8 sm:mb-12">
            <div className="bg-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">

              {/* Header clicável */}
              <button
                onClick={() => setIsEstimateExpanded(!isEstimateExpanded)}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#00C853]" />
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      Estimativa — Próximo Mês ({nextMonthEstimate.nextMonth})
                    </p>
                    <p className="text-2xl sm:text-4xl font-black tracking-tighter text-[#00C853]">
                      {formatCurrency(parseFloat(nextMonthEstimate.estimatedTotal))}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 justify-end mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Vence dia <span className="text-white">{nextMonthEstimate.dueDay}</span> de {nextMonthEstimate.nextMonth.split('-')[1] === '01' ? 'Jan' : MONTHS.find(m => m.value === nextMonthEstimate.nextMonth.split('-')[1])?.label?.slice(0,3)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cotas: <span className="text-white">{formatCurrency(parseFloat(nextMonthEstimate.estimatedQuotas))}</span>
                    {' + '}
                    Juros: <span className="text-[#FFD600]">{formatCurrency(parseFloat(nextMonthEstimate.estimatedInterest))}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {nextMonthEstimate.participantCount} participante{nextMonthEstimate.participantCount !== 1 ? 's' : ''}
                    {' · '}
                    <span className="text-[#00C853]">{isEstimateExpanded ? 'Ocultar detalhes ▲' : 'Ver detalhes ▼'}</span>
                  </p>
                </div>
              </button>

              {/* Breakdown expansível */}
              {isEstimateExpanded && (
                <div className="border-t-2 border-gray-700 p-4 sm:p-6">
                  <p className="text-xs font-black uppercase text-gray-400 mb-3">Breakdown por participante</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {nextMonthEstimate.perParticipant.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center bg-gray-900 border border-gray-700 px-3 py-2">
                        <span className="text-xs font-bold uppercase truncate text-gray-300 flex-1">{p.name}</span>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="block text-sm font-black text-white">{formatCurrency(parseFloat(p.total))}</span>
                          <span className="block text-xs text-gray-500">
                            R$200 + {formatCurrency(parseFloat(p.interest))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo */}
                  <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-xs font-bold">
                    <span className="text-gray-400">
                      Total cotas: <span className="text-white">{formatCurrency(parseFloat(nextMonthEstimate.estimatedQuotas))}</span>
                    </span>
                    <span className="text-gray-400">
                      Total juros: <span className="text-[#FFD600]">{formatCurrency(parseFloat(nextMonthEstimate.estimatedInterest))}</span>
                    </span>
                    <span className="text-gray-400">
                      Estimativa total: <span className="text-[#00C853] text-sm">{formatCurrency(parseFloat(nextMonthEstimate.estimatedTotal))}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Control Buttons */}
        <section className="mb-8 sm:mb-12 flex gap-2 sm:gap-4 flex-wrap">
          <Button
            onClick={() => setIsResetConfirmOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm font-semibold text-xs sm:text-sm h-10 sm:h-auto px-3 sm:px-4 py-2"
          >
            <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Resetar Mês</span><span className="sm:hidden">Resetar</span>
          </Button>
          <Button
            onClick={() => {
              try {
                const participantsData = participants.map((p) => ({
                  id: p.id, name: p.name,
                  totalLoan: p.totalLoan.toString(),
                  currentDebt: p.currentDebt.toString(),
                  createdAt: p.createdAt?.toString(),
                }));
                const transactionsData = allTransactions.map((t) => ({
                  id: t.id, participantId: t.participantId,
                  participantName: participants.find((p) => p.id === t.participantId)?.name || 'Desconhecido',
                  type: t.type, amount: t.amount.toString(),
                  createdAt: t.createdAt?.toString() || new Date().toISOString(),
                }));
                exportToCSV(participantsData, transactionsData, []);
                showSuccessToast('Backup exportado!');
              } catch { showErrorToast('Erro ao exportar backup'); }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-semibold text-xs sm:text-sm h-10 sm:h-auto px-3 sm:px-4 py-2"
          >
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span><span className="sm:hidden">Export</span>
          </Button>
          <Button
            onClick={() => setIsImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold text-xs sm:text-sm h-10 sm:h-auto px-3 sm:px-4 py-2"
          >
            <Upload className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Importar CSV</span><span className="sm:hidden">Import</span>
          </Button>
        </section>

        {/* Participants */}
        <section>
          <div className="flex justify-between items-end mb-6 sm:mb-8 border-b-4 border-black pb-3 sm:pb-4 gap-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Participantes</h2>
            <Button
              onClick={() => setIsAddParticipantOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm font-semibold text-xs sm:text-sm h-10 sm:h-auto px-3 sm:px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Novo Membro</span><span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12"><p className="text-gray-600">Carregando participantes...</p></div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Nenhum participante adicionado ainda</p>
              <Button onClick={() => setIsAddParticipantOpen(true)}
                className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-bold uppercase">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onPayment={() => { setSelectedParticipantId(participant.id); setIsPaymentOpen(true); }}
                  onAmortize={() => { setSelectedParticipantId(participant.id); setAmortizeAmount(''); setIsAmortizeOpen(true); }}
                  onAddLoan={() => { setSelectedParticipantId(participant.id); setLoanAmount(''); setIsAddLoanOpen(true); }}
                  onViewHistory={() => { setSelectedParticipantId(participant.id); setIsHistoryOpen(true); }}
                  onEditLoan={() => { setSelectedParticipantId(participant.id); setEditLoanAmount(parseFloat(participant.totalLoan.toString()).toString()); setIsEditLoanOpen(true); }}
                  onEditDebt={() => { setSelectedParticipantId(participant.id); setEditDebtAmount(parseFloat(participant.currentDebt.toString()).toString()); setIsEditDebtOpen(true); }}
                  onEditName={() => { setSelectedParticipantId(participant.id); setEditNameValue(participant.name); setIsEditNameOpen(true); }}
                  onEditEmail={() => { setSelectedParticipantId(participant.id); setEditEmailValue(participant.email || ''); setIsEditEmailOpen(true); }}
                  onDelete={() => { setSelectedParticipantId(participant.id); setIsDeleteConfirmOpen(true); }}
                  onViewChart={() => { setChartParticipantId(participant.id); setIsChartOpen(true); }}
                />
              ))}
            </div>
          )}
        </section>

        {participants.length > 0 && (
          <section className="mb-12 mt-8">
            <DebtorsList debtors={participants.map((p) => ({
              id: p.id, name: p.name,
              totalLoan: parseFloat(p.totalLoan.toString()),
              currentDebt: parseFloat(p.currentDebt.toString()),
              monthlyInterest: calculateMonthlyInterest(parseFloat(p.currentDebt.toString())),
            }))} />
          </section>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Novo Participante</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Adicione um novo membro à Caixinha Comunitária.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Nome</Label>
              <Input value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="Ex: João Silva" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Email (opcional)</Label>
              <Input type="email" value={newParticipantEmail} onChange={(e) => setNewParticipantEmail(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="joao@email.com" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Valor do Empréstimo (opcional)</Label>
              <Input type="number" value={newParticipantLoan} onChange={(e) => setNewParticipantLoan(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddParticipant} disabled={addParticipantMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Adicionar Participante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddLoanOpen} onOpenChange={setIsAddLoanOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Empréstimo Adicional</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Novo empréstimo para {selectedParticipant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Valor (R$)</Label>
              <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddLoan} disabled={addLoanMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Empréstimo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Registrar Pagamento</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Pagamento mensal de {selectedParticipant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Mês</Label>
              <select value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold px-3">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Ano</Label>
              <select value={paymentYear} onChange={(e) => setPaymentYear(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold px-3">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePayment} disabled={paymentMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAmortizeOpen} onOpenChange={setIsAmortizeOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Amortizar Dívida</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Valor extra abatido do saldo devedor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Valor (R$)</Label>
              <Input type="number" value={amortizeAmount} onChange={(e) => setAmortizeAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAmortize} disabled={amortizeMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Amortização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Histórico: {selectedParticipant?.name}</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Extrato completo de pagamentos e amortizações.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {selectedParticipant && (
              <>
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-700 mb-3">Transações</h3>
                  <TransactionHistory
                    participantId={selectedParticipant.id}
                    transactions={allTransactions.filter((t) => t.participantId === selectedParticipant.id)}
                    monthlyPayments={selectedParticipant.monthlyPayments || []}
                    onUnmarkPayment={(_paymentId: number) => {}}
                  />
                </div>
                <div className="border-t-2 border-black pt-4">
                  <h3 className="text-sm font-black uppercase text-gray-700 mb-3">Auditoria</h3>
                  <AuditLog
                    entries={auditLogEntries.filter((e) => e.participantId === selectedParticipant.id)}
                    participantId={selectedParticipant.id}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}
              className="w-full bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditLoanOpen} onOpenChange={setIsEditLoanOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Empréstimo</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Altere o valor total emprestado por {selectedParticipant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Valor Total (R$)</Label>
              <Input type="number" value={editLoanAmount} onChange={(e) => setEditLoanAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditLoan} disabled={updateLoanMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Saldo Devedor</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Altere o saldo devedor de {selectedParticipant?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Saldo Devedor (R$)</Label>
              <Input type="number" value={editDebtAmount} onChange={(e) => setEditDebtAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditDebt} disabled={updateDebtMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Nome</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Altere o nome do participante.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Nome</Label>
              <Input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="Nome do participante" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditName} disabled={updateNameMutation.isPending}
              className="w-full bg-blue-500 text-white border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditEmailOpen} onOpenChange={setIsEditEmailOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg rounded-xl w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Email</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">Email para notificações de pagamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold uppercase">Email</Label>
              <Input type="email" value={editEmailValue} onChange={(e) => setEditEmailValue(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold" placeholder="email@exemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditEmail} disabled={updateEmailMutation.isPending}
              className="w-full bg-cyan-500 text-white border-2 border-cyan-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50">
              Confirmar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Deletar Participante"
        description={selectedParticipant ? `Deletar ${selectedParticipant.name}? Esta ação não pode ser desfeita.` : ''}
        confirmText="Deletar" cancelText="Cancelar" isDangerous={true}
        isLoading={deleteParticipantMutation.isPending}
        onConfirm={handleDeleteParticipant}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Resetar Mês"
        description="Todos os pagamentos do mês atual serão zerados. Esta ação não pode ser desfeita."
        confirmText="Resetar" cancelText="Cancelar" isDangerous={true}
        isLoading={resetMonthMutation.isPending}
        onConfirm={handleResetMonth}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <ImportCSVModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImportCSV} />

      {chartParticipantId && (() => {
        const p = participants.find((p) => p.id === chartParticipantId);
        if (!p) return null;
        return (
          <DebtEvolutionChart
            isOpen={isChartOpen}
            onClose={() => { setIsChartOpen(false); setChartParticipantId(null); }}
            participantName={p.name || 'Desconhecido'}
            initialDebt={parseFloat(p.totalLoan?.toString() || '0')}
            currentDebt={parseFloat(p.currentDebt?.toString() || '0')}
            transactions={allTransactions.filter((t) => t.participantId === chartParticipantId)}
          />
        );
      })()}
    </div>
  );
}
