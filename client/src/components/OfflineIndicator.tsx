import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useOffline } from './context/useOffline';
import { useOfflineDataCache } from './context/OfflineDataCacheProvider';
import Button from './ui/Button';
import OfflineCacheManager from './OfflineCacheManager';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, offlineMode, offlineStats, syncOfflineRecords, setOfflineMode } = useOffline();
  const { cacheStats, isCacheAvailable } = useOfflineDataCache();
  const [showCacheDetails, setShowCacheDetails] = useState(false);

  // Show indicator if offline, in offline mode, has unsynced records, or has cached data
  const shouldShow = !isOnline || offlineMode || offlineStats.unsynced > 0 || 
                    (isCacheAvailable && cacheStats.totalSize > 0);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`flex items-center gap-2 rounded-md p-2 ${
        !isOnline 
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
          : offlineMode 
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      }`}>
        {!isOnline ? (
          <>
            <WifiOff size={16} />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        ) : offlineMode ? (
          <>
            <WifiOff size={16} />
            <span className="text-sm font-medium">Manual Offline Mode</span>
            <Button 
              size="xs"
              variant="ghost" 
              onClick={() => setOfflineMode(false)}
              className="ml-1"
            >
              Go Online
            </Button>
          </>
        ) : (
          <>
            <Wifi size={16} />
            <span className="text-sm font-medium">
              {offlineStats.unsynced} offline {offlineStats.unsynced === 1 ? 'record' : 'records'}
            </span>
            <Button 
              size="xs"
              variant="ghost" 
              onClick={syncOfflineRecords}
              leftIcon={<RefreshCw size={12} />}
              className="ml-1"
            >
              Sync Now
            </Button>
          </>
        )}

        {/* Cache info toggle */}
        {isCacheAvailable && cacheStats.totalSize > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setShowCacheDetails(!showCacheDetails)}
            leftIcon={<Database size={12} />}
            rightIcon={showCacheDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            className="ml-auto"
          >
            Cache ({cacheStats.totalSize})
          </Button>
        )}
      </div>

      {/* Expandable cache details */}
      {showCacheDetails && isCacheAvailable && (
        <div className="bg-white dark:bg-gray-800 rounded-md border p-3">
          <OfflineCacheManager showStats={true} showActions={true} />
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
