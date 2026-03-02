import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { ParticipantCard } from '@/components/ParticipantCard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { AuditLog } from '@/components/AuditLog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, PiggyBank, AlertTriangle, RotateCcw, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useLocalCache } from '@/hooks/use-local-cache';
import { useEffect } from 'react';
import { exportToCSV, exportParticipantsToCSV, exportTransactionsToCSV } from '@/lib/csv-export';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { ImportedParticipant, ImportedTransaction } from '@/lib/csv-import';
import { DebtEvolutionChart } from '@/components/DebtEvolutionChart';
import { DebtorsList } from '@/components/DebtorsList';
import { formatCurrency } from '@/lib/format-currency';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils';
import { ConfirmationModal } from '@/components/ConfirmationModal';

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { saveToCache, loadFromCache, CACHE_KEYS } = useLocalCache();
  
  // tRPC queries and mutations
  const { data: participants = [], isLoading } = trpc.caixinha.listParticipants.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: allTransactions = [] } = trpc.caixinha.getAllTransactions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: auditLogEntries = [] } = trpc.caixinha.getAuditLog.useQuery({ limit: 50 }, {
    enabled: isAuthenticated,
  });

  // Cache data when it changes
  useEffect(() => {
    if (participants.length > 0) {
      saveToCache(CACHE_KEYS.PARTICIPANTS, participants);
    }
  }, [participants, saveToCache, CACHE_KEYS]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      saveToCache(CACHE_KEYS.TRANSACTIONS, allTransactions);
    }
  }, [allTransactions, saveToCache, CACHE_KEYS]);
  
  const addParticipantMutation = trpc.caixinha.addParticipant.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
    },
  });
  const addLoanMutation = trpc.caixinha.addLoan.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
    },
  });
  const paymentMutation = trpc.caixinha.registerPayment.useMutation({
    onSuccess: (data) => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getMonthlyPayments.invalidate();
      if (data.message) {
        showSuccessToast(data.message);
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Erro ao registrar pagamento';
      showErrorToast(errorMessage);
    },
  });
  const unmarkPaymentMutation = trpc.caixinha.unmarkPayment.useMutation({
    onSuccess: (data) => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
      utils.caixinha.getMonthlyPayments.invalidate();
      utils.caixinha.getAuditLog.invalidate();
      if (data.message) {
        showSuccessToast(data.message);
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Erro ao desmarcar pagamento';
      showErrorToast(errorMessage);
    },
  });
  const amortizeMutation = trpc.caixinha.registerAmortization.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
    },
  });
  const resetMonthMutation = trpc.caixinha.resetMonth.useMutation({
    onSuccess: () => {
      utils.caixinha.getMonthlyPayments.invalidate();
    },
  });
  const updateLoanMutation = trpc.caixinha.updateParticipantLoan.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
    },
  });
  const updateDebtMutation = trpc.caixinha.updateParticipantDebt.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
    },
  });
  const updateNameMutation = trpc.caixinha.updateParticipantName.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
    },
  });
  const deleteParticipantMutation = trpc.caixinha.deleteParticipant.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
      utils.caixinha.getAllTransactions.invalidate();
    },
  });
  const updateEmailMutation = trpc.caixinha.updateParticipantEmail.useMutation({
    onSuccess: () => {
      utils.caixinha.listParticipants.invalidate();
    },
  });

  // Modal states
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
  const [chartParticipantId, setChartParticipantId] = useState<number | null>(null);

  // Form states
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
  const [paymentMonth, setPaymentMonth] = useState(MONTHS[new Date().getMonth()]);
  const [paymentYear, setPaymentYear] = useState('2026');

  const selectedParticipant = participants.find((p: any) => p.id === selectedParticipantId);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase mb-6">Caixinha Comunitária</h1>
          <p className="text-lg mb-8 text-gray-600">Faça login para gerenciar sua caixinha</p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase h-12 px-8"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) {
      showErrorToast('Nome do participante é obrigatório');
      return;
    }

    const loanAmount = newParticipantLoan ? parseFloat(newParticipantLoan) : 0;
    if (isNaN(loanAmount) || loanAmount < 0) {
      showErrorToast('Valor do empréstimo inválido');
      return;
    }

    try {
      await addParticipantMutation.mutateAsync({
        name: newParticipantName.trim(),
        email: newParticipantEmail.trim() || undefined,
        totalLoan: loanAmount,
      });
      setIsAddParticipantOpen(false);
      setNewParticipantName('');
      setNewParticipantEmail('');
      setNewParticipantLoan('');
      showSuccessToast(`${newParticipantName} adicionado com sucesso!`);
    } catch (error) {
      showErrorToast('Erro ao adicionar participante');
    }
  };

  const handleAddLoan = async () => {
    if (!selectedParticipantId || !loanAmount) return;

    const amount = parseFloat(loanAmount);
    if (isNaN(amount) || amount <= 0) {
      showErrorToast('Valor inválido');
      return;
    }

    try {
      await addLoanMutation.mutateAsync({
        participantId: selectedParticipantId,
        amount,
      });
      setIsAddLoanOpen(false);
      setLoanAmount('');
      showSuccessToast(`Empréstimo adicional de ${formatCurrency(amount)} registrado!`);
    } catch (error) {
      showErrorToast('Erro ao adicionar empréstimo');
    }
  };

  const handlePayment = async () => {
    if (!selectedParticipantId) return;

    try {
      await paymentMutation.mutateAsync({
        participantId: selectedParticipantId,
        month: paymentMonth,
        year: parseInt(paymentYear),
      });
      setIsPaymentOpen(false);
      showSuccessToast(`Pagamento de ${paymentMonth}/${paymentYear} registrado!`);
    } catch (error) {
      showErrorToast('Erro ao registrar pagamento');
    }
  };

  const handleAmortize = async () => {
    if (!selectedParticipantId || !amortizeAmount) return;

    const amount = parseFloat(amortizeAmount);
    if (isNaN(amount) || amount <= 0) {
      showErrorToast('Valor inválido');
      return;
    }

    const currentDebt = selectedParticipant?.currentDebt ? parseFloat(selectedParticipant.currentDebt.toString()) : 0;
    if (amount > currentDebt) {
      showErrorToast(`Valor de amortização não pode ser maior que a dívida atual.`);
      return;
    }

    try {
      await amortizeMutation.mutateAsync({
        participantId: selectedParticipantId,
        amount,
      });
      setIsAmortizeOpen(false);
      setAmortizeAmount('');
      showSuccessToast(`Amortização de ${formatCurrency(amount)} registrada!`);
    } catch (error) {
      showErrorToast('Erro ao registrar amortização');
    }
  };

  const handleResetMonth = async () => {
    try {
      await resetMonthMutation.mutateAsync();
      setIsResetConfirmOpen(false);
      showSuccessToast('Mês resetado! Todos os pagamentos foram zerados.');
    } catch (error) {
      showErrorToast('Erro ao resetar mês');
    }
  };

  const handleResetMonthClick = () => {
    setIsResetConfirmOpen(true);
  };

  const handleEditLoan = async () => {
    if (!selectedParticipantId || !editLoanAmount) return;
    const amount = parseFloat(editLoanAmount);
    if (isNaN(amount) || amount < 0) {
      showErrorToast('Valor inválido');
      return;
    }
    try {
      await updateLoanMutation.mutateAsync({
        participantId: selectedParticipantId,
        newTotalLoan: amount,
      });
      setIsEditLoanOpen(false);
      setEditLoanAmount('');
      showSuccessToast('Empréstimo atualizado com sucesso!');
    } catch (error) {
      showErrorToast('Erro ao atualizar empréstimo');
    }
  };

  const handleEditDebt = async () => {
    if (!selectedParticipantId || !editDebtAmount) return;
    const amount = parseFloat(editDebtAmount);
    if (isNaN(amount) || amount < 0) {
      showErrorToast('Valor inválido');
      return;
    }
    try {
      await updateDebtMutation.mutateAsync({
        participantId: selectedParticipantId,
        newCurrentDebt: amount,
      });
      setIsEditDebtOpen(false);
      setEditDebtAmount('');
      showSuccessToast('Saldo devedor atualizado com sucesso!');
    } catch (error) {
      showErrorToast('Erro ao atualizar saldo');
    }
  };

  const handleEditName = async () => {
    if (!selectedParticipantId || !editNameValue) return;
    try {
      await updateNameMutation.mutateAsync({
        participantId: selectedParticipantId,
        newName: editNameValue,
      });
      setIsEditNameOpen(false);
      setEditNameValue('');
      showSuccessToast('Nome atualizado com sucesso!');
    } catch (error) {
      showErrorToast('Erro ao atualizar nome');
    }
  };

  const handleEditEmail = async () => {
    if (!selectedParticipantId) return;
    try {
      await updateEmailMutation.mutateAsync({
        participantId: selectedParticipantId,
        email: editEmailValue || undefined,
      });
      setIsEditEmailOpen(false);
      setEditEmailValue('');
      showSuccessToast('Email atualizado com sucesso!');
    } catch (error) {
      showErrorToast('Erro ao atualizar email');
    }
  };

  const openEditEmailModal = (participantId: number) => {
    setSelectedParticipantId(participantId);
    const participant = participants.find((p: any) => p.id === participantId);
    setEditEmailValue(participant?.email || '');
    setIsEditEmailOpen(true);
  };

  const handleImportCSV = async (importedParticipants: ImportedParticipant[], importedTransactions: ImportedTransaction[]) => {
    try {
      for (const p of importedParticipants) {
        await addParticipantMutation.mutateAsync({
          name: p.name,
          totalLoan: p.totalLoan,
        });
      }
    } catch (error) {
      showErrorToast('Erro ao restaurar dados');
      throw error;
    }
  };

  const handleDeleteParticipant = async () => {
    if (!selectedParticipantId) return;
    try {
      await deleteParticipantMutation.mutateAsync({
        participantId: selectedParticipantId,
      });
      setIsDeleteConfirmOpen(false);
      setSelectedParticipantId(null);
      showSuccessToast('Participante deletado com sucesso!');
    } catch (error) {
      showErrorToast('Erro ao deletar participante');
    }
  };

  // Calculate totals from transactions
  const totalFees = allTransactions
    .filter((t: any) => t.type === 'payment')
    .reduce((acc: number) => acc + 200, 0) + 
    allTransactions
    .filter((t: any) => t.type === 'amortization')
    .reduce((acc: number, t: any) => acc + parseFloat(t.amount.toString()), 0);

  const totalInterest = allTransactions
    .filter((t: any) => t.type === 'payment')
    .reduce((acc: number, t: any) => acc + (parseFloat(t.amount.toString()) - 200), 0);

  const totalDebts = participants.reduce((acc: number, p: any) => acc + parseFloat(p.currentDebt.toString()), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans pb-20">
      <OfflineIndicator />
      {/* Header / Navbar */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-10">
        <div className="container mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-black text-white p-1.5 sm:p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <PiggyBank className="w-6 sm:w-8 h-6 sm:h-8" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-tight sm:leading-none">Caixinha<br/>Comunitária</h1>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-gray-600">{user?.name}</p>
            <span className="text-xs font-bold uppercase bg-yellow-300 px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Beta v2.0
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Dashboard Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          <div className="bg-[#00C853] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20 group-hover:scale-110 transition-transform">
              <PiggyBank className="w-24 sm:w-32 h-24 sm:h-32" />
            </div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2">Cotas Arrecadadas</h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tighter">{formatCurrency(totalFees)}</p>
            <p className="mt-2 sm:mt-4 text-xs font-bold opacity-90 border-t-2 border-white/30 pt-2 inline-block">
              Pagamentos + Amortizações
            </p>
          </div>

          <div className="bg-[#FFD600] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 text-black relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-24 sm:w-32 h-24 sm:h-32" />
            </div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2">Juros Arrecadados</h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tighter">{formatCurrency(totalInterest)}</p>
            <p className="mt-2 sm:mt-4 text-xs font-bold opacity-80 border-t-2 border-black/20 pt-2 inline-block">
              10% sobre Dívidas
            </p>
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-5">
              <AlertTriangle className="w-24 sm:w-32 h-24 sm:h-32" />
            </div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 text-gray-500">Total em Dívidas</h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tighter text-[#FF3D00]">{formatCurrency(totalDebts)}</p>
            <p className="mt-2 sm:mt-4 text-xs font-bold text-gray-500 border-t-2 border-gray-200 pt-2 inline-block">
              Capital a Recuperar
            </p>
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-5">
              <PiggyBank className="w-24 sm:w-32 h-24 sm:h-32" />
            </div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest mb-2 text-purple-600">Total Arrecadado</h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tighter text-purple-600">{formatCurrency(totalFees + totalInterest)}</p>
            <p className="mt-2 sm:mt-4 text-xs font-bold text-purple-600 border-t-2 border-purple-200 pt-2 inline-block">
              Cotas + Juros
            </p>
          </div>
        </section>

        {/* Control Buttons */}
        <section className="mb-8 sm:mb-12 flex gap-2 sm:gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleResetMonthClick}
              className="bg-[#FF3D00] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase text-xs sm:text-sm h-10 sm:h-auto px-2 sm:px-4 py-2"
            >
              <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Resetar Mês</span><span className="sm:hidden">Resetar</span>
            </Button>
            <Button
              onClick={() => {
                try {
                  const participantsData = participants.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    totalLoan: p.totalLoan.toString(),
                    currentDebt: p.currentDebt.toString(),
                    createdAt: p.createdAt?.toString(),
                  }));
                  const transactionsData = allTransactions.map((t: any) => ({
                    id: t.id,
                    participantId: t.participantId,
                    participantName: participants.find((p: any) => p.id === t.participantId)?.name || 'Desconhecido',
                    type: t.type,
                    amount: t.amount.toString(),
                    createdAt: t.createdAt?.toString() || new Date().toISOString(),
                  }));
                  exportToCSV(participantsData, transactionsData, []);
                  showSuccessToast('Backup exportado com sucesso!');
                } catch (error) {
                  showErrorToast('Erro ao exportar backup');
                }
              }}
              className="bg-[#2196F3] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase text-xs sm:text-sm h-10 sm:h-auto px-2 sm:px-4 py-2"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Exportar CSV</span><span className="sm:hidden">Export</span>
            </Button>
            <Button
              onClick={() => setIsImportOpen(true)}
              className="bg-[#4CAF50] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase text-xs sm:text-sm h-10 sm:h-auto px-2 sm:px-4 py-2"
            >
              <Upload className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Importar CSV</span><span className="sm:hidden">Import</span>
            </Button>
          </div>
        </section>

        {/* Participants Grid */}
        <section>
          <div className="flex justify-between items-end mb-6 sm:mb-8 border-b-4 border-black pb-3 sm:pb-4 gap-2">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Participantes</h2>
            <Button 
              onClick={() => setIsAddParticipantOpen(true)}
              className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase text-xs sm:text-sm h-10 sm:h-auto px-2 sm:px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Novo Membro</span><span className="sm:hidden">Novo</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-600 text-sm sm:text-base">Carregando participantes...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Nenhum participante adicionado ainda</p>
              <Button 
                onClick={() => setIsAddParticipantOpen(true)}
                className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase text-xs sm:text-sm h-10 sm:h-auto px-2 sm:px-4 py-2"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" /> Adicionar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {participants.map((participant: any) => (
                <ParticipantCard 
                  key={participant.id} 
                  participant={participant}
                  onPayment={() => {
                    setSelectedParticipantId(participant.id);
                    setIsPaymentOpen(true);
                  }}
                  onAmortize={() => {
                    setSelectedParticipantId(participant.id);
                    setAmortizeAmount('');
                    setIsAmortizeOpen(true);
                  }}
                  onAddLoan={() => {
                    setSelectedParticipantId(participant.id);
                    setLoanAmount('');
                    setIsAddLoanOpen(true);
                  }}
                  onViewHistory={() => {
                    setSelectedParticipantId(participant.id);
                    setIsHistoryOpen(true);
                  }}
                  onRegisterPayment={() => {
                    setSelectedParticipantId(participant.id);
                    setIsPaymentOpen(true);
                  }}
                  onEditLoan={() => {
                    setSelectedParticipantId(participant.id);
                    setEditLoanAmount(parseFloat(participant.totalLoan).toString());
                    setIsEditLoanOpen(true);
                  }}
                  onEditDebt={() => {
                    setSelectedParticipantId(participant.id);
                    setEditDebtAmount(parseFloat(participant.currentDebt).toString());
                    setIsEditDebtOpen(true);
                  }}
                  onEditName={() => {
                    setSelectedParticipantId(participant.id);
                    setEditNameValue(participant.name);
                    setIsEditNameOpen(true);
                  }}
                  onEditEmail={() => openEditEmailModal(participant.id)}
                  onDelete={() => {
                    setSelectedParticipantId(participant.id);
                    setIsDeleteConfirmOpen(true);
                  }}
                  onViewChart={() => {
                    setChartParticipantId(participant.id);
                    setIsChartOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Debtors Section */}
        {participants && participants.length > 0 && (
          <section className="mb-12">
            <DebtorsList debtors={participants.map((p: any) => ({
              id: p.id,
              name: p.name,
              totalLoan: parseFloat(p.totalLoan.toString()),
              currentDebt: parseFloat(p.currentDebt.toString()),
              monthlyInterest: parseFloat(p.currentDebt.toString()) * 0.1
            }))} />
          </section>
        )}
      </main>

      {/* Add Participant Modal */}
      <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Novo Participante</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Adicione um novo membro à Caixinha Comunitária.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-bold uppercase">Nome</Label>
              <Input
                id="name"
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-bold uppercase">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={newParticipantEmail}
                onChange={(e) => setNewParticipantEmail(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="joao@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loan" className="font-bold uppercase">Valor do Empréstimo (opcional)</Label>
              <Input
                id="loan"
                type="number"
                value={newParticipantLoan}
                onChange={(e) => setNewParticipantLoan(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddParticipant} 
              disabled={addParticipantMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Adicionar Participante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Loan Modal */}
      <Dialog open={isAddLoanOpen} onOpenChange={setIsAddLoanOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Empréstimo Adicional</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Adicione um novo empréstimo para {selectedParticipant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="loanAmount" className="font-bold uppercase">Valor (R$)</Label>
              <Input
                id="loanAmount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddLoan}
              disabled={addLoanMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Empréstimo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Registrar Pagamento</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Registre o pagamento mensal de {selectedParticipant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="month" className="font-bold uppercase">Mês</Label>
              <select
                id="month"
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all px-3"
              >
                {MONTHS.map(month => (
                  <option key={month} value={month}>{month.charAt(0).toUpperCase() + month.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year" className="font-bold uppercase">Ano</Label>
              <select
                id="year"
                value={paymentYear}
                onChange={(e) => setPaymentYear(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all px-3"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amortization Modal */}
      <Dialog open={isAmortizeOpen} onOpenChange={setIsAmortizeOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Amortizar Dívida</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Insira o valor extra que será abatido diretamente do saldo devedor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amortizeAmount" className="font-bold uppercase">Valor (R$)</Label>
              <Input
                id="amortizeAmount"
                type="number"
                value={amortizeAmount}
                onChange={(e) => setAmortizeAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAmortize}
              disabled={amortizeMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Amortização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">
              Histórico: {selectedParticipant?.name}
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Extrato completo de pagamentos e amortizações.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {selectedParticipant && (
              <>
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-700 mb-3">Transações</h3>
                  <TransactionHistory 
                    participantId={selectedParticipant.id}
                    transactions={allTransactions.filter((t: any) => t.participantId === selectedParticipant.id)}
                    monthlyPayments={selectedParticipant.monthlyPayments || []}
                    onUnmarkPayment={(paymentId: number) => {
                      unmarkPaymentMutation.mutate({ paymentId, participantId: selectedParticipant.id });
                    }}
                  />
                </div>
                
                <div className="border-t-2 border-black pt-4">
                  <h3 className="text-sm font-black uppercase text-gray-700 mb-3">Auditoria</h3>
                  <AuditLog 
                    entries={auditLogEntries.filter((e: any) => e.participantId === selectedParticipant.id)}
                    participantId={selectedParticipant.id}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsHistoryOpen(false)} 
              className="w-full bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Loan Modal */}
      <Dialog open={isEditLoanOpen} onOpenChange={setIsEditLoanOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Emprestimo</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Altere o valor total emprestado por {selectedParticipant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editLoanAmount" className="font-bold uppercase">Valor Total (R$)</Label>
              <Input
                id="editLoanAmount"
                type="number"
                value={editLoanAmount}
                onChange={(e) => setEditLoanAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditLoan}
              disabled={updateLoanMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Edicao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Debt Modal */}
      <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Saldo Devedor</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Altere o saldo devedor de {selectedParticipant?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editDebtAmount" className="font-bold uppercase">Saldo Devedor (R$)</Label>
              <Input
                id="editDebtAmount"
                type="number"
                value={editDebtAmount}
                onChange={(e) => setEditDebtAmount(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditDebt}
              disabled={updateDebtMutation.isPending}
              className="w-full bg-[#00C853] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Edicao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Modal */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Nome</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Altere o nome do participante.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editNameValue" className="font-bold uppercase">Nome</Label>
              <Input
                id="editNameValue"
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="Nome do participante"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditName}
              disabled={updateNameMutation.isPending}
              className="w-full bg-blue-500 text-white border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Edicao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Modal */}
      <Dialog open={isEditEmailOpen} onOpenChange={setIsEditEmailOpen}>
        <DialogContent className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Editar Email</DialogTitle>
            <DialogDescription className="font-medium text-gray-600">
              Altere o email do participante para receber notificacoes de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editEmailValue" className="font-bold uppercase">Email</Label>
              <Input
                id="editEmailValue"
                type="email"
                value={editEmailValue}
                onChange={(e) => setEditEmailValue(e.target.value)}
                className="border-2 border-black rounded-none h-12 text-lg font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditEmail}
              disabled={updateEmailMutation.isPending}
              className="w-full bg-blue-500 text-white border-2 border-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-black uppercase h-12 text-lg disabled:opacity-50"
            >
              Confirmar Edicao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Participant Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Deletar Participante"
        description={selectedParticipant ? `Tem certeza que deseja deletar ${selectedParticipant.name}? Esta ação não pode ser desfeita.` : ''}
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deleteParticipantMutation.isPending}
        onConfirm={handleDeleteParticipant}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportCSV}
      />

      {/* Debt Evolution Chart Modal */}
      {chartParticipantId && participants && (
        <DebtEvolutionChart
          isOpen={isChartOpen}
          onClose={() => {
            setIsChartOpen(false);
            setChartParticipantId(null);
          }}
          participantName={participants.find((p: any) => p.id === chartParticipantId)?.name || 'Desconhecido'}
          data={[
            { month: 'Inicial', debt: parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.totalLoan?.toString() || '0'), paid: 0 },
            { month: 'Atual', debt: parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.currentDebt?.toString() || '0'), paid: parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.totalLoan?.toString() || '0') - parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.currentDebt?.toString() || '0') },
          ]}
          initialDebt={parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.totalLoan?.toString() || '0')}
          currentDebt={parseFloat(participants.find((p: any) => p.id === chartParticipantId)?.currentDebt?.toString() || '0')}
        />
      )}

      {/* Reset Month Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Resetar Mês"
        description="Tem certeza que deseja resetar o mês? Todos os pagamentos serão zerados e não poderão ser recuperados."
        confirmText="Resetar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={resetMonthMutation.isPending}
        onConfirm={handleResetMonth}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
