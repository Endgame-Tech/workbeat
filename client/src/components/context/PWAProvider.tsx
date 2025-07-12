import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  platform: 'desktop' | 'mobile' | 'ios' | 'unknown';
  isOnline: boolean;
  showInstallPrompt: () => void;
  dismissInstallPrompt: () => void;
  canInstall: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isInstallable: false,
  platform: 'unknown',
  isOnline: true,
  showInstallPrompt: () => {},
  dismissInstallPrompt: () => {},
  canInstall: false
});

export const usePWA = () => useContext(PWAContext);

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'ios' | 'unknown'>('unknown');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isIOS) return 'ios';
      if (isMobile) return 'mobile';
      return 'desktop';
    };

    setPlatform(detectPlatform());

    // Check if PWA is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone) ||
                          document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('📱 PWA install prompt available');
    };

    // Listen for PWA installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
      console.log('📱 PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker registration and updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('📱 Service Worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('📱 New service worker available');
                  // You could show an update notification here
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!installPromptEvent) return;

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('📱 User accepted PWA install');
      } else {
        console.log('📱 User dismissed PWA install');
      }
      
      setInstallPromptEvent(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ Error showing install prompt:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setInstallPromptEvent(null);
    setIsInstallable(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const canInstall = isInstallable || platform === 'ios';

  const contextValue: PWAContextType = {
    isInstalled,
    isInstallable,
    platform,
    isOnline,
    showInstallPrompt,
    dismissInstallPrompt,
    canInstall
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
};

export default PWAProvider;