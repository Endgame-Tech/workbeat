import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import pushNotificationService from '../../services/pushNotificationService';
import { useWebSocket } from './WebSocketProvider';
import { useAuth } from './AuthContext';

interface NotificationPreferences {
  enabled: boolean;
  attendanceUpdates: boolean;
  lateArrivals: boolean;
  systemAlerts: boolean;
  sound: boolean;
  vibration: boolean;
}

interface NotificationContextType {
  isSupported: boolean;
  hasPermission: boolean;
  preferences: NotificationPreferences;
  isInitialized: boolean;
  // Methods
  requestPermission: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  showTestNotification: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Notification methods
  showAttendanceNotification: (data: {
    employeeName: string;
    type: 'sign-in' | 'sign-out';
    isLate?: boolean;
    timestamp: string;
    organizationName?: string;
  }) => Promise<boolean>;
  showSystemNotification: (message: string, type?: 'info' | 'warning' | 'error') => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  autoSetup?: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  autoSetup = true 
}) => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected, onAttendanceUpdate } = useWebSocket();

  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    attendanceUpdates: true,
    lateArrivals: true,
    systemAlerts: true,
    sound: true,
    vibration: true
  });

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('🔔 Cannot request permission: notifications not supported');
      return false;
    }

    try {
      const granted = await pushNotificationService.setup();
      setHasPermission(granted);
      setIsInitialized(granted);

      if (granted) {
        console.log('🔔 Push notification permission granted and service initialized');
        
        // Show welcome notification
        await pushNotificationService.showSystemNotification(
          'Push notifications are now enabled for WorkBeat!',
          'info'
        );
      } else {
        console.warn('🔔 Push notification permission denied');
      }

      return granted;
    } catch (error) {
      console.error('🔔 Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log('🔔 Initializing notification provider...');
      
      const supported = pushNotificationService.isNotificationSupported();
      setIsSupported(supported);
      
      if (!supported) {
        console.warn('🔔 Push notifications not supported in this browser');
        return;
      }

      // Load saved preferences
      const savedPreferences = pushNotificationService.loadPreferences();
      setPreferences(savedPreferences);

      // Check current permission status
      const permissionStatus = pushNotificationService.getPermissionStatus();
      setHasPermission(permissionStatus.granted);

      // Initialize service if permission already granted
      if (permissionStatus.granted) {
        await pushNotificationService.initialize();
        setIsInitialized(true);
      }

      console.log('🔔 Notification provider initialized', {
        supported,
        hasPermission: permissionStatus.granted,
        preferences: savedPreferences
      });
    };

    initializeNotifications();
  }, []);

  // Auto-setup notifications when user is authenticated
  useEffect(() => {
    if (autoSetup && isAuthenticated && isSupported && !hasPermission && preferences.enabled) {
      // Small delay to avoid immediately prompting on login
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [autoSetup, isAuthenticated, isSupported, hasPermission, preferences.enabled, requestPermission]);

  // Update notification preferences
  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPrefs };
    setPreferences(updatedPreferences);
    pushNotificationService.savePreferences(updatedPreferences);
    
    console.log('🔔 Notification preferences updated:', updatedPreferences);
    
    // If notifications are being disabled, clear any active ones
    if (!updatedPreferences.enabled && hasPermission) {
      pushNotificationService.clearNotifications();
    }
  }, [preferences, hasPermission]);

  // Show test notification
  const showTestNotification = useCallback(async (): Promise<void> => {
    if (!hasPermission) {
      console.warn('🔔 Cannot show test notification: permission not granted');
      return;
    }

    await pushNotificationService.showNotification({
      title: 'WorkBeat Test Notification',
      body: 'This is a test notification to verify your settings are working correctly.',
      tag: 'test-notification',
      data: { type: 'test' }
    });
  }, [hasPermission]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async (): Promise<void> => {
    await pushNotificationService.clearNotifications();
  }, []);

  // Show attendance notification
  const showAttendanceNotification = useCallback(async (attendanceData: {
    employeeName: string;
    type: 'sign-in' | 'sign-out';
    isLate?: boolean;
    timestamp: string;
    organizationName?: string;
  }): Promise<boolean> => {
    if (!hasPermission || !preferences.enabled) {
      return false;
    }

    // Check if attendance notifications are enabled
    if (!preferences.attendanceUpdates) {
      return false;
    }

    // Check if late arrival notifications are enabled (if applicable)
    if (attendanceData.isLate && !preferences.lateArrivals) {
      return false;
    }

    return await pushNotificationService.showAttendanceNotification(attendanceData);
  }, [hasPermission, preferences]);

  // Show system notification
  const showSystemNotification = useCallback(async (
    message: string, 
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<boolean> => {
    if (!hasPermission || !preferences.enabled || !preferences.systemAlerts) {
      return false;
    }

    return await pushNotificationService.showSystemNotification(message, type);
  }, [hasPermission, preferences]);

  // Handle real-time attendance updates from WebSocket
  useEffect(() => {
    if (!isConnected || !hasPermission || !preferences.enabled || !preferences.attendanceUpdates) {
      return;
    }

    interface AttendanceUpdateData {
      employeeName: string;
      type: 'sign-in' | 'sign-out';
      isLate?: boolean;
      timestamp: string;
      organizationName?: string;
    }

    const handleAttendanceUpdate = async (attendanceData: AttendanceUpdateData) => {
      console.log('🔔 Processing attendance notification:', attendanceData);
      
      // Show notification for attendance updates
      await showAttendanceNotification({
        employeeName: attendanceData.employeeName,
        type: attendanceData.type,
        isLate: attendanceData.isLate,
        timestamp: attendanceData.timestamp,
        organizationName: user?.organization?.name
      });
    };

    // Subscribe to WebSocket attendance updates
    const unsubscribe = onAttendanceUpdate(handleAttendanceUpdate);

    return () => {
      unsubscribe();
    };
  }, [
    isConnected, 
    hasPermission, 
    preferences, 
    onAttendanceUpdate, 
    showAttendanceNotification,
    user?.organization?.name
  ]);

  // Handle service worker messages
  useEffect(() => {
    if (!isInitialized) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'notification-navigate':
          console.log('🔔 Notification navigation requested:', data);
          // Handle navigation based on notification data
          // This could trigger route changes in your app
          break;

        case 'notification-closed':
          console.log('🔔 Notification closed:', data);
          // Handle notification closure analytics
          break;

        default:
          console.log('🔔 Unknown service worker message:', type, data);
      }
    };

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [isInitialized]);

  const contextValue: NotificationContextType = {
    isSupported,
    hasPermission,
    preferences,
    isInitialized,
    requestPermission,
    updatePreferences,
    showTestNotification,
    clearAllNotifications,
    showAttendanceNotification,
    showSystemNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;