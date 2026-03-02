import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';
import { formatCurrency } from '@/lib/format-currency';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AuditLogEntry {
  id: number;
  participantId: number;
  participantName: string;
  action: string;
  month?: string | null;
  year?: number | null;
  amount?: string | null;
  description?: string | null;
  createdAt: Date;
}

interface AuditLogProps {
  entries?: AuditLogEntry[];
  participantId?: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'payment_marked': { label: 'Pagamento Marcado', color: 'bg-green-100 text-green-800', icon: '✓' },
  'payment_unmarked': { label: 'Pagamento Desmarcado', color: 'bg-yellow-100 text-yellow-800', icon: '↶' },
  'amortization_added': { label: 'Amortização Adicionada', color: 'bg-blue-100 text-blue-800', icon: '↓' },
  'participant_created': { label: 'Participante Criado', color: 'bg-purple-100 text-purple-800', icon: '+' },
  'participant_deleted': { label: 'Participante Deletado', color: 'bg-red-100 text-red-800', icon: '✕' },
};

export function AuditLog({ entries = [], participantId }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-bold uppercase">Nenhuma alteração registrada</p>
      </div>
    );
  }

  // Ordenar por data (mais recentes primeiro)
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <p className="text-xs font-black uppercase text-gray-600 mb-3">Histórico de Alterações</p>
      </div>
      
      <ScrollArea className="h-[350px] w-full pr-4 border-2 border-black rounded-none">
        <div className="space-y-2">
          {sortedEntries.map((entry) => {
            const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-gray-100 text-gray-800', icon: '•' };
            const entryDate = new Date(entry.createdAt);
            const formattedDate = format(entryDate, "dd 'de' MMM 'de' yyyy, HH:mm", { locale: ptBR });

            return (
              <div
                key={entry.id}
                className="border-l-4 border-black pl-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded-none border border-black ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                      <span className="text-xs text-gray-500 font-semibold">{formattedDate}</span>
                    </div>
                    
                    <p className="text-sm font-bold text-gray-800">{entry.participantName}</p>
                    
                    {entry.month && entry.year && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold">{entry.month}/{entry.year}</span>
                      </p>
                    )}
                    
                    {entry.amount && (
                      <p className="text-xs text-gray-600 mt-1">
                        Valor: <span className="font-bold">{formatCurrency(entry.amount)}</span>
                      </p>
                    )}
                    
                    {entry.description && (
                      <p className="text-xs text-gray-500 italic mt-1">{entry.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
