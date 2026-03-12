// client/src/components/VencimentoAlert.tsx
// Adicione este componente no topo da DashboardSection

interface VencimentoAlertProps {
  participants: any[];
  dueDay?: number; // dia de vencimento da caixinha (padrão 5)
}

export function VencimentoAlert({ participants, dueDay = 5 }: VencimentoAlertProps) {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Calcula data de vencimento do mês atual
  // Vencimento = dia X do mês SEGUINTE ao mês de referência
  // Ex: referência Março -> vence dia 5 de Abril
  const dueMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const dueYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const dueDate = new Date(dueYear, dueMonth, dueDay);
  const today = new Date(currentYear, currentMonth, now.getDate());

  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Mês de referência (mês atual = o que as pessoas devem pagar)
  const refMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Conta quem ainda não pagou este mês
  const unpaidCount = participants.filter(p => {
    const paid = p.monthlyPayments?.some((mp: any) =>
      mp.month === refMonthStr && (mp.paid === true || mp.paid === 1)
    );
    return !paid;
  }).length;

  // Só mostra se há pessoas que ainda não pagaram
  if (unpaidCount === 0) return null;

  // Define cor e urgência
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;
  const isWarning = daysUntilDue > 3 && daysUntilDue <= 7;

  if (!isOverdue && !isUrgent && !isWarning) return null;

  const bgColor = isOverdue ? 'bg-red-50 border-red-200' : isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isOverdue ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-yellow-700';
  const dotColor = isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-yellow-500';

  const message = isOverdue
    ? `Vencimento passou há ${Math.abs(daysUntilDue)} dia${Math.abs(daysUntilDue) !== 1 ? 's' : ''}! ${unpaidCount} pessoa${unpaidCount !== 1 ? 's' : ''} ainda não pagou.`
    : daysUntilDue === 0
    ? `Vence hoje! ${unpaidCount} pessoa${unpaidCount !== 1 ? 's' : ''} ainda não pagou.`
    : `Vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? 's' : ''} (dia ${dueDay}/${String(dueMonth + 1).padStart(2, '0')}). ${unpaidCount} pessoa${unpaidCount !== 1 ? 's' : ''} ainda não pagou.`;

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${bgColor}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse ${dotColor}`} />
      <div>
        <p className={`text-sm font-bold ${textColor}`}>
          {isOverdue ? '⚠️ Pagamentos em Atraso' : isUrgent ? '🔔 Vencimento Próximo' : '📅 Lembrete de Vencimento'}
        </p>
        <p className={`text-xs mt-0.5 ${textColor} opacity-80`}>{message}</p>
      </div>
    </div>
  );
}
