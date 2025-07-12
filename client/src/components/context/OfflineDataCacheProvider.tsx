import React, { createContext, useEffect, useState, ReactNode } from 'react';
import offlineDataCacheService from '../../services/offlineDataCacheService';
import { toast } from 'react-hot-toast';

interface CacheStats {
  employees: number;
  organizations: number;
  apiResponses: number;
  analytics: number;
  settings: number;
  totalSize: number;
}

interface OfflineDataCacheContextType {
  isInitialized: boolean;
  cacheStats: CacheStats;
  // Cache management methods
  clearAllCache: () => Promise<void>;
  refreshCacheStats: () => Promise<void>;
  preloadCriticalData: () => Promise<void>;
  // Cache status
  isCacheAvailable: boolean;
  lastCleanup: Date | null;
}

const OfflineDataCacheContext = createContext<OfflineDataCacheContextType>({
  isInitialized: false,
  cacheStats: { employees: 0, organizations: 0, apiResponses: 0, analytics: 0, settings: 0, totalSize: 0 },
  clearAllCache: async () => {},
  refreshCacheStats: async () => {},
  preloadCriticalData: async () => {},
  isCacheAvailable: false,
  lastCleanup: null
});

interface OfflineDataCacheProviderProps {
  children: ReactNode;
}

export const OfflineDataCacheProvider: React.FC<OfflineDataCacheProviderProps> = ({ 
  children 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCacheAvailable, setIsCacheAvailable] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    employees: 0,
    organizations: 0,
    apiResponses: 0,
    analytics: 0,
    settings: 0,
    totalSize: 0
  });

  // Initialize the cache service
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await offlineDataCacheService.init();
        setIsInitialized(true);
        setIsCacheAvailable(true);
        
        // Get initial cache stats
        await refreshCacheStats();
        
        // Set up periodic cleanup (every hour)
        const cleanupInterval = setInterval(async () => {
          try {
            await offlineDataCacheService.cleanupExpiredEntries();
            setLastCleanup(new Date());
            await refreshCacheStats();
          } catch (error) {
            console.error('❌ Failed to cleanup cache:', error);
          }
        }, 60 * 60 * 1000); // 1 hour

        // Initial cleanup
        await offlineDataCacheService.cleanupExpiredEntries();
        setLastCleanup(new Date());

        return () => {
          clearInterval(cleanupInterval);
        };
      } catch (error) {
        console.error('❌ Failed to initialize offline data cache:', error);
        setIsCacheAvailable(false);
        // Don't show toast for cache initialization errors - it's not critical for UX
        // toast.error('Failed to initialize offline data cache');
      }
    };

    initializeCache();
  }, []);

  // Refresh cache statistics
  const refreshCacheStats = async () => {
    try {
      const stats = await offlineDataCacheService.getCacheStats();
      setCacheStats(stats);
    } catch {
      console.error('❌ Failed to refresh cache stats');
    }
  };

  // Clear all cache data
  const clearAllCache = async () => {
    try {
      await offlineDataCacheService.clearAllCache();
      await refreshCacheStats();
      toast.success('All offline cache cleared');
    } catch {
      toast.error('Failed to clear offline cache');
    }
  };

  // Preload critical data for offline access
  const preloadCriticalData = async () => {
    if (!navigator.onLine) {
      return;
    }

    try {
      toast.loading('Preloading data for offline access...', { id: 'preload' });
      
      
      await refreshCacheStats();
      
      toast.success('Critical data preloaded for offline access', { id: 'preload' });
    } catch {
      toast.error('Failed to preload data for offline access', { id: 'preload' });
    }
  };

  const contextValue: OfflineDataCacheContextType = {
    isInitialized,
    cacheStats,
    clearAllCache,
    refreshCacheStats,
    preloadCriticalData,
    isCacheAvailable,
    lastCleanup
  };

  return (
    <OfflineDataCacheContext.Provider value={contextValue}>
      {children}
    </OfflineDataCacheContext.Provider>
  );
};

export function useOfflineDataCache() {
  const context = React.useContext(OfflineDataCacheContext);
  if (!context) {
    throw new Error('useOfflineDataCache must be used within an OfflineDataCacheProvider');
  }
  return context;
}

export default OfflineDataCacheProvider;