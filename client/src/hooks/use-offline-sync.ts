import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

interface PendingAction {
  id: string;
  type: 'payment' | 'amortization' | 'addParticipant' | 'addLoan' | 'updateLoan' | 'updateDebt' | 'updateName' | 'deleteParticipant';
  participantId?: number;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const utils = trpc.useUtils();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('caixinha_pending_actions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar ações pendentes:', error);
      }
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    localStorage.setItem('caixinha_pending_actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setPendingActions(prev => [...prev, newAction]);
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    const actions = [...pendingActions];
    for (const action of actions) {
      try {
        // Sync logic would go here
        // For now, just remove from pending
        setPendingActions(prev => prev.filter(a => a.id !== action.id));
      } catch (error) {
        console.error('Erro ao sincronizar ação:', error);
      }
    }
  };

  return {
    isOnline,
    pendingActions,
    addPendingAction,
    syncPendingActions,
  };
}
