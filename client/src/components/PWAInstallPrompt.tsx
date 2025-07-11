import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Plus } from 'lucide-react';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  className?: string;
  autoShow?: boolean;
  showInstructions?: boolean;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  className = '',
  autoShow = true,
  showInstructions = true
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'ios' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if PWA is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isIOS) return 'ios';
      if (isMobile) return 'mobile';
      return 'desktop';
    };

    setPlatform(detectPlatform());

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Auto-show modal if enabled and not dismissed
      if (autoShow && !isDismissed && !isInstalled) {
        setTimeout(() => setShowModal(true), 2000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowModal(false);
      console.log('📱 PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [autoShow, isDismissed, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('📱 User accepted PWA install');
      } else {
        console.log('📱 User dismissed PWA install');
        setIsDismissed(true);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error during PWA install:', error);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install WorkBeat on iOS',
          steps: [
            'Tap the Share button in Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install WorkBeat'
          ],
          icon: <Smartphone size={24} className="text-blue-500" />
        };
      case 'mobile':
        return {
          title: 'Install WorkBeat on Android',
          steps: [
            'Tap the menu (⋮) in your browser',
            'Select "Add to Home screen" or "Install app"',
            'Tap "Install" to add WorkBeat to your device'
          ],
          icon: <Smartphone size={24} className="text-green-500" />
        };
      case 'desktop':
        return {
          title: 'Install WorkBeat on Desktop',
          steps: [
            'Click the install icon in your browser\'s address bar',
            'Or use the "Install WorkBeat" button below',
            'WorkBeat will appear in your apps menu'
          ],
          icon: <Monitor size={24} className="text-purple-500" />
        };
      default:
        return {
          title: 'Install WorkBeat',
          steps: ['Use your browser\'s install option to add WorkBeat to your device'],
          icon: <Download size={24} className="text-gray-500" />
        };
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const instructions = getInstallInstructions();

  // Inline install button
  if (!showModal && isInstallable && !isDismissed) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="flex items-center gap-2">
          <Download size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Install WorkBeat as an app
          </span>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            size="xs"
            variant="secondary"
            onClick={handleInstallClick}
            leftIcon={<Plus size={12} />}
          >
            Install
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700"
          >
            <X size={12} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Manual install trigger button */}
      {!showModal && (isInstallable || platform === 'ios') && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowModal(true)}
          leftIcon={<Download size={16} />}
          className={`text-blue-600 hover:text-blue-700 dark:text-blue-400 ${className}`}
        >
          Install App
        </Button>
      )}

      {/* Install modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={instructions.title}
        className="max-w-md"
      >
        <div className="space-y-4">
          {/* Icon and description */}
          <div className="flex items-center gap-3">
            {instructions.icon}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Get the full WorkBeat experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Install WorkBeat for faster access, offline functionality, and push notifications.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              App Features:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Faster loading and better performance</li>
              <li>• Works offline with automatic sync</li>
              <li>• Push notifications for attendance updates</li>
              <li>• Native app-like experience</li>
            </ul>
          </div>

          {/* Installation instructions */}
          {showInstructions && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Installation Steps:
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            {isInstallable && deferredPrompt && (
              <Button
                onClick={handleInstallClick}
                leftIcon={<Download size={16} />}
                className="flex-1"
              >
                Install Now
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className={isInstallable && deferredPrompt ? '' : 'flex-1'}
            >
              {isInstallable && deferredPrompt ? 'Maybe Later' : 'Got It'}
            </Button>
          </div>

          {/* Dismiss option */}
          <div className="text-center">
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Don't show this again
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PWAInstallPrompt;