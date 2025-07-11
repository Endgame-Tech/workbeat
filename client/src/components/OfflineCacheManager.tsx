import React from 'react';
import { Database, Download, Trash2, RefreshCw, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { useOfflineDataCache } from './context/OfflineDataCacheProvider';
import { useOffline } from './context/OfflineContext';
import Button from './ui/Button';

interface OfflineCacheManagerProps {
  className?: string;
  showStats?: boolean;
  showActions?: boolean;
}

const OfflineCacheManager: React.FC<OfflineCacheManagerProps> = ({ 
  className = '',
  showStats = true,
  showActions = true
}) => {
  const { 
    isInitialized, 
    cacheStats, 
    clearAllCache, 
    refreshCacheStats, 
    preloadCriticalData,
    isCacheAvailable,
    lastCleanup
  } = useOfflineDataCache();

  const { isOnline } = useOffline();

  if (!isInitialized || !isCacheAvailable) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}>
        <Database size={16} className="text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Offline cache not available
        </span>
      </div>
    );
  }

  const formatCacheSize = (count: number) => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}k`;
  };

  const formatLastCleanup = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={16} className="text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Offline</span>
          </>
        )}
      </div>

      {/* Cache Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                API Cache
              </span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {formatCacheSize(cacheStats.apiResponses)}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive size={14} className="text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Total Items
              </span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatCacheSize(cacheStats.totalSize)}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Employees
              </span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {formatCacheSize(cacheStats.employees)}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className="text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Analytics
              </span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {formatCacheSize(cacheStats.analytics)}
            </div>
          </div>
        </div>
      )}

      {/* Cache Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <div>Last cleanup: {formatLastCleanup(lastCleanup)}</div>
        <div>Organizations: {cacheStats.organizations}</div>
        <div>Settings: {cacheStats.settings}</div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={refreshCacheStats}
            leftIcon={<RefreshCw size={12} />}
            className="text-xs"
          >
            Refresh
          </Button>

          {isOnline && (
            <Button
              size="xs"
              variant="ghost"
              onClick={preloadCriticalData}
              leftIcon={<Download size={12} />}
              className="text-xs"
            >
              Preload Data
            </Button>
          )}

          <Button
            size="xs"
            variant="ghost"
            onClick={clearAllCache}
            leftIcon={<Trash2 size={12} />}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Clear Cache
          </Button>
        </div>
      )}
    </div>
  );
};

export default OfflineCacheManager;