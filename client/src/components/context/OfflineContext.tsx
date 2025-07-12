import React, { createContext, useState, useEffect, ReactNode } from 'react';
import offlineAttendanceService from '../../services/offlineAttendanceService';
import { toast } from 'react-hot-toast';

export interface OfflineContextType {
  isOnline: boolean;
  offlineMode: boolean;
  offlineStats: {
    total: number;
    unsynced: number;
    synced: number;
  };
  syncOfflineRecords: () => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;
}

export const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  offlineMode: false,
  offlineStats: { total: 0, unsynced: 0, synced: 0 },
  syncOfflineRecords: async () => {},
  setOfflineMode: () => {}
});

// useOffline hook moved to its own file for Fast Refresh compatibility

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [offlineStats, setOfflineStats] = useState<{ total: number; unsynced: number; synced: number }>({
    total: 0,
    unsynced: 0,
    synced: 0
  });

  // Function to refresh offline stats
  const refreshOfflineStats = React.useCallback(async () => {
    try {
      const stats = await offlineAttendanceService.getOfflineStats();
      setOfflineStats(stats);
      
      // Notify if there are unsynced records and we're online
      if (stats.unsynced > 0 && isOnline && !offlineMode) {
        toast.loading(`You have ${stats.unsynced} offline attendance records to sync`, { 
          id: 'offline-records',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to refresh offline stats:', error);
    }
  }, [isOnline, offlineMode]);

  // Function to trigger manual sync (prefer background sync if supported)
  const syncOfflineRecords = React.useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    try {
      // Try background sync first if supported
      const backgroundSyncTriggered = await offlineAttendanceService.triggerBackgroundSync();
      
      if (backgroundSyncTriggered) {
        toast.success('Background sync started');
        return;
      }
      
      // Fallback to immediate sync
      const result = await offlineAttendanceService.syncOfflineRecords();
      
      toast.dismiss('offline-sync');
      
      if (result.success > 0) {
        toast.success(`Successfully synced ${result.success} attendance records`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to sync ${result.failed} records`);
      }
      
      if (result.success === 0 && result.failed === 0) {
        toast.success('No offline records to sync');
      }
      
      // Refresh stats after sync
      refreshOfflineStats();
    } catch (error) {
      console.error('Failed to sync offline records:', error);
      toast.error('Failed to sync offline records');
    }
  }, [isOnline, refreshOfflineStats]);

  // Initialize offline service and set up event listeners
  useEffect(() => {
    // Initialize the offline service
    offlineAttendanceService.init();
    
    // Set up network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Network connection restored');
      
      // Auto-sync when coming back online
      if (offlineStats.unsynced > 0) {
        toast.loading('Syncing offline attendance records...', { id: 'offline-sync' });
        syncOfflineRecords();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network connection lost. Offline mode enabled.');
      setOfflineMode(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for background sync completion events
    const handleSyncComplete = (event: CustomEvent) => {
      const { success, failed } = event.detail;
      
      if (success > 0) {
        toast.success(`Background sync completed: ${success} records synced`);
      }
      
      if (failed > 0) {
        toast.error(`Background sync: ${failed} records failed to sync`);
      }
      
      // Refresh stats after background sync
      refreshOfflineStats();
    };
    
    window.addEventListener('attendance-sync-complete', handleSyncComplete as EventListener);
    
    // Check for unsynchronized records on initial load
    refreshOfflineStats();
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('attendance-sync-complete', handleSyncComplete as EventListener);
    };
  }, [offlineStats.unsynced, refreshOfflineStats, syncOfflineRecords]);

  // Update stats whenever offline mode or online status changes
  useEffect(() => {
    refreshOfflineStats();
    
    // Set up periodic refresh of offline stats
    const intervalId = setInterval(refreshOfflineStats, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [isOnline, offlineMode, refreshOfflineStats]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        offlineMode,
        offlineStats,
        syncOfflineRecords,
        setOfflineMode
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineProvider;
