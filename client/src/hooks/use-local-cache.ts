import { useEffect, useState } from 'react';

const CACHE_KEYS = {
  PARTICIPANTS: 'caixinha_participants',
  TRANSACTIONS: 'caixinha_transactions',
  MONTHLY_PAYMENTS: 'caixinha_monthly_payments',
  LAST_SYNC: 'caixinha_last_sync',
};

export function useLocalCache() {
  const [isCached, setIsCached] = useState(false);

  // Save data to localStorage
  const saveToCache = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  };

  // Load data from localStorage
  const loadFromCache = (key: string) => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
      return null;
    }
  };

  // Clear all cache
  const clearCache = () => {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  // Get last sync time
  const getLastSyncTime = () => {
    const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSync ? new Date(lastSync) : null;
  };

  return {
    CACHE_KEYS,
    saveToCache,
    loadFromCache,
    clearCache,
    getLastSyncTime,
  };
}
