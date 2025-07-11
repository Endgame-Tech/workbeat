import React from 'react';
import { Smartphone, Monitor, Download, Check } from 'lucide-react';
import { usePWA } from './context/PWAProvider';
import PWAInstallPrompt from './PWAInstallPrompt';

interface PWAStatusProps {
  className?: string;
  showInstallPrompt?: boolean;
  compact?: boolean;
}

const PWAStatus: React.FC<PWAStatusProps> = ({ 
  className = '',
  showInstallPrompt = true,
  compact = false
}) => {
  const { isInstalled, platform, canInstall } = usePWA();

  const getPlatformIcon = () => {
    switch (platform) {
      case 'mobile':
      case 'ios':
        return <Smartphone size={16} className="text-blue-500" />;
      case 'desktop':
        return <Monitor size={16} className="text-purple-500" />;
      default:
        return <Download size={16} className="text-gray-500" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'ios':
        return 'iOS';
      case 'mobile':
        return 'Mobile';
      case 'desktop':
        return 'Desktop';
      default:
        return 'Browser';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getPlatformIcon()}
        {isInstalled ? (
          <div className="flex items-center gap-1">
            <Check size={14} className="text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">Installed</span>
          </div>
        ) : showInstallPrompt && canInstall ? (
          <PWAInstallPrompt className="text-xs" />
        ) : (
          <span className="text-xs text-gray-500">Web App</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        {getPlatformIcon()}
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {isInstalled ? 'App Installed' : `WorkBeat for ${getPlatformName()}`}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isInstalled 
              ? 'You\'re using the installed app version'
              : canInstall 
                ? 'Install for a better experience'
                : 'Running in browser mode'
            }
          </div>
        </div>
        {isInstalled && (
          <Check size={20} className="text-green-500 ml-auto" />
        )}
      </div>

      {/* Install prompt */}
      {!isInstalled && showInstallPrompt && canInstall && (
        <PWAInstallPrompt autoShow={false} />
      )}

      {/* PWA features info */}
      {!isInstalled && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Install WorkBeat for:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Faster loading and performance</li>
            <li>• Offline functionality</li>
            <li>• Push notifications</li>
            <li>• Native app experience</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;