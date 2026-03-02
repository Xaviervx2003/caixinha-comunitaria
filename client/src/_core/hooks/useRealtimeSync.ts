import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

type SyncEvent = {
  type: 'participant_updated' | 'transaction_added' | 'participant_deleted' | 'month_reset';
  participantId?: number;
  data?: any;
  timestamp: number;
};

export function useRealtimeSync(onUpdate?: (event: SyncEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const connect = useCallback(() => {
    // Only connect if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for real-time sync');
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const syncEvent: SyncEvent = JSON.parse(event.data);
          console.log('Received sync event:', syncEvent);

          // Call the callback if provided
          if (onUpdate) {
            onUpdate(syncEvent);
          }

          // Invalidate relevant queries to trigger refetch
          switch (syncEvent.type) {
            case 'participant_updated':
              utils.caixinha.listParticipants.invalidate();
              break;
            case 'transaction_added':
              utils.caixinha.getTransactions.invalidate();
              utils.caixinha.listParticipants.invalidate();
              break;
            case 'participant_deleted':
              utils.caixinha.listParticipants.invalidate();
              break;
            case 'month_reset':
              utils.caixinha.listParticipants.invalidate();
              utils.caixinha.getTransactions.invalidate();
              break;
          }
        } catch (error) {
          console.error('Failed to parse sync event:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [utils, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendSync = useCallback((event: SyncEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendSync,
  };
}
